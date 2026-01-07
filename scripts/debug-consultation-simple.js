#!/usr/bin/env node

/**
 * Debug Consultation Creation - Simple Test
 */

const axios = require('axios');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;

async function debugConsultation() {
  console.log('🔍 DEBUGGING CONSULTATION CREATION');
  console.log('='.repeat(40));

  try {
    // Login
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = login.data.token;
    console.log('✅ Login successful');

    // Get dashboard to get client ID
    const dashboard = await axios.get(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const clientId = dashboard.data.client.id;
    console.log('✅ Got client ID:', clientId);

    // Create consultation with minimal data
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    futureDate.setHours(14, 0, 0, 0);

    console.log('\n📅 Creating consultation...');
    console.log('Client ID:', clientId);
    console.log('Scheduled at:', futureDate.toISOString());

    const consultationData = {
      client_id: clientId,
      scheduled_at: futureDate.toISOString(),
      admin_notes: 'Simple debug test'
    };

    console.log('Request data:', JSON.stringify(consultationData, null, 2));

    const consultation = await axios.post(`${API_URL}/consultations`, consultationData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Consultation created successfully!');
    console.log('Response:', consultation.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    }
  }
}

debugConsultation();