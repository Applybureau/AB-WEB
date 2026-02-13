const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');

// Template generator function
const generateTemplate = (name, subject, content) => {
  return `<!-- SUBJECT: ${subject} -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <style>
        /* Force light mode only */
        :root {
            color-scheme: light only;
            supported-color-schemes: light;
        }
        
        body {
            color-scheme: light only !important;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5; color: #1a1a1a;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 20px; background-color: #f5f5f5;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; color: #1a1a1a; border-radius: 8px; overflow: hidden;">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                            <img src="https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png" alt="Apply Bureau" width="220" height="auto" style="display: block; border: 0; max-width: 100%;">
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; background-color: #ffffff; color: #1a1a1a;">
${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #ffffff; color: #1a1a1a;">
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #64748B; font-size: 14px; margin: 0 0 10px 0; text-align: center;">
                                Questions? Contact us at <a href="mailto:hello@applybureau.com" style="color: #64748B; text-decoration: none;">hello@applybureau.com</a>
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
};

// Missing templates definitions
const missingTemplates = [
  {
    filename: 'profile_under_review.html',
    subject: 'Your Profile is Under Review - Apply Bureau',
    content: `                            <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; font-size: 24px; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                                Profile Under Review
                            </h1>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hello {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Thank you for your interest in Apply Bureau. We have received your profile and it is currently under review by our team.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                We carefully evaluate each application to ensure we can provide the best possible service. You will hear from us within 2-3 business days.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>The Apply Bureau Team</strong>
                            </p>`
  },
  {
    filename: 'consultation_scheduled.html',
    subject: 'Consultation Scheduled - Apply Bureau',
    content: `                            <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; font-size: 24px; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                                Consultation Scheduled
                            </h1>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Your consultation with Apply Bureau has been successfully scheduled.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; font-weight: 600; color: #1a1a1a; font-size: 14px; margin: 0 0 12px 0;">Consultation Details</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Date:</strong> {{consultation_date}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Time:</strong> {{consultation_time}}</p>
                                        {{#if meeting_link}}
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0;"><strong>Meeting Link:</strong> <a href="{{meeting_link}}" style="color: #0d9488; text-decoration: none;">Join Meeting</a></p>
                                        {{/if}}
                                    </td>
                                </tr>
                            </table>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                We look forward to speaking with you!
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>The Apply Bureau Team</strong>
                            </p>`
  },
  {
    filename: 'consultation_request_received.html',
    subject: 'Consultation Request Received - Apply Bureau',
    content: `                            <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; font-size: 24px; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                                Request Received
                            </h1>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Thank you for requesting a consultation with Apply Bureau. We have received your request and will review it shortly.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Our team will reach out to you within 24-48 hours to confirm your consultation time.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>The Apply Bureau Team</strong>
                            </p>`
  },
  {
    filename: 'onboarding_approved.html',
    subject: 'Onboarding Approved - Apply Bureau',
    content: `                            <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; font-size: 24px; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                                Onboarding Approved!
                            </h1>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hello {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Great news! Your onboarding has been reviewed and approved by {{admin_name}}.
                            </p>
                            {{#if feedback}}
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; font-weight: 600; color: #1a1a1a; font-size: 14px; margin: 0 0 12px 0;">Feedback</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0;">{{feedback}}</p>
                                    </td>
                                </tr>
                            </table>
                            {{/if}}
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                You can now access your full dashboard and begin working with our team.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{dashboard_url}}" style="font-family: 'Inter', sans-serif; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; background-color: #ffffff; color: #1a1a1a; padding: 16px 48px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                                            Access Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>The Apply Bureau Team</strong>
                            </p>`
  },
  {
    filename: 'interview_scheduled.html',
    subject: 'Interview Scheduled - Apply Bureau',
    content: `                            <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; font-size: 24px; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                                Interview Scheduled
                            </h1>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hello {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Great news! An interview has been scheduled for your application.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; font-weight: 600; color: #1a1a1a; font-size: 14px; margin: 0 0 12px 0;">Interview Details</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Company:</strong> {{company}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Position:</strong> {{position}}</p>
                                        {{#if interview_date}}
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Date:</strong> {{interview_date}}</p>
                                        {{/if}}
                                        {{#if interview_time}}
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0;"><strong>Time:</strong> {{interview_time}}</p>
                                        {{/if}}
                                    </td>
                                </tr>
                            </table>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Check your dashboard for more details and preparation materials.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>The Apply Bureau Team</strong>
                            </p>`
  }
];

// Add more critical templates
const additionalTemplates = [
  {
    filename: 'consultation_cancelled.html',
    subject: 'Consultation Cancelled - Apply Bureau',
    content: `                            <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; font-size: 24px; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                                Consultation Cancelled
                            </h1>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Hi {{client_name}},
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Your consultation scheduled for {{consultation_date}} has been cancelled.
                            </p>
                            {{#if reason}}
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                Reason: {{reason}}
                            </p>
                            {{/if}}
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                If you would like to reschedule, please reply to this email or contact us directly.
                            </p>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0;">
                                Best regards,<br>
                                <strong>The Apply Bureau Team</strong>
                            </p>`
  },
  {
    filename: 'admin_onboarding_review_needed.html',
    subject: 'Onboarding Review Needed - Apply Bureau Admin',
    content: `                            <h1 style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; font-size: 24px; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                                Onboarding Review Needed
                            </h1>
                            <p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #1a1a1a; font-size: 16px; margin: 0 0 20px 0;">
                                A new client has completed their onboarding and requires review.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0; background-color: #f8f9fa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0 0 8px 0;"><strong>Client:</strong> {{client_name}}</p>
                                        <p style="font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 15px; margin: 0;"><strong>Email:</strong> {{client_email}}</p>
                                    </td>
                                </tr>
                            </table>
                            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{admin_dashboard_url}}" style="font-family: 'Inter', sans-serif; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; background-color: #ffffff; color: #1a1a1a; padding: 16px 48px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                                            Review Onboarding
                                        </a>
                                    </td>
                                </tr>
                            </table>`
  }
];

async function createMissingTemplates() {
  console.log('🔧 Creating Missing Email Templates...\n');
  console.log('='.repeat(80));
  
  const allTemplates = [...missingTemplates, ...additionalTemplates];
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const template of allTemplates) {
    try {
      const filePath = path.join(TEMPLATES_DIR, template.filename);
      
      // Check if file already exists
      try {
        await fs.access(filePath);
        console.log(`⏭️  Skipped: ${template.filename} (already exists)`);
        skipped++;
        continue;
      } catch {
        // File doesn't exist, create it
      }
      
      const html = generateTemplate(template.filename, template.subject, template.content);
      await fs.writeFile(filePath, html, 'utf8');
      
      console.log(`✅ Created: ${template.filename}`);
      created++;
      
    } catch (error) {
      console.log(`❌ Error creating ${template.filename}: ${error.message}`);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log(`   Templates created: ${created}`);
  console.log(`   Templates skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`\n   Total processed: ${allTemplates.length}`);
  console.log(`   Remaining missing: ${30 - created}`);
  
  if (created > 0) {
    console.log('\n✅ Successfully created critical email templates!');
    console.log('\n📋 Next steps:');
    console.log('   1. Review the created templates');
    console.log('   2. Customize content as needed');
    console.log('   3. Test email sending');
    console.log('   4. Create remaining templates');
  }
  
  console.log('\n' + '='.repeat(80));
}

createMissingTemplates().catch(console.error);
