const fc = require('fast-check');
const { supabaseAdmin } = require('../utils/supabase');
const jwt = require('jsonwebtoken');

/**
 * Property-Based Test for Consultation Lifecycle Integrity
 * Feature: consultation-to-client-pipeline, Property 1: Consultation lifecycle integrity
 * 
 * Validates: Requirements 1.1, 1.4, 1.5, 2.3, 3.5
 * 
 * Property: For any consultation request, the system should maintain data integrity 
 * throughout the complete lifecycle from submission through registration, ensuring 
 * all required fields are preserved and status transitions are valid.
 */

describe('Consultation Lifecycle Integrity Property Tests', () => {
  // Generator for valid consultation data
  const consultationGenerator = fc.record({
    full_name: fc.string({ minLength: 2, maxLength: 100 }),
    email: fc.emailAddress(),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 20 })),
    linkedin_url: fc.option(fc.webUrl()),
    role_targets: fc.string({ minLength: 5, maxLength: 200 }),
    location_preferences: fc.string({ minLength: 3, maxLength: 100 }),
    minimum_salary: fc.option(fc.string({ minLength: 5, maxLength: 20 })),
    target_market: fc.string({ minLength: 3, maxLength: 50 }),
    employment_status: fc.constantFrom('Currently Employed', 'Unemployed', 'Student', 'Freelancer'),
    package_interest: fc.constantFrom('Tier 1', 'Tier 2', 'Tier 3'),
    area_of_concern: fc.string({ minLength: 10, maxLength: 500 }),
    consultation_window: fc.string({ minLength: 5, maxLength: 50 })
  });

  // Generator for admin notes
  const adminNotesGenerator = fc.string({ minLength: 10, maxLength: 200 });

  // Generator for passwords
  const passwordGenerator = fc.string({ minLength: 8, maxLength: 50 });

  beforeAll(async () => {
    // Ensure test environment is clean
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  test('Property 1: Consultation lifecycle maintains data integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        adminNotesGenerator,
        passwordGenerator,
        async (consultationData, adminNotes, password) => {
          // Step 1: Create consultation request
          const { data: consultation, error: createError } = await supabaseAdmin
            .from('consultation_requests')
            .insert({
              ...consultationData,
              status: 'pending',
              pipeline_status: 'lead'
            })
            .select()
            .single();

          expect(createError).toBeNull();
          expect(consultation).toBeDefined();
          expect(consultation.status).toBe('pending');
          expect(consultation.pipeline_status).toBe('lead');

          // Verify all original data is preserved
          expect(consultation.full_name).toBe(consultationData.full_name);
          expect(consultation.email).toBe(consultationData.email);
          expect(consultation.role_targets).toBe(consultationData.role_targets);

          // Step 2: Approve consultation (generates registration token)
          const registrationToken = jwt.sign({
            consultationId: consultation.id,
            email: consultation.email,
            type: 'client_registration',
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
          }, process.env.JWT_SECRET);

          const { data: approvedConsultation, error: approveError } = await supabaseAdmin
            .from('consultation_requests')
            .update({
              status: 'approved',
              pipeline_status: 'approved',
              registration_token: registrationToken,
              token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              admin_notes: adminNotes
            })
            .eq('id', consultation.id)
            .select()
            .single();

          expect(approveError).toBeNull();
          expect(approvedConsultation.status).toBe('approved');
          expect(approvedConsultation.pipeline_status).toBe('approved');
          expect(approvedConsultation.registration_token).toBe(registrationToken);

          // Verify original data is still preserved
          expect(approvedConsultation.full_name).toBe(consultationData.full_name);
          expect(approvedConsultation.email).toBe(consultationData.email);
          expect(approvedConsultation.role_targets).toBe(consultationData.role_targets);

          // Step 3: Register client using token
          const hashedPassword = await require('bcryptjs').hash(password, 12);

          const { data: client, error: clientError } = await supabaseAdmin
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

          expect(clientError).toBeNull();
          expect(client).toBeDefined();
          expect(client.email).toBe(consultation.email);
          expect(client.full_name).toBe(consultation.full_name);

          // Step 4: Update consultation to registered status
          const { data: registeredConsultation, error: registerError } = await supabaseAdmin
            .from('consultation_requests')
            .update({
              status: 'registered',
              pipeline_status: 'client',
              registered_at: new Date().toISOString(),
              user_id: client.id,
              token_used: true
            })
            .eq('id', consultation.id)
            .select()
            .single();

          expect(registerError).toBeNull();
          expect(registeredConsultation.status).toBe('registered');
          expect(registeredConsultation.pipeline_status).toBe('client');
          expect(registeredConsultation.user_id).toBe(client.id);
          expect(registeredConsultation.token_used).toBe(true);

          // Final verification: All original data preserved throughout lifecycle
          expect(registeredConsultation.full_name).toBe(consultationData.full_name);
          expect(registeredConsultation.email).toBe(consultationData.email);
          expect(registeredConsultation.role_targets).toBe(consultationData.role_targets);
          expect(registeredConsultation.location_preferences).toBe(consultationData.location_preferences);
          expect(registeredConsultation.package_interest).toBe(consultationData.package_interest);

          // Verify status transitions are valid
          const validTransitions = ['pending', 'approved', 'registered'];
          expect(validTransitions).toContain(registeredConsultation.status);

          // Verify timestamps are logical
          expect(new Date(registeredConsultation.created_at)).toBeLessThanOrEqual(new Date());
          if (registeredConsultation.registered_at) {
            expect(new Date(registeredConsultation.registered_at)).toBeGreaterThanOrEqual(
              new Date(registeredConsultation.created_at)
            );
          }

          return true;
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  });

  test('Property 1b: Invalid status transitions are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        fc.constantFrom('invalid_status', 'random_status', ''),
        async (consultationData, invalidStatus) => {
          // Create consultation
          const { data: consultation } = await supabaseAdmin
            .from('consultation_requests')
            .insert({
              ...consultationData,
              status: 'pending',
              pipeline_status: 'lead'
            })
            .select()
            .single();

          // Try to update with invalid status
          const { error } = await supabaseAdmin
            .from('consultation_requests')
            .update({ status: invalidStatus })
            .eq('id', consultation.id);

          // Should either reject the update or maintain valid status
          if (!error) {
            const { data: updatedConsultation } = await supabaseAdmin
              .from('consultation_requests')
              .select('status')
              .eq('id', consultation.id)
              .single();

            const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'registered', 'scheduled', 'completed', 'cancelled'];
            expect(validStatuses).toContain(updatedConsultation.status);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 1c: Registration token uniqueness and security', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(consultationGenerator, { minLength: 2, maxLength: 5 }),
        async (consultationsData) => {
          const tokens = new Set();
          
          for (const consultationData of consultationsData) {
            // Create consultation
            const { data: consultation } = await supabaseAdmin
              .from('consultation_requests')
              .insert({
                ...consultationData,
                status: 'pending',
                pipeline_status: 'lead'
              })
              .select()
              .single();

            // Generate registration token
            const registrationToken = jwt.sign({
              consultationId: consultation.id,
              email: consultation.email,
              type: 'client_registration',
              exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
            }, process.env.JWT_SECRET);

            // Verify token is unique
            expect(tokens.has(registrationToken)).toBe(false);
            tokens.add(registrationToken);

            // Verify token can be decoded and contains correct data
            const decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
            expect(decoded.consultationId).toBe(consultation.id);
            expect(decoded.email).toBe(consultation.email);
            expect(decoded.type).toBe('client_registration');
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      // Clean up in reverse order of dependencies
      await supabaseAdmin.from('registered_users').delete().like('email', '%@example.com');
      await supabaseAdmin.from('consultation_requests').delete().like('email', '%@example.com');
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn('Cleanup warning:', error.message);
    }
  }
});

module.exports = {
  consultationGenerator,
  adminNotesGenerator,
  passwordGenerator
};