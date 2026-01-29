#!/usr/bin/env node

/**
 * Package.json Validation Script
 * Ensures all dependencies are correctly configured for production deployment
 */

const fs = require('fs');
const path = require('path');

const validatePackageJson = () => {
  console.log('📦 Validating package.json for production deployment...\n');

  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  let hasIssues = false;

  // Check required scripts
  console.log('🔧 CHECKING SCRIPTS:');
  const requiredScripts = {
    'start': 'node server.js',
    'postinstall': 'echo "Dependencies installed successfully"'
  };

  Object.entries(requiredScripts).forEach(([script, expectedCommand]) => {
    if (packageJson.scripts[script] === expectedCommand) {
      console.log(`   ✅ ${script}: Correct`);
    } else {
      console.log(`   ❌ ${script}: Expected "${expectedCommand}", got "${packageJson.scripts[script] || 'missing'}"`);
      hasIssues = true;
    }
  });

  // Check critical dependencies are in dependencies (not devDependencies)
  console.log('\n📚 CHECKING CRITICAL DEPENDENCIES:');
  const criticalDeps = [
    '@supabase/supabase-js',
    'express',
    'dotenv',
    'resend',
    'jsonwebtoken',
    'cors',
    'helmet',
    'morgan',
    'compression'
  ];

  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}: In dependencies`);
    } else if (packageJson.devDependencies[dep]) {
      console.log(`   ❌ ${dep}: In devDependencies (should be in dependencies)`);
      hasIssues = true;
    } else {
      console.log(`   ❌ ${dep}: Missing`);
      hasIssues = true;
    }
  });

  // Check Node.js version requirement
  console.log('\n🔧 CHECKING NODE.JS VERSION:');
  if (packageJson.engines && packageJson.engines.node) {
    console.log(`   ✅ Node.js version specified: ${packageJson.engines.node}`);
  } else {
    console.log('   ⚠️  Node.js version not specified in engines');
    hasIssues = true;
  }

  // Check npm configuration
  console.log('\n⚙️  CHECKING NPM CONFIGURATION:');
  if (packageJson.config && packageJson.config['unsafe-perm'] === false) {
    console.log('   ✅ NPM unsafe-perm configured correctly');
  } else {
    console.log('   ❌ NPM unsafe-perm not configured (needed for DigitalOcean)');
    hasIssues = true;
  }

  // Summary
  console.log('\n📋 VALIDATION SUMMARY:');
  if (hasIssues) {
    console.log('   ❌ Package.json has issues that may cause deployment problems');
    console.log('   🔧 Fix the issues above before deploying');
  } else {
    console.log('   ✅ Package.json is correctly configured for production');
    console.log('   🚀 Ready for DigitalOcean deployment');
  }

  return !hasIssues;
};

// Run validation if called directly
if (require.main === module) {
  const isValid = validatePackageJson();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validatePackageJson };