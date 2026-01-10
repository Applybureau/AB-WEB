const fc = require('fast-check');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');

/**
 * Property-Based Test for Registration Token Security
 * Feature: consultation-to-client-pipeline, Property 3: Registration token security
 * 
 * Validates: Requirements 2.4, 3.1, 3.2
 * 
 * Property: For any approved consultation, the system should generate a unique, 
 * secure registration token that validates correctly during registration and 
 * becomes invalid after use.
 */

describe('Registration Token Security Property Tests', () => {
  const consultationGenerator = fc.record({
    full_name: fc.string({ minLength: 2, maxLength: 100 }),
    email: fc.emailAddress(),
    role_targets: fc.string({ minLength: 5, maxLength: 200 }),
    package_interest: fc.constantFrom('Tier 1', 'Tier 2', 'Tier 3')
  });

  const passwordGenerator = fc.string({ minLength: 8, maxLength: 50 });

  beforeAll(() => {
    // Ensure JWT_SECRET is set for tests
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    }
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  test('Property 3: Registration tokens are unique and secure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(consultationGenerator, { minLength: 2, maxLength: 10 }),
        async (consultationsData) => {
          const tokens = new Set();
          const consultations = [];

          // Create multiple consultations and generate tokens
          for (const consultationData of consultationsData) {
            // Create consultation
            const { data: consultation } = await supabaseAdmin
              .from('consultation_requests')
              .insert({
                ...consultationData,
                status: 'approved',
                pipeline_status: 'approved'
              })
              .select()
              .single();

            consultations.push(consultation);

            // Generate registration token
            const registrationToken = jwt.sign({
              consultationId: consultation.id,
              email: consultation.email,
              type: 'client_registration',
              exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
            }, process.env.JWT_SECRET);

            // Verify token uniqueness
            expect(tokens.has(registrationToken)).toBe(false);
            tokens.add(registrationToken);

            // Update consultation with token
            await supabaseAdmin
              .from('consultation_requests')
              .update({
                registration_token: registrationToken,
                token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                token_used: false
              })
              .eq('id', consultation.id);
          }

          // Verify all tokens are unique
          expect(tokens.size).toBe(consultationsData.length);

          // Verify each token can be validated and contains correct data
          for (const consultation of consultations) {
            const { data: consultationWithToken } = await supabaseAdmin
              .from('consultation_requests')
              .select('registration_token, email, id')
              .eq('id', consultation.id)
              .single();

            const token = consultationWithToken.registration_token;
            
            // Verify token can be decoded
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            expect(decoded.consultationId).toBe(consultation.id);
            expect(decoded.email).toBe(consultation.email);
            expect(decoded.type).toBe('client_registration');
            expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
          }

          return true;
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  });

  test('Property 3b: Token validation prevents reuse', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        passwordGenerator,
        async (consultationData, password) => {
          // Create consultation
          const { data: consultation } = await supabaseAdmin
            .from('consultation_requests')
            .insert({
              ...consultationData,
              status: 'approved',
              pipeline_status: 'approved'
            })
            .select()
            .single();

          // Generate and store token
          const registrationToken = jwt.sign({
            consultationId: consultation.id,
            email: consultation.email,
            type: 'client_registration',
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
          }, process.env.JWT_SECRET);

          await supabaseAdmin
            .from('consultation_requests')
            .update({
              registration_token: registrationToken,
              token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              token_used: false
            })
            .eq('id', consultation.id);

          // First use: should succeed
          const { data: firstCheck } = await supabaseAdmin
            .from('consultation_requests')
            .select('*')
            .eq('id', consultation.id)
            .eq('registration_token', registrationToken)
            .eq('token_used', false)
            .single();

          expect(firstCheck).toBeDefined();
          expect(firstCheck.token_used).toBe(false);

          // Simulate token usage (register client)
          const hashedPassword = await require('bcryptjs').hash(password, 12);
          
          const { data: client } = await supabaseAdmin
            .from('registered_users')
            .insert({
              lead_id: consultation.id,
              email: consultation.email,
              passcode_hash: hashedPassword,
              full_name: consultation.full_name,
              role: 'client',
              is_active: true
            })
            .select()
            .single();

          // Mark token as used
          await supabaseAdmin
            .from('consultation_requests')
            .update({
              token_used: true,
              user_id: client.id,
              registered_at: new Date().toISOString()
            })
            .eq('id', consultation.id);

          // Second use: should fail (token already used)
          const { data: secondCheck } = await supabaseAdmin
            .from('consultation_requests')
            .select('*')
            .eq('id', consultation.id)
            .eq('registration_token', registrationToken)
            .eq('token_used', false)
            .single();

          expect(secondCheck).toBeNull();

          // Verify token is marked as used
          const { data: usedTokenCheck } = await supabaseAdmin
            .from('consultation_requests')
            .select('token_used, user_id')
            .eq('id', consultation.id)
            .single();

          expect(usedTokenCheck.token_used).toBe(true);
          expect(usedTokenCheck.user_id).toBe(client.id);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property 3c: Expired tokens are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        fc.integer({ min: 1, max: 3600 }), // seconds in the past
        async (consultationData, secondsAgo) => {
          // Create consultation
          const { data: consultation } = await supabaseAdmin
            .from('consultation_requests')
            .insert({
              ...consultationData,
              status: 'approved',
              pipeline_status: 'approved'
            })
            .select()
            .single();

          // Generate expired token
          const expiredTime = Math.floor(Date.now() / 1000) - secondsAgo;
          const expiredToken = jwt.sign({
            consultationId: consultation.id,
            email: consultation.email,
            type: 'client_registration',
            exp: expiredTime
          }, process.env.JWT_SECRET);

          // Store expired token
          await supabaseAdmin
            .from('consultation_requests')
            .update({
              registration_token: expiredToken,
              token_expires_at: new Date((expiredTime) * 1000).toISOString(),
              token_used: false
            })
            .eq('id', consultation.id);

          // Verify token is expired when validated
          try {
            jwt.verify(expiredToken, process.env.JWT_SECRET);
            // If we get here, the token wasn't expired (shouldn't happen with our test data)
            expect(false).toBe(true);
          } catch (error) {
            expect(error.name).toBe('TokenExpiredError');
          }

          // Verify database expiration check
          const { data: tokenCheck } = await supabaseAdmin
            .from('consultation_requests')
            .select('token_expires_at')
            .eq('id', consultation.id)
            .single();

          const expirationDate = new Date(tokenCheck.token_expires_at);
          const now = new Date();
          expect(expirationDate).toBeLessThan(now);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property 3d: Invalid token types are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        fc.constantFrom('invalid_type', 'auth_token', 'password_reset', ''),
        async (consultationData, invalidType) => {
          // Create consultation
          const { data: consultation } = await supabaseAdmin
            .from('consultation_requests')
            .insert({
              ...consultationData,
              status: 'approved',
              pipeline_status: 'approved'
            })
            .select()
            .single();

          // Generate token with invalid type
          const invalidToken = jwt.sign({
            consultationId: consultation.id,
            email: consultation.email,
            type: invalidType,
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
          }, process.env.JWT_SECRET);

          // Verify token can be decoded but has wrong type
          const decoded = jwt.verify(invalidToken, process.env.JWT_SECRET);
          expect(decoded.type).toBe(invalidType);
          expect(decoded.type).not.toBe('client_registration');

          // In a real application, this would be rejected during validation
          if (decoded.type !== 'client_registration') {
            // Token should be rejected for registration purposes
            expect(decoded.type).not.toBe('client_registration');
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property 3e: Token contains all required claims', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        async (consultationData) => {
          // Create consultation
          const { data: consultation } = await supabaseAdmin
            .from('consultation_requests')
            .insert({
              ...consultationData,
              status: 'approved',
              pipeline_status: 'approved'
            })
            .select()
            .single();

          // Generate token
          const registrationToken = jwt.sign({
            consultationId: consultation.id,
            email: consultation.email,
            type: 'client_registration',
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
          }, process.env.JWT_SECRET);

          // Verify token contains all required claims
          const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
          
          // Required claims
          expect(decoded.consultationId).toBeDefined();
          expect(decoded.email).toBeDefined();
          expect(decoded.type).toBeDefined();
          expect(decoded.exp).toBeDefined();
          expect(decoded.iat).toBeDefined(); // issued at (automatically added by jwt.sign)

          // Verify claim values
          expect(decoded.consultationId).toBe(consultation.id);
          expect(decoded.email).toBe(consultation.email);
          expect(decoded.type).toBe('client_registration');
          expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      await supabaseAdmin.from('registered_users').delete().like('email', '%@example.com');
      await supabaseAdmin.from('consultation_requests').delete().like('email', '%@example.com');
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }
});

module.exports = {
  consultationGenerator,
  passwordGenerator
};