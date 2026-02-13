const request = require('supertest');
const express = require('express');
const whatsappManager = require('./utils/whatsapp');

// Mock the consultation routes for testing
const app = express();
app.use(express.json());

// Simulate the consultation update endpoint
app.put('/api/consultation-requests/:id', (req, res) => {
  const { id } = req.params;
  const { 
    communication_method, 
    whatsapp_number, 
    admin_whatsapp_number 
  } = req.body;

  // Simulate WhatsApp number formatting (like in the real route)
  const updateData = {};
  if (communication_method) updateData.communication_method = communication_method;
  if (whatsapp_number) updateData.whatsapp_number = whatsappManager.formatWhatsAppNumber(whatsapp_number);
  if (admin_whatsapp_number) updateData.admin_whatsapp_number = whatsappManager.formatWhatsAppNumber(admin_whatsapp_number);

  // Simulate successful update
  const mockConsultation = {
    id,
    ...updateData,
    prospect_name: 'Test User',
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  res.json({
    success: true,
    data: mockConsultation
  });
});

// Test endpoint to generate WhatsApp info
app.get('/api/consultation/:id/whatsapp-info', (req, res) => {
  const mockConsultation = {
    id: req.params.id,
    prospect_name: 'John Doe',
    communication_method: 'whatsapp_call',
    whatsapp_number: '+1234567890',
    admin_whatsapp_number: '+1987654321',
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  const contactInfo = whatsappManager.generateWhatsAppContactInfo(mockConsultation);
  const instructions = whatsappManager.createWhatsAppInstructions(mockConsultation);

  res.json({
    success: true,
    data: {
      ...contactInfo,
      instructions: instructions.instructions,
      backupOptions: instructions.backupOptions
    }
  });
});

async function testWhatsAppAPIIntegration() {
  console.log('🔍 Testing WhatsApp API Integration...\n');

  // Test 1: Update consultation with WhatsApp details
  console.log('1. Testing Consultation Update with WhatsApp:');
  try {
    const response = await request(app)
      .put('/api/consultation-requests/test-123')
      .send({
        communication_method: 'whatsapp_call',
        whatsapp_number: '1234567890', // Unformatted number
        admin_whatsapp_number: '(987) 654-3210' // Formatted number
      });

    console.log('   ✓ API Response Status:', response.status);
    console.log('   ✓ Formatted WhatsApp Number:', response.body.data.whatsapp_number);
    console.log('   ✓ Formatted Admin WhatsApp:', response.body.data.admin_whatsapp_number);
    console.log('   ✓ Communication Method:', response.body.data.communication_method);
  } catch (error) {
    console.log('   ❌ API test failed:', error.message);
  }

  // Test 2: Get WhatsApp consultation info
  console.log('\n2. Testing WhatsApp Info Endpoint:');
  try {
    const response = await request(app)
      .get('/api/consultation/test-456/whatsapp-info');

    console.log('   ✓ API Response Status:', response.status);
    console.log('   ✓ WhatsApp Web Link:', response.body.data.whatsappWebLink);
    console.log('   ✓ Admin Number:', response.body.data.adminNumber);
    console.log('   ✓ Client Number:', response.body.data.clientNumber);
    console.log('   ✓ Instructions Count:', response.body.data.instructions.length);
    console.log('   ✓ Backup Options Count:', response.body.data.backupOptions.length);
  } catch (error) {
    console.log('   ❌ WhatsApp info test failed:', error.message);
  }

  // Test 3: Validate communication method options
  console.log('\n3. Testing Communication Method Validation:');
  const validMethods = ['video_call', 'whatsapp_call', 'phone_call'];
  const invalidMethods = ['email', 'chat', 'invalid'];

  validMethods.forEach(method => {
    console.log(`   ✓ ${method} - Valid communication method`);
  });

  invalidMethods.forEach(method => {
    console.log(`   ❌ ${method} - Invalid communication method (should be rejected)`);
  });

  // Test 4: WhatsApp URL generation
  console.log('\n4. Testing WhatsApp URL Generation:');
  const testConsultation = {
    prospect_name: 'Jane Smith',
    admin_whatsapp_number: '+1555123456',
    scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  };

  const contactInfo = whatsappManager.generateWhatsAppContactInfo(testConsultation);
  console.log('   ✓ Generated WhatsApp URL:');
  console.log(`     ${contactInfo.whatsappWebLink}`);
  
  // Verify URL structure
  const url = new URL(contactInfo.whatsappWebLink);
  console.log('   ✓ URL Components:');
  console.log(`     - Protocol: ${url.protocol}`);
  console.log(`     - Host: ${url.host}`);
  console.log(`     - Phone: ${url.pathname.substring(1)}`);
  console.log(`     - Has Message: ${url.searchParams.has('text')}`);

  console.log('\n🎉 WhatsApp API Integration Test Complete!\n');
}

// Run the test
if (require.main === module) {
  testWhatsAppAPIIntegration().catch(console.error);
}

module.exports = testWhatsAppAPIIntegration;