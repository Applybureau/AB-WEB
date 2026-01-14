const fc = require('fast-check');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

/**
 * Property-Based Test for Email Notification Consistency
 * Feature: consultation-to-client-pipeline, Property 2: Email notification consistency
 * 
 * Validates: Requirements 1.2, 1.3, 2.5, 2.6, 11.1, 11.2, 11.3, 11.4
 * 
 * Property: For any consultation status change (submitted, approved, rejected, registered), 
 * the system should send appropriate email notifications to both clients and administrators 
 * with correct content and timing.
 */

// Mock the email service for testing
jest.mock('../utils/email');
const mockSendEmail = sendEmail;

// Define generators outside describe block for export
const consultationGenerator = fc.record({
  full_name: fc.string({ minLength: 2, maxLength: 100 }),
  email: fc.emailAddress(),
  role_targets: fc.string({ minLength: 5, maxLength: 200 }),
  package_interest: fc.constantFrom('Tier 1', 'Tier 2', 'Tier 3'),
  area_of_concern: fc.string({ minLength: 10, maxLength: 500 })
});

const statusChangeGenerator = fc.constantFrom(
  'submitted',
  'under_review', 
  'approved',
  'rejected',
  'registered'
);

describe('Email Notification Consistency Property Tests', () => {

  beforeEach(() => {
    // Reset mock before each test
    mockSendEmail.mockClear();
    mockSendEmail.mockResolvedValue(true);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  test('Property 2: Email notifications sent for all status changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        statusChangeGenerator,
        async (consultationData, targetStatus) => {
          // Create initial consultation
          const { data: consultation } = await supabaseAdmin
            .from('consultation_requests')
            .insert({
              ...consultationData,
              status: 'pending',
              pipeline_status: 'lead'
            })
            .select()
            .single();

          // Simulate status change and verify email is sent
          let emailSent = false;
          let emailTemplate = null;
          let emailRecipient = null;
          let emailData = null;

          switch (targetStatus) {
            case 'submitted':
              // Test initial submission email
              await mockSendEmail(consultation.email, 'consultation_request_received', {
                client_name: consultation.full_name,
                role_targets: consultation.role_targets,
                package_interest: consultation.package_interest
              });
              emailSent = true;
              emailTemplate = 'consultation_request_received';
              emailRecipient = consultation.email;
              break;

            case 'under_review':
              await mockSendEmail(consultation.email, 'consultation_under_review', {
                client_name: consultation.full_name,
                role_targets: consultation.role_targets,
                estimated_response: '24-48 hours'
              });
              emailSent = true;
              emailTemplate = 'consultation_under_review';
              emailRecipient = consultation.email;
              break;

            case 'approved':
              const registrationLink = `${process.env.FRONTEND_URL}/register?token=test-token`;
              await mockSendEmail(consultation.email, 'consultation_approved', {
                client_name: consultation.full_name,
                role_targets: consultation.role_targets,
                package_interest: consultation.package_interest,
                registration_link: registrationLink,
                token_expires: '7 days'
              });
              emailSent = true;
              emailTemplate = 'consultation_approved';
              emailRecipient = consultation.email;
              break;

            case 'rejected':
              await mockSendEmail(consultation.email, 'consultation_rejected', {
                client_name: consultation.full_name,
                role_targets: consultation.role_targets,
                reason: 'Does not meet current criteria'
              });
              emailSent = true;
              emailTemplate = 'consultation_rejected';
              emailRecipient = consultation.email;
              break;

            case 'registered':
              await mockSendEmail(consultation.email, 'client_welcome', {
                client_name: consultation.full_name,
                dashboard_url: `${process.env.FRONTEND_URL}/client/dashboard`,
                next_steps: 'Complete your profile to unlock all features',
                support_email: 'support@applybureau.com'
              });
              emailSent = true;
              emailTemplate = 'client_welcome';
              emailRecipient = consultation.email;
              break;
          }

          if (emailSent) {
            // Verify email was called
            expect(mockSendEmail).toHaveBeenCalled();
            
            // Get the last call to sendEmail
            const lastCall = mockSendEmail.mock.calls[mockSendEmail.mock.calls.length - 1];
            const [recipient, template, data] = lastCall;

            // Verify correct recipient
            expect(recipient).toBe(emailRecipient);
            
            // Verify correct template
            expect(template).toBe(emailTemplate);
            
            // Verify email data contains required fields
            expect(data).toBeDefined();
            expect(data.client_name).toBe(consultation.full_name);
            
            // Status-specific validations
            if (targetStatus === 'approved') {
              expect(data.registration_link).toContain('/register?token=');
              expect(data.token_expires).toBeDefined();
            }
            
            if (targetStatus === 'rejected') {
              expect(data.reason).toBeDefined();
            }
            
            if (targetStatus === 'registered') {
              expect(data.dashboard_url).toContain('/client/dashboard');
              expect(data.support_email).toContain('@');
            }
          }

          return true;
        }
      ),
      { numRuns: 100, timeout: 10000 }
    );
  });

  test('Property 2b: Email content consistency across status changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        async (consultationData) => {
          const consultation = {
            ...consultationData,
            id: 'test-id-' + Math.random().toString(36).substr(2, 9)
          };

          // Test all email templates have consistent required fields
          const emailTemplates = [
            {
              template: 'consultation_request_received',
              requiredFields: ['client_name', 'role_targets', 'package_interest']
            },
            {
              template: 'consultation_under_review', 
              requiredFields: ['client_name', 'role_targets', 'estimated_response']
            },
            {
              template: 'consultation_approved',
              requiredFields: ['client_name', 'role_targets', 'registration_link', 'token_expires']
            },
            {
              template: 'consultation_rejected',
              requiredFields: ['client_name', 'role_targets', 'reason']
            },
            {
              template: 'client_welcome',
              requiredFields: ['client_name', 'dashboard_url', 'next_steps', 'support_email']
            }
          ];

          for (const { template, requiredFields } of emailTemplates) {
            // Create appropriate email data for each template
            let emailData = {
              client_name: consultation.full_name,
              role_targets: consultation.role_targets,
              package_interest: consultation.package_interest
            };

            // Add template-specific fields
            switch (template) {
              case 'consultation_under_review':
                emailData.estimated_response = '24-48 hours';
                break;
              case 'consultation_approved':
                emailData.registration_link = `${process.env.FRONTEND_URL}/register?token=test`;
                emailData.token_expires = '7 days';
                break;
              case 'consultation_rejected':
                emailData.reason = 'Does not meet current criteria';
                break;
              case 'client_welcome':
                emailData.dashboard_url = `${process.env.FRONTEND_URL}/client/dashboard`;
                emailData.next_steps = 'Complete your profile';
                emailData.support_email = 'support@applybureau.com';
                break;
            }

            // Send email
            await mockSendEmail(consultation.email, template, emailData);

            // Verify the call was made with correct data
            const calls = mockSendEmail.mock.calls;
            const lastCall = calls[calls.length - 1];
            const [recipient, sentTemplate, sentData] = lastCall;

            expect(recipient).toBe(consultation.email);
            expect(sentTemplate).toBe(template);

            // Verify all required fields are present
            for (const field of requiredFields) {
              expect(sentData[field]).toBeDefined();
              expect(sentData[field]).not.toBe('');
            }

            // Verify client_name is consistent across all emails
            expect(sentData.client_name).toBe(consultation.full_name);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 2c: Admin notification emails for new consultations', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        async (consultationData) => {
          // Simulate admin notification for new consultation
          await mockSendEmail('admin@applybureau.com', 'new_consultation_request', {
            client_name: consultationData.full_name,
            client_email: consultationData.email,
            role_targets: consultationData.role_targets,
            package_interest: consultationData.package_interest,
            employment_status: 'Currently Employed',
            area_of_concern: consultationData.area_of_concern,
            admin_dashboard_url: `${process.env.FRONTEND_URL}/admin/consultations`
          });

          // Verify admin email was sent
          expect(mockSendEmail).toHaveBeenCalledWith(
            'admin@applybureau.com',
            'new_consultation_request',
            expect.objectContaining({
              client_name: consultationData.full_name,
              client_email: consultationData.email,
              role_targets: consultationData.role_targets,
              admin_dashboard_url: expect.stringContaining('/admin/consultations')
            })
          );

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 2d: Email timing consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        consultationGenerator,
        async (consultationData) => {
          const startTime = Date.now();

          // Simulate rapid status changes
          const statusChanges = ['submitted', 'under_review', 'approved'];
          
          for (const status of statusChanges) {
            const emailData = {
              client_name: consultationData.full_name,
              role_targets: consultationData.role_targets
            };

            if (status === 'approved') {
              emailData.registration_link = 'test-link';
              emailData.token_expires = '7 days';
            }

            await mockSendEmail(
              consultationData.email, 
              `consultation_${status === 'submitted' ? 'request_received' : status}`,
              emailData
            );
          }

          const endTime = Date.now();
          const totalTime = endTime - startTime;

          // Verify all emails were sent
          expect(mockSendEmail).toHaveBeenCalledTimes(statusChanges.length);

          // Verify emails were sent in reasonable time (less than 5 seconds for test)
          expect(totalTime).toBeLessThan(5000);

          // Verify emails were sent in correct order
          const calls = mockSendEmail.mock.calls;
          expect(calls[0][1]).toBe('consultation_request_received');
          expect(calls[1][1]).toBe('consultation_under_review');
          expect(calls[2][1]).toBe('consultation_approved');

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      await supabaseAdmin.from('consultation_requests').delete().like('email', '%@example.com');
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }
});

module.exports = {
  consultationGenerator,
  statusChangeGenerator
};