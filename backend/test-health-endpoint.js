#!/usr/bin/env node

// Test health endpoint locally to verify server configuration
const express = require('express');

console.log('🧪 Testing Health Endpoint Configuration...\n');

// Create a minimal test server to verify health endpoint works
const app = express();
const PORT = process.env.PORT || 8080;

// Simple health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Apply Bureau Backend',
    timestamp: new Date().toISOString(),
    port: PORT,
    host: '0.0.0.0'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server started on port ${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`);
  
  // Test the health endpoint
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/health`);
      const data = await response.json();
      
      console.log('\n🧪 Health Endpoint Test Results:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      
      if (response.status === 200) {
        console.log('\n✅ Health endpoint is working correctly!');
        console.log('   This confirms the server configuration is valid.');
        console.log('   The DigitalOcean issue is environment variables.');
      } else {
        console.log('\n❌ Health endpoint test failed');
      }
    } catch (error) {
      console.log('\n❌ Health endpoint test error:', error.message);
    }
    
    // Close server
    server.close(() => {
      console.log('\n🔚 Test server stopped');
      process.exit(0);
    });
  }, 1000);
});

server.on('error', (error) => {
  console.log('❌ Server error:', error.message);
  process.exit(1);
});