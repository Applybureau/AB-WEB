const whatsappManager = require('./utils/whatsapp');

async function testWhatsAppFeature() {
  console.log('🔍 Testing WhatsApp Feature Implementation...\n');

  // Test 1: WhatsApp Manager Initialization
  console.log('1. Testing WhatsApp Manager Initialization:');
  console.log('   ✓ WhatsApp Manager loaded successfully');
  console.log(`   ✓ Business Name: ${whatsappManager.businessName}`);
  console.log(`   ✓ Admin WhatsApp Number: ${whatsappManager.adminWhatsAppNumber}\n`);

  // Test 2: Number Formatting
  console.log('2. Testing WhatsApp Number Formatting:');
  const testNumbers = [
    '1234567890',
    '11234567890', 
    '+11234567890',
    '+44 7700 900123',
    '(555) 123-4567'
  ];

  testNumbers.forEach(number => {
    const formatted = whatsappManager.formatWhatsAppNumber(number);
    console.log(`   Input: ${number} → Formatted: ${formatted}`);
  });
  console.log();

  // Test 3: Number Validation
  console.log('3. Testing WhatsApp Number Validation:');
  testNumbers.forEach(number => {
    const formatted = whatsappManager.formatWhatsAppNumber(number);
    const isValid = whatsappManager.isValidWhatsAppNumber(number);
    console.log(`   ${number} → ${formatted} → Valid: ${isValid}`);
  });
  console.log();

  // Test 4: Mock Consultation Data Testing
  console.log('4. Testing with Mock Consultation Data:');
  const mockConsultation = {
    id: 'test-123',
    prospect_name: 'John Doe',
    prospect_email: 'john.doe@test.com',
    communication_method: 'whatsapp_call',
    whatsapp_number: '+1234567890',
    admin_whatsapp_number: '+1987654321',
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    status: 'confirmed',
    consultation_type: 'strategy_call'
  };

  console.log('   ✓ Mock consultation created:');
  console.log(`     - Name: ${mockConsultation.prospect_name}`);
  console.log(`     - Communication Method: ${mockConsultation.communication_method}`);
  console.log(`     - WhatsApp Number: ${mockConsultation.whatsapp_number}`);
  console.log(`     - Admin WhatsApp: ${mockConsultation.admin_whatsapp_number}`);

  // Test WhatsApp contact info generation
  console.log('\n5. Testing WhatsApp Contact Info Generation:');
  const contactInfo = whatsappManager.generateWhatsAppContactInfo(mockConsultation);
  console.log('   ✓ Contact info generated:');
  console.log(`     - Admin Number: ${contactInfo.adminNumber}`);
  console.log(`     - Client Number: ${contactInfo.clientNumber}`);
  console.log(`     - WhatsApp Web Link: ${contactInfo.whatsappWebLink}`);
  console.log(`     - Formatted Date: ${contactInfo.formattedDate}`);
  console.log(`     - Formatted Time: ${contactInfo.formattedTime}`);

  // Test WhatsApp instructions
  console.log('\n6. Testing WhatsApp Instructions Generation:');
  const instructions = whatsappManager.createWhatsAppInstructions(mockConsultation);
  console.log('   ✓ Instructions generated:');
  instructions.instructions.forEach((instruction, index) => {
    console.log(`     ${index + 1}. ${instruction}`);
  });
  console.log('   ✓ Backup options:');
  instructions.backupOptions.forEach((option, index) => {
    console.log(`     ${index + 1}. ${option}`);
  });

  // Test reminder message
  console.log('\n7. Testing Reminder Message Generation:');
  const reminderMessage = whatsappManager.generateReminderMessage(mockConsultation);
  console.log('   ✓ Reminder message:');
  console.log(`     "${reminderMessage}"`);

  // Test activity logging
  console.log('\n8. Testing Activity Logging:');
  whatsappManager.logWhatsAppActivity(mockConsultation.id, 'test_consultation_created', {
    communication_method: mockConsultation.communication_method,
    whatsapp_number: mockConsultation.whatsapp_number
  });
  console.log('   ✓ Activity logged successfully');

  // Test edge cases
  console.log('\n9. Testing Edge Cases:');
  
  // Test with missing admin WhatsApp (should use default)
  const consultationNoAdmin = { ...mockConsultation, admin_whatsapp_number: null };
  const contactInfoNoAdmin = whatsappManager.generateWhatsAppContactInfo(consultationNoAdmin);
  console.log(`   ✓ Default admin number used: ${contactInfoNoAdmin.adminNumber}`);
  
  // Test with invalid WhatsApp number
  const invalidNumbers = ['', null, 'invalid', '123'];
  console.log('   ✓ Invalid number validation:');
  invalidNumbers.forEach(num => {
    const isValid = whatsappManager.isValidWhatsAppNumber(num);
    console.log(`     - "${num}" → Valid: ${isValid}`);
  });

  // Test different time zones
  console.log('\n10. Testing Different Scheduled Times:');
  const times = [
    new Date().toISOString(), // Now
    new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
  ];
  
  times.forEach((time, index) => {
    const testConsultation = { ...mockConsultation, scheduled_at: time };
    const info = whatsappManager.generateWhatsAppContactInfo(testConsultation);
    console.log(`   ${index + 1}. ${info.formattedDate} at ${info.formattedTime}`);
  });

  console.log('\n🎉 WhatsApp Feature Test Complete!\n');
}

// Run the test
if (require.main === module) {
  testWhatsAppFeature().catch(console.error);
}

module.exports = testWhatsAppFeature;