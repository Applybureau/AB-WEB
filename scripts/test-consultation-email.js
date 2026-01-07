#!/usr/bin/env node

/**
 * Test Consultation Email Sending
 */

const axios = require('axios');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;
const YOUR_EMAIL = 'israelloko65@gmail.com';

async function testConsultationEmail() {
  console.log('📧 TESTING CONSULTATION EMAIL');
  console.log('='.repeat(40));
  console.log(`📬 Your Email: ${YOUR_EMAIL}\n`);

  try {
    // Login as admin
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = login.data.token;
    console.log('✅ Admin login successful');

    // First, create a client with your email if it doesn't exist
    console.log('\n📝 Creating/checking client...');
    try {
      const invite = await axios.post(`${API_URL}/auth/invite`, {
        email: YOUR_EMAIL,
        full_name: 'Israel Loko (Email Test)'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ New client created:', invite.data.client_id);
      var clientId = invite.data.client_id;
    } catch (inviteError) {
      if (inviteError.response?.data?.error === 'Client already exists') {
        console.log('ℹ️  Client already exists, getting client ID...');
        
        // Get all clients to find the one with your email
        const dashboard = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        var clientId = dashboard.data.client.id;
        console.log('✅ Found existing client:', clientId);
      } else {
        throw inviteError;
      }
    }

    // Create consultation for your email
    console.log('\n📅 Creating consultation with email notification...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3); // 3 days from now
    futureDate.setHours(15, 30, 0, 0); // 3:30 PM

    const consultationData = {
      client_id: clientId,
      scheduled_at: futureDate.toISOString(),
      admin_notes: `Email test consultation for ${YOUR_EMAIL} - Please check your email inbox!`
    };

    console.log('Consultation details:');
    console.log('- Client ID:', clientId);
    console.log('- Scheduled for:', futureDate.toLocaleString());
    console.log('- Your email:', YOUR_EMAIL);

    const consultation = await axios.post(`${API_URL}/consultations`, consultationData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 45000 // Longer timeout for email sending
    });

    console.log('\n✅ Consultation created successfully!');
    console.log('Consultation ID:', consultation.data.consultation.id);
    console.log('Status:', consultation.data.consultation.status);

    console.log('\n' + '='.repeat(40));
    console.log('🎉 CONSULTATION EMAIL TEST COMPLETED!');
    console.log('='.repeat(40));
    console.log('📬 CHECK YOUR EMAIL INBOX:');
    console.log(`   📧 ${YOUR_EMAIL}`);
    console.log('');
    console.log('You should receive:');
    console.log('✉️  Consultation Scheduled Confirmation');
    console.log('');
    console.log('📱 If not in inbox, check:');
    console.log('   - Spam/Junk folder');
    console.log('   - Promotions tab (Gmail)');
    console.log('   - All Mail folder');
    console.log('');
    console.log('🎨 Email should have:');
    console.log('   - Apply Bureau logo');
    console.log('   - Green/blue professional branding');
    console.log('   - Consultation details');
    console.log('   - Preparation tips');
    console.log('');
    console.log('📅 Consultation Details:');
    console.log(`   Date: ${futureDate.toLocaleDateString()}`);
    console.log(`   Time: ${futureDate.toLocaleTimeString()}`);
    console.log('   Duration: 60 minutes');
    console.log('   Type: Career Advisory Session');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.log('\n⚠️  Request timed out');
      console.log('This might be normal - email sending can take time');
      console.log('Check your email anyway, it might have been sent');
    }
  }
}

testConsultationEmail();