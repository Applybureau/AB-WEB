#!/usr/bin/env node

/**
 * ADD DARK MODE PREVENTION TO EMAIL TEMPLATES
 * Adds meta tags and CSS to prevent dark mode color inversion
 * WITHOUT modifying the template content
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 ADDING DARK MODE PREVENTION TO EMAIL TEMPLATES');
console.log('==================================================\n');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Dark mode prevention meta tags and CSS to inject
const darkModePreventionHead = `
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
        /* Force light mode */
        :root {
            color-scheme: light only;
        }
        @media (prefers-color-scheme: dark) {
            body, table, td, p, a, span, div, h1, h2, h3, h4, h5, h6 {
                color: #000000 !important;
                background-color: #ffffff !important;
            }
        }
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            table[width="600"] {
                width: 100% !important;
            }
            td[style*="padding: 40px"] {
                padding: 20px !important;
            }
        }
    </style>
`;

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
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has dark mode prevention
    if (content.includes('color-scheme: light only')) {
      console.log(`⏭️  Skipped: ${filename} (already has dark mode prevention)`);
      successCount++;
      return;
    }
    
    // Inject before </head>
    content = content.replace('</head>', `${darkModePreventionHead}</head>`);
    
    fs.writeFileSync(filePath, content, 'utf8');
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
  console.log(`\n🎉 Dark mode prevention added!`);
}
