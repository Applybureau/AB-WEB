#!/usr/bin/env node

/**
 * Test Setup Script
 * Prepares the environment for comprehensive testing
 */

const fs = require('fs');
const path = require('path');

class TestSetup {
  constructor() {
    this.log('🔧 Setting up test environment...', 'info');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[TEST-SETUP] ${message}${colors.reset}`);
  }

  checkDependencies() {
    this.log('📦 Checking test dependencies...', 'info');
    
    const requiredDeps = ['axios', 'form-data'];
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
    
    if (missingDeps.length > 0) {
      this.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`, 'error');
      this.log('Run: npm install axios form-data', 'info');
      return false;
    }
    
    this.log('✅ All test dependencies available', 'success');
    return true;
  }

  checkEnvironment() {
    this.log('🌍 Checking environment configuration...', 'info');
    
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`, 'warning');
      this.log('Some tests may fail without proper configuration', 'warning');
    } else {
      this.log('✅ Environment configuration looks good', 'success');
    }
    
    return missingVars.length === 0;
  }

  createTestDirectories() {
    this.log('📁 Creating test directories...', 'info');
    
    const testDirs = [
      path.join(__dirname, 'test-files'),
      path.join(__dirname, 'reports'),
      path.join(__dirname, 'logs')
    ];
    
    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`Created directory: ${path.basename(dir)}`, 'success');
      }
    });
  }

  generateTestConfig() {
    this.log('⚙️  Generating test configuration...', 'info');
    
    const testConfig = {
      baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
      timeout: 30000,
      retries: 3,
      testUsers: {
        admin: {
          email: 'admin@example.com',
          password: 'AdminPassword123!'
        },
        client: {
          email: 'test@example.com',
          password: 'TestPassword123!'
        }
      },
      testData: {
        validEmail: 'test@example.com',
        invalidEmail: 'invalid-email',
        strongPassword: 'StrongPassword123!',
        weakPassword: '123456'
      }
    };
    
    const configPath = path.join(__dirname, 'test-config.json');
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
    
    this.log(`✅ Test configuration saved to: ${path.basename(configPath)}`, 'success');
  }

  checkServerConnection() {
    this.log('🔗 Checking server connection...', 'info');
    
    const axios = require('axios');
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    return axios.get(`${baseUrl}/health`, { timeout: 5000 })
      .then(response => {
        if (response.status === 200) {
          this.log('✅ Server is accessible', 'success');
          return true;
        } else {
          this.log('⚠️  Server responded but may not be healthy', 'warning');
          return false;
        }
      })
      .catch(error => {
        this.log('❌ Server is not accessible', 'error');
        this.log('Make sure the server is running: npm run dev', 'info');
        return false;
      });
  }

  async setup() {
    this.log('🚀 Starting test environment setup', 'info');
    this.log('=' .repeat(50), 'info');
    
    // Check dependencies
    const depsOk = this.checkDependencies();
    if (!depsOk) {
      this.log('❌ Setup failed - missing dependencies', 'error');
      process.exit(1);
    }
    
    // Check environment
    const envOk = this.checkEnvironment();
    
    // Create directories
    this.createTestDirectories();
    
    // Generate config
    this.generateTestConfig();
    
    // Check server
    const serverOk = await this.checkServerConnection();
    
    this.log('=' .repeat(50), 'info');
    this.log('📋 Setup Summary:', 'info');
    this.log(`Dependencies: ${depsOk ? '✅' : '❌'}`, depsOk ? 'success' : 'error');
    this.log(`Environment: ${envOk ? '✅' : '⚠️'}`, envOk ? 'success' : 'warning');
    this.log(`Server: ${serverOk ? '✅' : '❌'}`, serverOk ? 'success' : 'error');
    
    if (depsOk && serverOk) {
      this.log('🎉 Test environment is ready!', 'success');
      this.log('Run tests with: npm run test:comprehensive', 'info');
    } else {
      this.log('⚠️  Some issues detected - tests may fail', 'warning');
      if (!serverOk) {
        this.log('Start the server first: npm run dev', 'info');
      }
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new TestSetup();
  setup.setup().catch(error => {
    console.error('Test setup error:', error);
    process.exit(1);
  });
}

module.exports = TestSetup;