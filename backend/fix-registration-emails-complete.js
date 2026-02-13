const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING REGISTRATION & CONSULTATION EMAILS');
console.log('='.repeat(70));
console.log('');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Fix payment_verified_registration.html
console.log('1️⃣ Fixing payment_verified_registration.html...');
const paymentVerifiedPath = path.join(templatesDir, 'payment_verified_registration.html');
let paymentVerifiedContent = fs.readFileSync(paymentVerifiedPath, 'utf8');

// Remove temp password mentions and fix the account email section
paymentVerifiedContent = paymentVerifiedContent.replace(
  /<p style="[^"]*">\s*<strong>Your Account Email:<\/strong><br>\s*\{\{email\}\}<br>\s*<em[^>]*>.*?create your password during registration.*?<\/em>\s*<\/p>/gs,
  `<p style="font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6; color: #64748B; font-size: 14px; margin: 24px 0; text-align: center; border: 1px solid #E5E7EB; padding: 16px; background-color: #F8FAFC; border-radius: 6px;">
                <strong>Your Account Email:</strong><br>
                {{email}}<br>
                <em style="font-size: 13px;">You'll create your password during registration</em>
            </p>`
);

// Ensure buttons are clickable
paymentVerifiedContent = paymentVerifiedContent.replace(
  /(<a href="\{\{registration_url\}\}"[^>]*style="[^"]*)(">)/g,
  '$1; cursor: pointer$2'
);

fs.writeFileSync(paymentVerifiedPath, paymentVerifiedContent, 'utf8');
console.log('   ✅ Fixed payment_verified_registration.html');

// Fix payment_confirmed_welcome_concierge.html
console.log('');
console.log('2️⃣ Fixing payment_confirmed_welcome_concierge.html...');
const paymentConfirmedPath = path.join(templatesDir, 'payment_confirmed_welcome_concierge.html');
let paymentConfirmedContent = fs.readFileSync(paymentConfirmedPath, 'utf8');

// Remove any temp password mentions
paymentConfirmedContent = paymentConfirmedContent.replace(/temporary password/gi, '');
paymentConfirmedContent = paymentConfirmedContent.replace(/temp password/gi, '');
paymentConfirmedContent = paymentConfirmedContent.replace(/\{\{temp_password\}\}/g, '');
paymentConfirmedContent = paymentConfirmedContent.replace(/\{\{password\}\}/g, '');

// Ensure registration button is clickable
paymentConfirmedContent = paymentConfirmedContent.replace(
  /(<a href="\{\{registration_url\}\}"[^>]*style="[^"]*)(">)/g,
  '$1; cursor: pointer$2'
);

fs.writeFileSync(paymentConfirmedPath, paymentConfirmedContent, 'utf8');
console.log('   ✅ Fixed payment_confirmed_welcome_concierge.html');

// Fix consultation_confirmed.html
console.log('');
console.log('3️⃣ Fixing consultation_confirmed.html...');
const consultationConfirmedPath = path.join(templatesDir, 'consultation_confirmed.html');
let consultationConfirmedContent = fs.readFileSync(consultationConfirmedPath, 'utf8');

// Set duration to 1 hour
consultationConfirmedContent = consultationConfirmedContent.replace(/\{\{consultation_duration\}\}/g, '1 hour');
consultationConfirmedContent = consultationConfirmedContent.replace(/30 minutes/g, '1 hour');
consultationConfirmedContent = consultationConfirmedContent.replace(/45 minutes/g, '1 hour');

// Fix Join Meeting button
consultationConfirmedContent = consultationConfirmedContent.replace(
  /<a href="\{\{meeting_link\}\}"([^>]*style="[^"]*)(">[\s\S]*?Join Meeting[\s\S]*?<\/a>)/g,
  '<a href="{{meeting_link}}"$1; cursor: pointer$2'
);

// Remove duplicate logo if exists
const logoHeaderPattern = /<!--\s*Logo Header\s*-->[\s\S]*?<\/tr>/g;
const logoMatches = consultationConfirmedContent.match(logoHeaderPattern);
if (logoMatches && logoMatches.length > 1) {
  let firstLogoFound = false;
  consultationConfirmedContent = consultationConfirmedContent.replace(logoHeaderPattern, (match) => {
    if (!firstLogoFound) {
      firstLogoFound = true;
      return match;
    }
    return '';
  });
  console.log('   ✅ Removed duplicate logo header');
}

fs.writeFileSync(consultationConfirmedPath, consultationConfirmedContent, 'utf8');
console.log('   ✅ Fixed consultation_confirmed.html');

// Fix consultation_confirmed_concierge.html
console.log('');
console.log('4️⃣ Fixing consultation_confirmed_concierge.html...');
const consultationConciergePath = path.join(templatesDir, 'consultation_confirmed_concierge.html');
let consultationConciergeContent = fs.readFileSync(consultationConciergePath, 'utf8');

// Set duration to 1 hour
consultationConciergeContent = consultationConciergeContent.replace(/\{\{consultation_duration\}\}/g, '1 hour');
consultationConciergeContent = consultationConciergeContent.replace(/30 minutes/g, '1 hour');
consultationConciergeContent = consultationConciergeContent.replace(/45 minutes/g, '1 hour');

// Fix meeting link to be clickable
consultationConciergeContent = consultationConciergeContent.replace(
  /<a href="\{\{meeting_link\}\}"([^>]*)(>)/g,
  '<a href="{{meeting_link}}"$1 style="cursor: pointer; color: #0066cc; text-decoration: underline;"$2'
);

// Remove duplicate logo comments
consultationConciergeContent = consultationConciergeContent.replace(/<!--\s*Logo\s*-->\s*<!--\s*Logo\s*-->/g, '<!-- Logo -->');

fs.writeFileSync(consultationConciergePath, consultationConciergeContent, 'utf8');
console.log('   ✅ Fixed consultation_confirmed_concierge.html');

// Fix signup_invite.html (if it mentions temp passwords)
console.log('');
console.log('5️⃣ Fixing signup_invite.html...');
const signupInvitePath = path.join(templatesDir, 'signup_invite.html');
if (fs.existsSync(signupInvitePath)) {
  let signupInviteContent = fs.readFileSync(signupInvitePath, 'utf8');
  
  // Remove temp password mentions
  signupInviteContent = signupInviteContent.replace(/temporary password/gi, '');
  signupInviteContent = signupInviteContent.replace(/temp password/gi, '');
  signupInviteContent = signupInviteContent.replace(/\{\{temp_password\}\}/g, '');
  signupInviteContent = signupInviteContent.replace(/\{\{password\}\}/g, '');
  
  // Ensure registration link is clickable
  signupInviteContent = signupInviteContent.replace(
    /(<a href="\{\{registration_link\}\}"[^>]*style="[^"]*)(">)/g,
    '$1; cursor: pointer$2'
  );
  
  fs.writeFileSync(signupInvitePath, signupInviteContent, 'utf8');
  console.log('   ✅ Fixed signup_invite.html');
} else {
  console.log('   ⚠️  signup_invite.html not found');
}

console.log('');
console.log('='.repeat(70));
console.log('✅ All registration and consultation emails fixed!');
console.log('');
console.log('Changes made:');
console.log('  ✓ Removed all temp password mentions');
console.log('  ✓ Set all consultation durations to 1 hour');
console.log('  ✓ Fixed buttons to be clickable with cursor:pointer');
console.log('  ✓ Removed duplicate logos and content');
console.log('  ✓ Cleaned up registration email messaging');
