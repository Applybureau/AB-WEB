#!/usr/bin/env node

/**
 * Production Start Script
 * Optimized startup for DigitalOcean deployment
 */

// Set production environment
process.env.NODE_ENV = 'production';

// Optimize Node.js for production
process.env.NODE_OPTIONS = '--max-old-space-size=512 --optimize-for-size';

console.log('🚀 Starting Apply Bureau Backend in Production Mode...');
console.log(`📊 Memory Limit: 512MB`);
console.log(`🔧 Port: ${process.env.PORT || 8080}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV}`);

// Pre-flight checks
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET'
];

let missingVars = [];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
});

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('✅ Environment variables validated');

// Start the server
try {
  require('../server.js');
} catch (error) {
  console.error('💥 Server startup failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}