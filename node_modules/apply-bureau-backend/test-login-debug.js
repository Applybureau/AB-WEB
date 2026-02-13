#!/usr/bin/env node

/**
 * Login Debug Test Script
 * Tests the login functionality step by step to identify issues
 */

require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./utils/supabase');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://jellyfish-app-t4m35.ondigitalocean.app';
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';

class LoginDebugger {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '🔍',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'test': '🧪'
    }[type] || '🔍';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testDatabaseConnection() {
    try {
      this.log('Testing database connection...', 'test');
      
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('count')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      this.log('Database connection successful', 'success');
      return true;
    } catch (error) {
      this.log(`Database connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testAdminInDatabase() {
    try {
      this.log('Checking admin in database...', 'test');
      
      // Check clients table
      const { data: clientAdmin, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, email, full_name, password, role, status')
        .eq('email', ADMIN_EMAIL)
        .single();

      if (clientAdmin) {
        this.log(`Found admin in clients table:`, 'success');
        this.log(`  ID: ${clientAdmin.id}`, 'info');
        this.log(`  Email: ${clientAdmin.email}`, 'info');
        this.log(`  Name: ${clientAdmin.full_name}`, 'info');
        this.log(`  Role: ${clientAdmin.role}`, 'info');
        this.log(`  Status: ${clientAdmin.status}`, 'info');
        this.log(`  Has Password: ${!!clientAdmin.password}`, 'info');
        
        // Test password
        if (clientAdmin.password) {
          const passwordMatch = await bcrypt.compare(ADMIN_PASSWORD, clientAdmin.password);
          this.log(`  Password Match: ${passwordMatch}`, passwordMatch ? 'success' : 'error');
          
          if (!passwordMatch) {
            this.log('  Password hash in DB:', 'info');
            this.log(`  ${clientAdmin.password.substring(0, 20)}...`, 'info');
          }
        }
        
        return { found: true, table: 'clients', data: clientAdmin };
      }
      
      // Check admins table
      const { data: adminAdmin, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('id, email, full_name, password, role, is_active')
        .eq('email', ADMIN_EMAIL)
        .single();

      if (adminAdmin) {
        this.log(`Found admin in admins table:`, 'success');
        this.log(`  ID: ${adminAdmin.id}`, 'info');
        this.log(`  Email: ${adminAdmin.email}`, 'info');
        this.log(`  Name: ${adminAdmin.full_name}`, 'info');
        this.log(`  Role: ${adminAdmin.role}`, 'info');
        this.log(`  Active: ${adminAdmin.is_active}`, 'info');
        this.log(`  Has Password: ${!!adminAdmin.password}`, 'info');
        
        return { found: true, table: 'admins', data: adminAdmin };
      }
      
      this.log('Admin not found in any table', 'error');
      return { found: false };
      
    } catch (error) {
      this.log(`Database check failed: ${error.message}`, 'error');
      return { found: false, error: error.message };
    }
  }

  async testServerHealth() {
    try {
      this.log('Testing server health...', 'test');
      
      const response = await axios.get(`${BASE_URL}/health`, {
        timeout: 10000
      });
      
      this.log(`Health check response: ${response.status}`, 'success');
      this.log(`Server status: ${response.data.status}`, 'info');
      
      return true;
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      if (error.response) {
        this.log(`Response status: ${error.response.status}`, 'error');
        this.log(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
      }
      return false;
    }
  }

  async testLoginEndpoint() {
    try {
      this.log('Testing login endpoint...', 'test');
      
      const loginData = {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      };
      
      this.log(`Sending login request to: ${BASE_URL}/api/auth/login`, 'info');
      this.log(`Login data: ${JSON.stringify(loginData)}`, 'info');
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      this.log(`Login successful! Status: ${response.status}`, 'success');
      this.log(`Response data:`, 'success');
      console.log(JSON.stringify(response.data, null, 2));
      
      return { success: true, data: response.data };
      
    } catch (error) {
      this.log(`Login failed: ${error.message}`, 'error');
      
      if (error.response) {
        this.log(`Response status: ${error.response.status}`, 'error');
        this.log(`Response headers:`, 'error');
        console.log(JSON.stringify(error.response.headers, null, 2));
        this.log(`Response data:`, 'error');
        console.log(JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        this.log('No response received from server', 'error');
        this.log(`Request config:`, 'error');
        console.log(JSON.stringify({
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          timeout: error.config?.timeout
        }, null, 2));
      }
      
      return { success: false, error: error.message };
    }
  }

  async testWithToken(token) {
    try {
      this.log('Testing authenticated request...', 'test');
      
      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      this.log(`Authenticated request successful!`, 'success');
      this.log(`User data:`, 'success');
      console.log(JSON.stringify(response.data, null, 2));
      
      return true;
    } catch (error) {
      this.log(`Authenticated request failed: ${error.message}`, 'error');
      if (error.response) {
        this.log(`Response status: ${error.response.status}`, 'error');
        this.log(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
      }
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive login debug tests...', 'info');
    this.log(`Base URL: ${BASE_URL}`, 'info');
    this.log(`Admin Email: ${ADMIN_EMAIL}`, 'info');
    this.log(`Admin Password: ${ADMIN_PASSWORD}`, 'info');
    
    const results = {
      database_connection: false,
      admin_in_database: false,
      server_health: false,
      login_success: false,
      authenticated_request: false
    };
    
    // Test 1: Database Connection
    results.database_connection = await this.testDatabaseConnection();
    
    // Test 2: Admin in Database
    const adminCheck = await this.testAdminInDatabase();
    results.admin_in_database = adminCheck.found;
    
    // Test 3: Server Health
    results.server_health = await this.testServerHealth();
    
    // Test 4: Login Endpoint
    const loginResult = await this.testLoginEndpoint();
    results.login_success = loginResult.success;
    
    // Test 5: Authenticated Request (if login succeeded)
    if (loginResult.success && loginResult.data?.token) {
      results.authenticated_request = await this.testWithToken(loginResult.data.token);
    }
    
    // Summary
    this.log('\n📊 TEST RESULTS SUMMARY:', 'info');
    Object.entries(results).forEach(([test, passed]) => {
      this.log(`${test.replace(/_/g, ' ').toUpperCase()}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'success' : 'error');
    });
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    this.log(`\nOverall: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'success' : 'error');
    
    if (passedTests === totalTests) {
      this.log('\n🎉 All tests passed! Login system is working correctly.', 'success');
    } else {
      this.log('\n❌ Some tests failed. Check the logs above for details.', 'error');
    }
    
    return results;
  }
}

// Run the tests
async function main() {
  const loginDebugger = new LoginDebugger();
  
  try {
    const results = await loginDebugger.runAllTests();
    
    const allPassed = Object.values(results).every(Boolean);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = LoginDebugger;