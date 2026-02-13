// Complete email template overhaul based on exact specifications
// This script will rewrite ALL email templates to match the exact format required

const fs = require('fs');
const path = require('path');

console.log('🔧 COMPLETE EMAIL TEMPLATE OVERHAUL');
console.log('='.repeat(70));
console.log('');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Base template with dark mode prevention
const createBaseTemplate = (subject, title, content) => `<!-- SUBJECT: ${subject} -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
        :root {
            color-scheme: light only !important;
            supported-color-schemes: light !important;
        }
        
        @media (prefers-color-scheme: dark) {
            body, table, td, p, a, span, div, h1, h2, h3, h4, h5, h6 {
                color: #1a1a1a !important;
                background-color: #ffffff !important;
            }
            .email-container {
                background-color: #ffffff !important;
            }
        }
        
        [data-ogsc] body, [data-ogsc] table, [data-ogsc] td {
            background-color: #ffffff !important;
            color: #1a1a1a !important;
        }
        
        @media only screen and (max-width: 600px) {
            table[width="600"] {
                width: 100% !important;
            }
            td[style*="padding: 40px"] {
                padding: 20px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5; color: #1a1a1a;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 20px; background-color: #f5f5f5;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; color: #1a1a1a; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                            <img src="https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png" alt="Apply Bureau" width="220" height="auto" style="display: block; border: 0; max-width: 100%;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 40px 40px; background-color: #ffffff; color: #1a1a1a;">
${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #ffffff;">
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #64748B; font-size: 14px; margin: 0 0 10px 0; text-align: center;">
                                Questions? Contact us at <a href="mailto:hello@applybureau.com" target="_blank" rel="noopener noreferrer" style="color: #64748B; text-decoration: none; cursor: pointer;">hello@applybureau.com</a>
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #64748B; font-size: 12px; margin: 0; text-align: center;">
                                &copy; {{current_year}} Apply Bureau. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const templates = {
  // 1. Consultation Confirmed
  'consultation_confirmed.html': createBaseTemplate(
    'Consultation Confirmed — Apply Bureau',
    'Consultation Confirmed',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Your consultation with Apply Bureau has been confirmed.
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; font-weight: 600; color: #1a1a1a; font-size: 14px; margin: 0 0 12px 0;">Consultation Details</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Date:</strong> {{consultation_date}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Time:</strong> {{consultation_time}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Duration:</strong> 1 hour</p>
                                        {{#if meeting_link}}
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0;"><strong>Meeting Link:</strong> <a href="{{meeting_link}}" target="_blank" rel="noopener noreferrer" style="color: #0d9488; text-decoration: none; cursor: pointer;">{{meeting_link}}</a></p>
                                        {{/if}}
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                This consultation is a brief conversation to understand your goals, explain how Apply Bureau works, and determine whether there is a mutual fit to move forward.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                A lead strategist will reach out to you at the scheduled time.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                If anything changes, we will contact you directly. If you need to make a change, please reply to this email and we will coordinate directly.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>Apply Bureau Client Operations Team</strong>
                            </p>`
  ),

  // 2. Consultation Rescheduled
  'consultation_rescheduled.html': createBaseTemplate(
    'Consultation Time Adjustment — Apply Bureau',
    'Consultation Time Adjustment',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                We need to adjust your scheduled consultation due to a timing conflict. We apologize for the inconvenience this may cause and appreciate your flexibility.
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; font-weight: 600; color: #1a1a1a; font-size: 14px; margin: 0 0 12px 0;">Proposed new time:</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 16px; margin: 0;"><strong>{{new_date}} at {{new_time}}</strong></p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Please reply to this email to confirm if this works for you, and we will finalize the consultation.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>Apply Bureau Client Operations Team</strong>
                            </p>`
  ),

  // 3. Consultation Waitlisted
  'consultation_waitlisted.html': createBaseTemplate(
    'Apply Bureau — Next Steps',
    'Next Steps',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                It was great speaking with you and learning more about your goals. As discussed, our active client capacity is currently full. You have been added to our waitlist, and we will reach out as soon as availability opens.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                We appreciate your interest in working with Apply Bureau. No action is required on your end.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Warm regards,<br>
                                <strong>Apply Bureau Client Success Team</strong>
                            </p>`
  ),

  // 4. Payment Confirmed Welcome
  'payment_confirmed_welcome_concierge.html': createBaseTemplate(
    'Apply Bureau — Payment Confirmed & Next Steps',
    'Payment Confirmed & Next Steps',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Thank you for your payment. We have received it successfully for {{tier_name}}.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Your next step is to access your private client dashboard. This is where you will book your strategy call, share required materials, and track progress throughout the process.
                            </p>
                            
                            {{#if registration_link}}
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{registration_link}}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; background-color: #0d9488; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; cursor: pointer;">Access your dashboard</a>
                                    </td>
                                </tr>
                            </table>
                            {{/if}}
                            
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                When you access your dashboard, your first step is to book your strategy call. We will guide you through the process from there.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                We are looking forward to working with you.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 20px 0 0 0;">
                                Warm regards,<br>
                                <strong>Apply Bureau Onboarding Team</strong>
                            </p>`
  ),

  // 5. Onboarding Completed (Admin-triggered)
  'onboarding_completed_secure.html': createBaseTemplate(
    'Onboarding complete',
    'Onboarding complete',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Your onboarding has been completed successfully. Our team is preparing your application setup.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                You can expect activity to begin within 3 business days.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                No action is required on your end. Updates will appear in your dashboard.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>Apply Bureau Onboarding Team</strong>
                            </p>`
  ),

  // 6. Interview Update
  'interview_update_enhanced.html': createBaseTemplate(
    'Apply Bureau | Interview Update',
    'Interview Update',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                An interview request has been received for the role we applied to on your behalf.
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Role:</strong> {{role_title}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0;"><strong>Company:</strong> {{company_name}}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Please check your application email account for details from the employer.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                We are monitoring alongside you and will support next steps as needed.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Warm regards,<br>
                                <strong>Apply Bureau Interview Coordination Team</strong>
                            </p>`
  ),

  // 7. Strategy Call Confirmed
  'strategy_call_confirmed.html': createBaseTemplate(
    'Strategy Call Confirmed',
    'Strategy Call Confirmed',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Your strategy call with Apply Bureau has been confirmed.
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Date:</strong> {{call_date}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Time:</strong> {{call_time}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0;"><strong>Duration:</strong> 30 minutes</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                A Lead Strategist will contact you at the scheduled time.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                If anything changes, we will reach out directly.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Warm regards,<br>
                                <strong>Apply Bureau Lead Strategy Team</strong>
                            </p>`
  ),

  // 8. Meeting Reminder
  'consultation_reminder.html': createBaseTemplate(
    'Meeting Reminder',
    'Meeting Reminder',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                This is a reminder of your upcoming call with Apply Bureau.
                            </p>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Date:</strong> {{meeting_date}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0;"><strong>Time:</strong> {{meeting_time}}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                We will reach out at the scheduled time.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>Apply Bureau Client Operations Team</strong>
                            </p>`
  ),

  // 9. Contact Form Received
  'contact_form_received.html': createBaseTemplate(
    'We\'ve received your message — Apply Bureau',
    'Message Received',
    `                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Thanks for reaching out to Apply Bureau.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                We've received your message and someone from our team will follow up shortly.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                No action is needed on your end.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>Apply Bureau Client Operations Team</strong>
                            </p>`
  )
};

// Write all templates
console.log('Writing email templates...');
console.log('');

let successCount = 0;
let errorCount = 0;

for (const [filename, content] of Object.entries(templates)) {
  const filePath = path.join(templatesDir, filename);
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filename}`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${filename}: ${error.message}`);
    errorCount++;
  }
}

console.log('');
console.log('='.repeat(70));
console.log('');
console.log(`✅ Successfully updated: ${successCount} templates`);
console.log(`❌ Errors: ${errorCount} templates`);
console.log('');
console.log('📋 Templates updated:');
console.log('  1. consultation_confirmed.html');
console.log('  2. consultation_rescheduled.html');
console.log('  3. consultation_waitlisted.html');
console.log('  4. payment_confirmed_welcome_concierge.html');
console.log('  5. onboarding_completed_secure.html');
console.log('  6. interview_update_enhanced.html');
console.log('  7. strategy_call_confirmed.html');
console.log('  8. consultation_reminder.html');
console.log('  9. contact_form_received.html');
console.log('');
console.log('✅ ALL EMAILS FIXED:');
console.log('  - No placeholder data');
console.log('  - Dark mode completely prevented');
console.log('  - All durations set to 1 hour (consultation) or 30 min (strategy)');
console.log('  - Buttons are actual clickable links');
console.log('  - Clean, professional formatting');
console.log('  - Exact wording as specified');
console.log('');
