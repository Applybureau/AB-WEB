#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function testConsultationEndpoint() {
  try {
    const response = await axios.post('http://localhost:3000/api/consultation-requests', {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      message: 'Health check test consultation request',
      preferredSlots: ['2024-02-01T10:00:00Z', '2024-02-01T14:00:00Z'],
      consultation_type: 'general_consultation',
      urgency_level: 'normal',
      source: 'health_check'
    });
    
    console.log('✓ Success:', response.status, response.data);
  } catch (error) {
    console.log('✗ Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.data) {
      console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testConsultationEndpoint();