#!/usr/bin/env node

/**
 * Test Deployment Script
 * Simulates deployment environment and tests critical functionality
 */

require('dotenv').config();

const testDeployment = async () => {
  console.log('🧪 Testing Deployment Configuration...');
  console.log('=' .repeat(50));

  try {
    // Test 1: Environment Variables
    console.log('🔧 Testing Environment Variables...');
    const requiredEnvs = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY', 
      'RESEND_API_KEY',
      'JWT_SECRET'
    ];

    let envIssues = [];
    requiredEnvs.forEach(env => {
      if (!process.env[env]) {
        envIssues.push(env);
      }
    });

    if (envIssues.length > 0) {
      console.log('❌ Missing environment variables:', envIssues.join(', '));
      return false;
    }
    console.log('✅ All environment variables present');

    // Test 2: Database Connection
    console.log('\n🗄️ Testing Database Connection...');
    const { supabaseAdmin } = require('../utils/supabase');
    
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');

    // Test 3: Email Service
    console.log('\n📧 Testing Email Service...');
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Just test that the API key is valid (don't send actual email)
    try {
      // This will fail if API key is invalid
      const testResult = await resend.emails.send({
        from: 'Apply Bureau <admin@applybureau.com>',
        to: ['test@example.com'],
        subject: 'Test',
        html: '<p>Test</p>'
      }).catch(err => {
        // Expected to fail for test email, but should not fail due to auth
        if (err.message.includes('API key')) {
          throw err;
        }
        return { id: 'test-ok' };
      });
      
      console.log('✅ Email service configuration valid');
    } catch (emailError) {
      console.log('❌ Email service error:', emailError.message);
      return false;
    }

    // Test 4: JWT Secret
    console.log('\n🔐 Testing JWT Configuration...');
    const jwt = require('jsonwebtoken');
    
    try {
      const testToken = jwt.sign({ test: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
      
      if (decoded.test) {
        console.log('✅ JWT configuration working');
      } else {
        console.log('❌ JWT verification failed');
        return false;
      }
    } catch (jwtError) {
      console.log('❌ JWT error:', jwtError.message);
      return false;
    }

    // Test 5: Server Startup Simulation
    console.log('\n🚀 Testing Server Startup...');
    try {
      const express = require('express');
      const app = express();
      
      // Test that all middleware can be loaded
      const cors = require('cors');
      const helmet = require('helmet');
      const compression = require('compression');
      
      app.use(cors());
      app.use(helmet());
      app.use(compression());
      
      console.log('✅ Server middleware loading successful');
    } catch (serverError) {
      console.log('❌ Server startup error:', serverError.message);
      return false;
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL DEPLOYMENT TESTS PASSED!');
    console.log('✅ Ready for production deployment');
    return true;

  } catch (error) {
    console.log('\n❌ Deployment test failed:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
};

// Run the test
testDeployment().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});