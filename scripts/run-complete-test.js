#!/usr/bin/env node

/**
 * COMPLETE BACKEND TEST RUNNER
 * Starts the server and runs comprehensive tests
 */

require('dotenv').config();
const { spawn } = require('child_process');
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 3000;

let serverProcess = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

async function waitForServer(maxAttempts = 30, interval = 2000) {
  log('Waiting for server to start...', 'yellow');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      if (response.status === 200) {
        log(`✅ Server is ready! (attempt ${attempt}/${maxAttempts})`, 'green');
        return true;
      }
    } catch (error) {
      log(`⏳ Attempt ${attempt}/${maxAttempts} - Server not ready yet...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  log('❌ Server failed to start within timeout period', 'red');
  return false;
}

function startServer() {
  return new Promise((resolve, reject) => {
    logSection('🚀 STARTING BACKEND SERVER');
    
    log('Starting server process...', 'blue');
    
    serverProcess = spawn('node', ['server.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });
    
    let serverOutput = '';
    let serverReady = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      
      // Check if server is ready
      if (output.includes('Apply Bureau Backend started successfully') || 
          output.includes(`listening on port ${PORT}`)) {
        serverReady = true;
        log('✅ Server started successfully!', 'green');
        resolve();
      }
      
      // Log important server messages
      if (output.includes('ERROR') || output.includes('WARN')) {
        log(`Server: ${output.trim()}`, 'yellow');
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      log(`Server Error: ${error.trim()}`, 'red');
    });
    
    serverProcess.on('error', (error) => {
      log(`Failed to start server: ${error.message}`, 'red');
      reject(error);
    });
    
    serverProcess.on('exit', (code, signal) => {
      if (code !== 0 && !serverReady) {
        log(`Server exited with code ${code} and signal ${signal}`, 'red');
        reject(new Error(`Server process exited with code ${code}`));
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        log('❌ Server startup timeout', 'red');
        reject(new Error('Server startup timeout'));
      }
    }, 30000);
  });
}

function stopServer() {
  if (serverProcess) {
    log('Stopping server...', 'yellow');
    serverProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        log('Force killing server...', 'red');
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

async function runTests() {
  logSection('🧪 RUNNING COMPREHENSIVE TESTS');
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('node', ['scripts/test-complete-backend-system.js'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    testProcess.on('exit', (code) => {
      if (code === 0) {
        log('✅ All tests completed successfully!', 'green');
        resolve(true);
      } else {
        log(`❌ Tests failed with exit code ${code}`, 'red');
        resolve(false);
      }
    });
    
    testProcess.on('error', (error) => {
      log(`Test execution error: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function main() {
  logSection('🎯 COMPLETE BACKEND SYSTEM TEST');
  log('This will start the server and run comprehensive tests', 'blue');
  
  let testsPassed = false;
  
  try {
    // Start the server
    await startServer();
    
    // Wait for server to be fully ready
    const serverReady = await waitForServer();
    
    if (!serverReady) {
      throw new Error('Server failed to start properly');
    }
    
    // Run the comprehensive tests
    testsPassed = await runTests();
    
  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'red');
    testsPassed = false;
  } finally {
    // Always stop the server
    stopServer();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Final results
  logSection('🏁 FINAL RESULTS');
  
  if (testsPassed) {
    log('🎉 ALL TESTS PASSED! Backend system is fully functional.', 'green');
    log('✅ Server startup: SUCCESS', 'green');
    log('✅ Database connection: SUCCESS', 'green');
    log('✅ Authentication: SUCCESS', 'green');
    log('✅ Consultation system: SUCCESS', 'green');
    log('✅ All endpoints: SUCCESS', 'green');
  } else {
    log('❌ SOME TESTS FAILED! Please review the output above.', 'red');
  }
  
  process.exit(testsPassed ? 0 : 1);
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  log('\n🛑 Received SIGINT, cleaning up...', 'yellow');
  stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n🛑 Received SIGTERM, cleaning up...', 'yellow');
  stopServer();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log(`💥 Uncaught Exception: ${error.message}`, 'red');
  stopServer();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled Rejection: ${reason}`, 'red');
  stopServer();
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log(`💥 Main execution failed: ${error.message}`, 'red');
    stopServer();
    process.exit(1);
  });
}

module.exports = { main, startServer, stopServer, runTests };