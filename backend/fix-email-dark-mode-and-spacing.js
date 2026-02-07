#!/usr/bin/env node

/**
 * FIX EMAIL TEMPLATES - DARK MODE & SPACING ISSUES
 * 
 * Fixes:
 * 1. Force light mode (prevent dark mode color inversion)
 * 2. Reduce excessive spacing on mobile
 * 3. Improve mobile responsiveness
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING EMAIL TEMPLATES - DARK MODE & SPACING');
console.log('================================================\n');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Improved email template with dark mode prevention and better spacing
function createFixedTemplate(content) {
  // Extract the title
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : 'Apply Bureau';
  
  // Extract the main content (everything between the content <tr> tags)
  const contentMatch = content.match(/<!-- Content -->([\s\S]*?)<!-- Footer -->/);
  const mainContent = contentMatch ? contentMatch[1] : '';
  
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${title}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Force light mode and prevent dark mode */
        :root {
            color-scheme: light only;
            supported-color-schemes: light;
        }
        
        /* Prevent color inversion in dark mode */
        @media (prefers-color-scheme: dark) {
            body, table, td, p, a, span, div {
                color: #1f2937 !important;
                background-color: #ffffff !important;
            }
            .email-container {
                background-color: #ffffff !important;
            }
            .email-wrapper {
                background-color: #f9fafb !important;
            }
            .header-bg {
                background-color: #ffffff !important;
            }
            .footer-bg {
                background-color: #f9fafb !important;
            }
        }
        
        /* Reset styles */
        body, table, td, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                margin: 0 !important;
            }
            .mobile-padding {
                padding: 20px !important;
            }
            .mobile-header-padding {
                padding: 20px 20px 15px !important;
            }
            .mobile-footer-padding {
                padding: 20px !important;
            }
            .mobile-hide {
                display: none !important;
            }
            .mobile-text-center {
                text-align: center !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #1f2937; mso-line-height-rule: exactly;" class="email-wrapper">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #f9fafb;" class="email-wrapper">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);" class="email-container">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 24px 30px 20px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;" class="mobile-header-padding header-bg">
                            <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #0D9488; line-height: 1.2;">Apply Bureau</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
${mainContent}
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 30px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;" class="mobile-footer-padding footer-bg">
                            <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.4;">
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
}

// Read and fix each template
const templates = [
  'consultation_confirmed.html',
  'consultation_rescheduled.html',
  'consultation_waitlisted.html',
  'payment_received_welcome.html',
  'onboarding_completed.html',
  'interview_update_enhanced.html',
  'strategy_call_confirmed.html',
  'consultation_reminder.html',
  'contact_form_received.html'
];

let successCount = 0;
let errorCount = 0;

templates.forEach(filename => {
  const filePath = path.join(templatesDir, filename);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = createFixedTemplate(content);
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✅ Fixed: ${filename}`);
    successCount++;
  } catch (error) {
    console.log(`❌ Failed: ${filename} - ${error.message}`);
    errorCount++;
  }
});

console.log(`\n📊 SUMMARY`);
console.log(`==========`);
console.log(`✅ Successfully fixed: ${successCount} templates`);
console.log(`❌ Failed: ${errorCount} templates`);

if (successCount > 0) {
  console.log(`\n🎉 Email templates have been fixed!`);
  console.log(`\nImprovements:`);
  console.log(`✅ Dark mode forced to light (no color inversion)`);
  console.log(`✅ Reduced spacing on mobile`);
  console.log(`✅ Better mobile responsiveness`);
  console.log(`✅ Proper email client compatibility`);
}

module.exports = { createFixedTemplate };