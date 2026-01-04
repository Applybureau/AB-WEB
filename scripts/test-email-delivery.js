#!/usr/bin/env node

/**
 * Test Email Delivery Script
 * Sends a real invitation email to israelloko65@gmail.com
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;
const TEST_EMAIL = 'israelloko65@gmail.com';

async function testEmailDelivery() {
  console.log('🌍 Apply Bureau - Email Delivery Test');
  console.log(`📧 Testing email delivery to: ${TEST_EMAIL}\n`);

  try {
    // Step 1: Admin login
    console.log('👤 Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });

    if (!loginResponse.data.token) {
      console.log('❌ Admin login failed');
      return;
    }

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Delete existing client if exists (to test fresh invitation)
    console.log('\n🗑️  Checking for existing client...');
    try {
      const { supabaseAdmin } = require('../utils/supabase');
      const { error: deleteError } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('email', TEST_EMAIL);
      
      if (!deleteError) {
        console.log('✅ Existing client removed (if any)');
      }
    } catch (error) {
      console.log('ℹ️  No existing client to remove');
    }

    // Step 3: Send fresh invitation
    console.log('\n📧 Sending fresh invitation...');
    const inviteResponse = await axios.post(`${API_URL}/auth/invite`, {
      email: TEST_EMAIL,
      full_name: 'Israel Test User'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (inviteResponse.data.client_id) {
      console.log('✅ Invitation sent successfully!');
      console.log(`📬 Check your email at ${TEST_EMAIL}`);
      console.log('📧 You should receive a professional welcome email with:');
      console.log('   - Apply Bureau logo');
      console.log('   - Professional styling');
      console.log('   - Registration link');
      console.log('   - Feature overview');
      
      // Step 4: Test consultation email
      console.log('\n📅 Creating test consultation...');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const consultationResponse = await axios.post(`${API_URL}/consultations`, {
        client_id: inviteResponse.data.client_id,
        scheduled_at: futureDate.toISOString(),
        notes: 'Test consultation - Career guidance session'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (consultationResponse.data.consultation) {
        console.log('✅ Consultation created - check for consultation email!');
      }

      // Step 5: Test application status email
      console.log('\n💼 Creating test application...');
      const applicationResponse = await axios.post(`${API_URL}/applications`, {
        client_id: inviteResponse.data.client_id,
        job_title: 'Senior Full-Stack Developer',
        company: 'Tech Innovations Ltd',
        job_link: 'https://example.com/job/senior-fullstack-developer',
        status: 'applied'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (applicationResponse.data.application) {
        console.log('✅ Application created');
        
        // Update status to trigger email
        const updateResponse = await axios.patch(`${API_URL}/applications/${applicationResponse.data.application.id}`, {
          status: 'interview'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        if (updateResponse.data) {
          console.log('✅ Application status updated - check for status update email!');
        }
      }

      console.log('\n🎉 Email delivery test completed!');
      console.log(`📧 Check ${TEST_EMAIL} for multiple test emails:`);
      console.log('   1. Welcome/Invitation email');
      console.log('   2. Consultation scheduled email');
      console.log('   3. Application status update email');
      console.log('\n📱 All emails should display the Apply Bureau logo and professional styling.');

    } else {
      console.log('❌ Failed to send invitation');
      console.log('Response:', inviteResponse.data);
    }

  } catch (error) {
    console.error('❌ Email delivery test failed:', error.response?.data || error.message);
  }
}

testEmailDelivery();