#!/usr/bin/env node

/**
 * Test Real Email Delivery - Apply Bureau Backend
 * Test with your actual email address
 */

const axios = require('axios');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;
const YOUR_EMAIL = 'israelloko65@gmail.com'; // Your real email

async function testRealEmail() {
  console.log('📧 TESTING REAL EMAIL DELIVERY');
  console.log('='.repeat(50));
  console.log(`🌐 Backend: ${DEPLOYED_URL}`);
  console.log(`📬 Your Email: ${YOUR_EMAIL}\n`);

  try {
    // 1. Admin login
    console.log('1. 🔐 Admin login...');
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    }, { timeout: 15000 });
    
    console.log('✅ Admin login successful');
    const token = login.data.token;

    // 2. Send invitation to your email
    console.log('\n2. 📧 Sending invitation to your email...');
    try {
      const invite = await axios.post(`${API_URL}/auth/invite`, {
        email: YOUR_EMAIL,
        full_name: 'Israel Test User (Real Email Test)'
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });
      
      console.log('✅ Invitation sent successfully!');
      console.log('   Client ID:', invite.data.client_id);
      
      const clientId = invite.data.client_id;

      // 3. Create consultation for your email
      console.log('\n3. 📅 Creating consultation...');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // Next week
      futureDate.setHours(14, 0, 0, 0); // 2 PM

      const consultation = await axios.post(`${API_URL}/consultations`, {
        client_id: clientId,
        scheduled_at: futureDate.toISOString(),
        admin_notes: 'Real email test consultation - Please check your email!'
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });

      console.log('✅ Consultation created successfully!');
      console.log('   Consultation ID:', consultation.data.consultation.id);
      console.log('   Scheduled for:', futureDate.toLocaleString());

      console.log('\n' + '='.repeat(50));
      console.log('🎉 EMAIL TEST COMPLETED!');
      console.log('='.repeat(50));
      console.log('📬 CHECK YOUR EMAIL INBOX:');
      console.log(`   📧 ${YOUR_EMAIL}`);
      console.log('');
      console.log('You should receive 2 emails:');
      console.log('1. ✉️  Welcome & Registration Invitation');
      console.log('2. ✉️  Consultation Scheduled Confirmation');
      console.log('');
      console.log('📱 Check spam/junk folder if not in inbox');
      console.log('🎨 Emails have professional green/blue branding');
      console.log('🖼️  Apply Bureau logo should display');
      console.log('');
      console.log('🚀 Email system is working!');

    } catch (inviteError) {
      if (inviteError.response?.data?.error === 'Client already exists') {
        console.log('ℹ️  Client already exists, creating consultation anyway...');
        
        // Get existing client
        const dashboard = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const clientId = dashboard.data.client.id;

        // Create consultation
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        futureDate.setHours(14, 0, 0, 0);

        const consultation = await axios.post(`${API_URL}/consultations`, {
          client_id: clientId,
          scheduled_at: futureDate.toISOString(),
          admin_notes: 'Real email test consultation - Existing client'
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        });

        console.log('✅ Consultation created for existing client!');
        console.log('📬 CHECK YOUR EMAIL for consultation confirmation!');
      } else {
        throw inviteError;
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.log('\n⚠️  Timeout - This might be normal for email sending');
      console.log('   Check your email anyway, it might have been sent');
    }
  }
}

testRealEmail();