#!/usr/bin/env node

/**
 * UPDATE ALL EMAIL TEMPLATES TO MATCH NEW REQUIREMENTS
 * 
 * This script creates/updates all email templates with the exact content
 * specified in the requirements document.
 */

const fs = require('fs');
const path = require('path');

console.log('📧 UPDATING ALL EMAIL TEMPLATES');
console.log('================================\n');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Template 4: Payment Confirmed Welcome
const paymentConfirmedWelcome = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apply Bureau — Payment Confirmed & Next Steps</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0D9488;">Apply Bureau</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Hi {{client_name}},
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Thank you for your payment. We have received it successfully for <strong>{{tier}}</strong>.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Your next step is to access your private client dashboard. This is where you will book your strategy call, share required materials, and track progress throughout the process.
                            </p>
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Please use the link below to create your account and get started:
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{dashboard_url}}" style="display: inline-block; padding: 14px 32px; background-color: #0D9488; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                                            Access your dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                When you access your dashboard, your first step is to book your strategy call. We will guide you through the process from there.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                We are looking forward to working with you.
                            </p>
                            <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Warm regards,<br>
                                <strong>Apply Bureau Onboarding Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                © {{current_year}} Apply Bureau. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Template 5: Onboarding Completed (Admin-triggered)
const onboardingCompleted = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onboarding complete</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0D9488;">Apply Bureau</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Hi {{client_name}},
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Your onboarding has been completed successfully. Our team is preparing your application setup.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                You can expect activity to begin within 3 business days.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                No action is required on your end. Updates will appear in your dashboard.
                            </p>
                            <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Best regards,<br>
                                <strong>Apply Bureau Onboarding Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                © {{current_year}} Apply Bureau. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Template 6: Interview Update
const interviewUpdate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apply Bureau | Interview Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0D9488;">Apply Bureau</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Hi {{client_name}},
                            </p>
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                An interview request has been received for the role we applied to on your behalf.
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdfa; border-radius: 6px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 15px; color: #4b5563; font-weight: 500; width: 100px;">
                                                    Role:
                                                </td>
                                                <td style="padding: 8px 0; font-size: 15px; color: #1f2937;">
                                                    {{role_title}}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 15px; color: #4b5563; font-weight: 500;">
                                                    Company:
                                                </td>
                                                <td style="padding: 8px 0; font-size: 15px; color: #1f2937;">
                                                    {{company_name}}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Please check your application email account for details from the employer.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                We are monitoring alongside you and will support next steps as needed.
                            </p>
                            <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Warm regards,<br>
                                <strong>Apply Bureau Interview Coordination Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                © {{current_year}} Apply Bureau. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Template 7: Strategy Call Confirmed
const strategyCallConfirmed = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Strategy Call Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0D9488;">Apply Bureau</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Hi {{client_name}},
                            </p>
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Your strategy call with Apply Bureau has been confirmed.
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdfa; border-radius: 6px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 15px; color: #4b5563; font-weight: 500; width: 100px;">
                                                    Date:
                                                </td>
                                                <td style="padding: 8px 0; font-size: 15px; color: #1f2937;">
                                                    {{call_date}}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 15px; color: #4b5563; font-weight: 500;">
                                                    Time:
                                                </td>
                                                <td style="padding: 8px 0; font-size: 15px; color: #1f2937;">
                                                    {{call_time}}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 15px; color: #4b5563; font-weight: 500;">
                                                    Duration:
                                                </td>
                                                <td style="padding: 8px 0; font-size: 15px; color: #1f2937;">
                                                    {{call_duration}}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                A Lead Strategist will contact you at the scheduled time.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                If anything changes, we will reach out directly.
                            </p>
                            <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Warm regards,<br>
                                <strong>Apply Bureau Lead Strategy Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                © {{current_year}} Apply Bureau. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Template 8: Meeting Reminder
const meetingReminder = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0D9488;">Apply Bureau</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Hi {{client_name}},
                            </p>
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                This is a reminder of your upcoming call with Apply Bureau.
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdfa; border-radius: 6px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 15px; color: #4b5563; font-weight: 500; width: 100px;">
                                                    Date:
                                                </td>
                                                <td style="padding: 8px 0; font-size: 15px; color: #1f2937;">
                                                    {{meeting_date}}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 15px; color: #4b5563; font-weight: 500;">
                                                    Time:
                                                </td>
                                                <td style="padding: 8px 0; font-size: 15px; color: #1f2937;">
                                                    {{meeting_time}}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                We will reach out at the scheduled time.
                            </p>
                            <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Best regards,<br>
                                <strong>Apply Bureau Client Operations Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                © {{current_year}} Apply Bureau. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Template 9: Contact Form Received
const contactFormReceived = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We've received your message — Apply Bureau</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #0D9488;">Apply Bureau</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Hi {{client_name}},
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Thanks for reaching out to Apply Bureau.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                We've received your message and someone from our team will follow up shortly.
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                No action is needed on your end.
                            </p>
                            <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #1f2937;">
                                Best regards,<br>
                                <strong>Apply Bureau Client Operations Team</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                © {{current_year}} Apply Bureau. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Write all templates
const templates = {
  'payment_received_welcome.html': paymentConfirmedWelcome,
  'onboarding_completed.html': onboardingCompleted,
  'interview_update_enhanced.html': interviewUpdate,
  'strategy_call_confirmed.html': strategyCallConfirmed,
  'consultation_reminder.html': meetingReminder,
  'contact_form_received.html': contactFormReceived
};

let successCount = 0;
let errorCount = 0;

Object.entries(templates).forEach(([filename, content]) => {
  const filePath = path.join(templatesDir, filename);
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filename}`);
    successCount++;
  } catch (error) {
    console.log(`❌ Failed: ${filename} - ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📊 SUMMARY`);
console.log(`==========`);
console.log(`✅ Successfully updated: ${successCount} templates`);
console.log(`❌ Failed: ${errorCount} templates`);

if (successCount > 0) {
  console.log(`\n🎉 Email templates have been updated!`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the templates in backend/emails/templates/`);
  console.log(`2. Test email sending with: node backend/test-updated-email-templates.js`);
  console.log(`3. Commit and push changes`);
}

module.exports = { templates };