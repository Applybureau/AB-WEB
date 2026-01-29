const whatsappManager = require('./utils/whatsapp');

// Test WhatsApp functionality
function testWhatsAppFunctionality() {
  console.log('🧪 Testing WhatsApp consultation functionality...\n');
  
  // Test consultation object
  const testConsultation = {
    id: 'test-123',
    prospect_name: 'John Doe',
    whatsapp_number: '+1234567890',
    admin_whatsapp_number: '+1987654321',
    scheduled_at: '2024-03-15T10:00:00Z',
    communication_method: 'whatsapp_call'
  };
  
  console.log('📱 Testing WhatsApp number formatting...');
  console.log('Input: +1234567890');
  console.log('Formatted:', whatsappManager.formatWhatsAppNumber('+1234567890'));
  console.log('Valid:', whatsappManager.isValidWhatsAppNumber('+1234567890'));
  
  console.log('\n📞 Testing WhatsApp contact info generation...');
  const contactInfo = whatsappManager.generateWhatsAppContactInfo(testConsultation);
  console.log('Admin Number:', contactInfo.adminNumber);
  console.log('Client Number:', contactInfo.clientNumber);
  console.log('WhatsApp Web Link:', contactInfo.whatsappWebLink);
  console.log('Formatted Date:', contactInfo.formattedDate);
  console.log('Formatted Time:', contactInfo.formattedTime);
  
  console.log('\n📋 Testing WhatsApp instructions...');
  const instructions = whatsappManager.createWhatsAppInstructions(testConsultation);
  console.log('Instructions:');
  instructions.instructions.forEach((instruction, index) => {
    console.log(`  ${index + 1}. ${instruction}`);
  });
  
  console.log('\n📧 Testing email template data...');
  const emailData = whatsappManager.generateEmailTemplateData(testConsultation);
  console.log('Email Template Data:', JSON.stringify(emailData, null, 2));
  
  console.log('\n✅ WhatsApp functionality test completed!');
  console.log('\n📋 WhatsApp Email Template Variables Available:');
  console.log('   • is_whatsapp_call: true/false');
  console.log('   • client_phone_number: formatted WhatsApp number');
  console.log('   • whatsapp_number: admin WhatsApp number');
  console.log('   • whatsapp_instructions: array of instructions');
  console.log('   • whatsapp_web_link: direct WhatsApp web link');
  console.log('   • communication_method: "whatsapp_call"');
}

testWhatsAppFunctionality();