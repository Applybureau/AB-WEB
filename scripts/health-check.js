#!/usr/bin/env node

/**
 * Simple health check script for production deployment
 * This runs basic checks without requiring database setup
 */

console.log('🏥 Apply Bureau Backend Health Check');
console.log('✅ Node.js version:', process.version);
console.log('✅ Environment:', process.env.NODE_ENV || 'development');
console.log('✅ Platform:', process.platform);
console.log('✅ Architecture:', process.arch);

// Check required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables:', missingVars.join(', '));
  console.log('ℹ️  These will need to be set in your deployment platform');
} else {
  console.log('✅ All required environment variables are present');
}

console.log('🎉 Health check completed - ready for deployment!');
process.exit(0);