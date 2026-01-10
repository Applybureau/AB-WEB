const fc = require('fast-check');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

// Mock email sending to avoid actual email sends during tests
jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ id: 'mock-email-id' })
}));

describe('Consultation Lifecycle Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      await supabaseAdmin
        .from('consultation_requests')
        .delete()
        .like('email', '%test-property%');
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

  /**
   * Feature: consultation-to-client-pipeline, Property 1: Consultation lifecycle integrity
   * 
   * Property 1: Consultation lifecycle integrity
   * For any consultation request, the system should maintain data integrity throughout 
   * the complete lifecycle from submission through registration, ensuring all required 
   * fields are preserved and status transitions are valid.
   * 
   * Validates: Requirements 1.1, 1.4, 1.5, 2.3, 3.5
   */
  test('Property 1: Consultation lifecycle integrity', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate consultation request data
        fc.record({
          full_name: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress().map(email => `test-property-${Date.now()}-${email}`),
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
          linkedin_url: fc.option(fc.webUrl()),
          role_targets: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length > 0),
          location_preferences: fc.string({ minLength: 2, maxLength: 50 }),
          minimum_salary: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
          target_market: fc.string({ minLength: 2, maxLength: 50 }),
          employment_status: fc.constantFrom('employed', 'unemployed', 'student', 'freelancer'),
          package_interest: fc.constantFrom('Tier 1', 'Tier 2', 'Tier 3'),
          area_of_concern: fc.string({ minLength: 5, maxLength: 200 }),
          consultation_window: fc.string({ minLength: 5, maxLength: 50 })
        }),
        // Generate status transitions
        fc.array(fc.constantFrom('approved', 'rejected'), { minLength: 1, maxLength: 1 })
      ),
      async (consultationData, statusTransitions) => {
        // Step 1: Create consultation request (Requirements 1.1, 1.4)
        const { data: consultation, error: createError } = await supabaseAdmin
          .from('consultation_requests')
          .insert({
            ...consultationData,
            status: 'pending'
          })
          .select()
          .single();

        expect(createError).toBeNull();
        expect(consultation).toBeDefined();
        expect(consultation.id).toBeDefined();
        expect(consultation.status).toBe('pending');
        
        // Verify all required fields are preserved (Requirement 1.4)
        expect(consultation.full_name).toBe(consultationData.full_name);
        expect(consultation.email).toBe(consultationData.email);
        expect(consultation.role_targets).toBe(consultationData.role_targets);
        expect(consultation.created_at).toBeDefined();

        // Step 2: Process status transitions (Requirements 2.3, 3.5)
        let currentConsultation = consultation;
        
        for (const newStatus of statusTransitions) {
          const { data: updatedConsultation, error: updateError } = await supabaseAdmin
            .from('consultation_requests')
            .update({
              status: newStatus,
              processed_at: new Date().toISOString(),
              admin_notes: `Status changed to ${newStatus}`
            })
            .eq('id', currentConsultation.id)
            .select()
            .single();

          expect(updateError).toBeNull();
          expect(updatedConsultation).toBeDefined();
          expect(updatedConsultation.status).toBe(newStatus);
          expect(updatedConsultation.processed_at).toBeDefined();
          
          // Verify data integrity is maintained (Requirement 1.5)
          expect(updatedConsultation.full_name).toBe(consultationData.full_name);
          expect(updatedConsultation.email).toBe(consultationData.email);
          expect(updatedConsultation.role_targets).toBe(consultationData.role_targets);
          expect(updatedConsultation.id).toBe(currentConsultation.id);
          
          currentConsultation = updatedConsultation;
        }

        // Step 3: If approved, verify registration token generation capability
        if (currentConsultation.status === 'approved') {
          // Generate registration token (this would be done in the main implementation)
          const registrationToken = `reg_${currentConsultation.id}_${Date.now()}`;
          
          const { data: tokenUpdate, error: tokenError } = await supabaseAdmin
            .from('consultation_requests')
            .update({
              registration_token: registrationToken
            })
            .eq('id', currentConsultation.id)
            .select()
            .single();

          expect(tokenError).toBeNull();
          expect(tokenUpdate.registration_token).toBe(registrationToken);
          
          // Verify all original data is still intact
          expect(tokenUpdate.full_name).toBe(consultationData.full_name);
          expect(tokenUpdate.email).toBe(consultationData.email);
          expect(tokenUpdate.status).toBe('approved');
        }

        // Final verification: Ensure consultation can be retrieved with all data intact
        const { data: finalConsultation, error: fetchError } = await supabaseAdmin
          .from('consultation_requests')
          .select('*')
          .eq('id', consultation.id)
          .single();

        expect(fetchError).toBeNull();
        expect(finalConsultation).toBeDefined();
        expect(finalConsultation.full_name).toBe(consultationData.full_name);
        expect(finalConsultation.email).toBe(consultationData.email);
        expect(finalConsultation.role_targets).toBe(consultationData.role_targets);
      }
    ), { numRuns: 100 });
  });
});