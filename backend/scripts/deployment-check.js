#!/usr/bin/env node

/**
 * Deployment Check Script
 * Verifies all dependencies and configurations are ready for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Running Deployment Check...');

// Check required files
const requiredFiles = [
  'server.js',
  'package.json',
  '.env.example',
  '.do/app.yaml'
];

console.log('\n📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

// Check environment variables
console.log('\n🔧 Checking environment variables...');
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET',
  'NODE_ENV',
  'FRONTEND_URL'
];

let missingEnvVars = [];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`❌ ${envVar} - MISSING`);
    missingEnvVars.push(envVar);
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = require('../package.json');
const requiredScripts = ['start', 'build'];

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`❌ ${script} - MISSING`);
  }
});

// Check dependencies
console.log('\n📚 Checking critical dependencies...');
const criticalDeps = [
  'express',
  'dotenv',
  '@supabase/supabase-js',
  'resend',
  'jsonwebtoken',
  'bcryptjs',
  'cors',
  'helmet'
];

let missingDeps = [];

criticalDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    missingDeps.push(dep);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📋 DEPLOYMENT CHECK SUMMARY');
console.log('='.repeat(50));

if (missingFiles.length === 0 && missingEnvVars.length === 0 && missingDeps.length === 0) {
  console.log('🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!');
  process.exit(0);
} else {
  console.log('❌ DEPLOYMENT ISSUES FOUND:');
  
  if (missingFiles.length > 0) {
    console.log(`\n📁 Missing Files: ${missingFiles.join(', ')}`);
  }
  
  if (missingEnvVars.length > 0) {
    console.log(`\n🔧 Missing Environment Variables: ${missingEnvVars.join(', ')}`);
  }
  
  if (missingDeps.length > 0) {
    console.log(`\n📚 Missing Dependencies: ${missingDeps.join(', ')}`);
  }
  
  console.log('\n🔧 Please fix these issues before deploying.');
  process.exit(1);
}