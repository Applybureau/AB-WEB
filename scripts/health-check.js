#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * Tests all critical system components:
 * - Database connectivity
 * - Email service
 * - Storage access
 * - API endpoints
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const axios = require('axios');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

async function checkDatabase() {
  log.title('Database Health Check');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    log.success('Database connection: OK');
    
    // Test each table
    const tables = [
      'profiles',
      'admin_users', 
      'applications',
      'consultations',
      'notifications',
      'contact_submissions',
      'consultation_requests'
    ];
    
    let tablesExist = 0;
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (tableError && tableError.code === 'PGRST116') {
          log.warning(`Table ${table}: Does not exist (run MASTER_SCHEMA.sql)`);
        } else if (tableError) {
          throw tableError;
        } else {
          log.success(`Table ${table}: OK`);
          tablesExist++;
        }
      } catch (err) {
        log.error(`Table ${table}: ${err.message}`);
      }
    }
    
    if (tablesExist === 0) {
      log.warning('No tables found. Please run MASTER_SCHEMA.sql in your Supabase SQL Editor.');
      return false;
    } else if (tablesExist < tables.length) {
      log.warning(`Only ${tablesExist}/${tables.length} tables found. Consider running MASTER_SCHEMA.sql.`);
    }
    
    return true;
  } catch (error) {
    log.error(`Database: ${error.message}`);
    return false;
  }
}

async function checkEmail() {
  log.title('Email Service Health Check');
  
  try {
    // Check if email environment variables are set
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      log.warning('Email service: Not configured (missing SMTP environment variables)');
      return true; // Don't fail the health check for missing email config
    }
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.verify();
    log.success('Email service: OK');
    return true;
  } catch (error) {
    log.error(`Email service: ${error.message}`);
    return false;
  }
}

async function checkStorage() {
  log.title('Storage Health Check');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check storage buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    const expectedBuckets = ['documents', 'profiles', 'consultations', 'admin-files'];
    const existingBuckets = buckets.map(b => b.name);
    
    for (const bucket of expectedBuckets) {
      if (existingBuckets.includes(bucket)) {
        log.success(`Storage bucket ${bucket}: OK`);
      } else {
        log.warning(`Storage bucket ${bucket}: Missing`);
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Storage: ${error.message}`);
    return false;
  }
}

async function checkAPI() {
  log.title('API Endpoints Health Check');
  
  const baseURL = process.env.API_URL || 'http://localhost:3000';
  
  const endpoints = [
    { path: '/api/health', method: 'GET', auth: false },
    { path: '/api/public/contact', method: 'POST', auth: false, data: { 
      name: 'Test', 
      email: 'test@example.com', 
      subject: 'Health Check', 
      message: 'Test message' 
    }},
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method,
        url: `${baseURL}${endpoint.path}`,
        timeout: 5000
      };
      
      if (endpoint.data) {
        config.data = endpoint.data;
      }
      
      const response = await axios(config);
      
      if (response.status >= 200 && response.status < 300) {
        log.success(`${endpoint.method} ${endpoint.path}: OK (${response.status})`);
      } else {
        log.warning(`${endpoint.method} ${endpoint.path}: ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log.warning(`${endpoint.method} ${endpoint.path}: Server not running`);
      } else {
        log.error(`${endpoint.method} ${endpoint.path}: ${error.message}`);
      }
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function checkEnvironment() {
  log.title('Environment Health Check');
  
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  let allSet = true;
  
  for (const env of required) {
    if (process.env[env]) {
      log.success(`${env}: Set`);
    } else {
      log.error(`${env}: Missing`);
      allSet = false;
    }
  }
  
  // Check email variables (optional but recommended)
  const emailVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS'
  ];
  
  let emailConfigured = true;
  for (const env of emailVars) {
    if (process.env[env]) {
      log.success(`${env}: Set`);
    } else {
      log.warning(`${env}: Not set (email features disabled)`);
      emailConfigured = false;
    }
  }
  
  // Check optional variables
  const optional = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FRONTEND_URL'
  ];
  
  for (const env of optional) {
    if (process.env[env]) {
      log.success(`${env}: Set (optional)`);
    } else {
      log.info(`${env}: Not set (optional)`);
    }
  }
  
  if (!emailConfigured) {
    log.info('Email service not configured - some features will be disabled');
  }
  
  return allSet;
}

async function main() {
  console.log(`
${colors.bold}${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              Apply Bureau Health Check                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`);
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironment },
    { name: 'Database', fn: checkDatabase },
    { name: 'Email Service', fn: checkEmail },
    { name: 'Storage', fn: checkStorage },
    { name: 'API Endpoints', fn: checkAPI }
  ];
  
  const results = [];
  
  for (const check of checks) {
    try {
      const passed = await check.fn();
      results.push({ name: check.name, passed });
    } catch (error) {
      log.error(`${check.name} check failed: ${error.message}`);
      results.push({ name: check.name, passed: false });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  log.title('Health Check Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      log.success(`${result.name}: PASSED`);
    } else {
      log.error(`${result.name}: FAILED`);
    }
  });
  
  console.log(`\n${colors.bold}Overall: ${passed}/${total} checks passed${colors.reset}`);
  
  if (passed === total) {
    log.success('🎉 All health checks passed! System is ready.');
    process.exit(0);
  } else {
    log.error('❌ Some health checks failed. Please review the issues above.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    log.error(`Health check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };