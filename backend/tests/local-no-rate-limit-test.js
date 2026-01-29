#!/usr/bin/env node

/**
 * Local No Rate Limit Test
 * Verifies that rate limiting has been removed
 */

const express = require('express');
const request = require('supertest');

// Import the server
const app = require('../server');

const testNoRateLimit = async () => {
  console.log('🧪 Testing that rate limiting has been removed...');
  
  try {
    // Make multiple rapid login attempts
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // Check if any response is 429 (rate limited)
    const rateLimited = responses.some(res => res.status === 429);
    
    if (rateLimited) {
      console.log('❌ Rate limiting is still active');
      return false;
    } else {
      console.log('✅ Rate limiting has been successfully removed');
      return true;
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
};

testNoRateLimit().then(success => {
  process.exit(success ? 0 : 1);
});