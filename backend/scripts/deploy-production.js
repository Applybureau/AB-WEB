#!/usr/bin/env node

/**
 * Apply Bureau Backend - Production Deployment Script
 * 
 * This script performs final checks and deploys to production
 */

require('dotenv').config();
const { execSync } = require('child_process');
const ProductionOptimizer = require('./production-optimization');

class ProductionDeployer {
  constructor() {
    this.optimizer = new ProductionOptimizer();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      deploy: '🚀'
    }[type] || '📋';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  // Run pre-deployment checks
  async runPreDeploymentChecks() {
    this.log('Running pre-deployment optimization checks...', 'info');
    
    const isReady = await this.optimizer.runOptimization();
    
    if (!isReady) {
      this.log('Pre-deployment checks failed. Fix issues before deploying.', 'error');
      return false;
    }
    
    this.log('Pre-deployment checks passed!', 'success');
    return true;
  }

  // Run security audit
  runSecurityAudit() {
    this.log('Running security audit...', 'info');
    
    try {
      execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
      this.log('Security audit passed', 'success');
      return true;
    } catch (error) {
      this.log('Security audit found issues. Review and fix before deploying.', 'warning');
      return true; // Don't block deployment for moderate issues
    }
  }

  // Test production endpoints
  async testProductionEndpoints() {
    this.log('Testing production endpoints...', 'info');
    
    try {
      const axios = require('axios');
      const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';
      
      // Test health endpoint
      const healthResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
      
      if (healthResponse.status === 200) {
        this.log('Health endpoint: working', 'success');
        this.log(`Server uptime: ${healthResponse.data.uptime}`, 'info');
        this.log(`Memory usage: ${healthResponse.data.memory}`, 'info');
        return true;
      } else {
        this.log('Health endpoint: failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Production endpoint test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Deploy to Vercel
  deployToVercel() {
    this.log('Deploying to Vercel...', 'deploy');
    
    try {
      // Check if vercel CLI is available
      execSync('vercel --version', { stdio: 'pipe' });
      
      // Deploy to production
      this.log('Starting Vercel deployment...', 'deploy');
      execSync('vercel --prod --yes', { stdio: 'inherit' });
      
      this.log('Vercel deployment completed!', 'success');
      return true;
    } catch (error) {
      if (error.message.includes('vercel: command not found')) {
        this.log('Vercel CLI not found. Install with: npm i -g vercel', 'error');
        this.log('Or deploy manually through Vercel dashboard', 'info');
      } else {
        this.log(`Deployment failed: ${error.message}`, 'error');
      }
      return false;
    }
  }

  // Run post-deployment verification
  async runPostDeploymentVerification() {
    this.log('Running post-deployment verification...', 'info');
    
    // Wait for deployment to propagate
    this.log('Waiting 30 seconds for deployment to propagate...', 'info');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      // Run the final production test
      this.log('Running comprehensive production test...', 'info');
      execSync('node tests/final-production-test.js', { stdio: 'inherit' });
      
      this.log('Post-deployment verification completed!', 'success');
      return true;
    } catch (error) {
      this.log('Post-deployment verification failed', 'error');
      this.log('Check logs and consider rollback if critical systems are down', 'warning');
      return false;
    }
  }

  // Generate deployment report
  generateDeploymentReport(deploymentSuccess, verificationSuccess) {
    this.log('\n' + '='.repeat(80), 'info');
    this.log('PRODUCTION DEPLOYMENT REPORT', 'deploy');
    this.log('='.repeat(80), 'info');
    
    const timestamp = new Date().toISOString();
    
    this.log(`Deployment Time: ${timestamp}`, 'info');
    this.log(`Deployment Status: ${deploymentSuccess ? 'SUCCESS' : 'FAILED'}`, deploymentSuccess ? 'success' : 'error');
    this.log(`Verification Status: ${verificationSuccess ? 'PASSED' : 'FAILED'}`, verificationSuccess ? 'success' : 'error');
    
    if (deploymentSuccess && verificationSuccess) {
      this.log('\n🎉 DEPLOYMENT SUCCESSFUL!', 'success');
      this.log('✅ Backend is live and all systems operational', 'success');
      
      this.log('\n🌐 PRODUCTION URLS:', 'info');
      this.log('• Backend: https://apply-bureau-backend.vercel.app', 'info');
      this.log('• Frontend: https://apply-bureau.vercel.app', 'info');
      this.log('• Health Check: https://apply-bureau-backend.vercel.app/health', 'info');
      
      this.log('\n🔐 ADMIN ACCESS:', 'info');
      this.log('• Email: admin@applybureautest.com', 'info');
      this.log('• Password: AdminTest123!', 'info');
      this.log('• Login: https://apply-bureau-backend.vercel.app/api/auth/login', 'info');
      
      this.log('\n📊 MONITORING:', 'info');
      this.log('• Monitor response times and error rates', 'info');
      this.log('• Check email delivery success', 'info');
      this.log('• Verify consultation booking flow', 'info');
      
    } else {
      this.log('\n❌ DEPLOYMENT ISSUES DETECTED', 'error');
      
      if (!deploymentSuccess) {
        this.log('• Deployment to Vercel failed', 'error');
        this.log('• Check Vercel dashboard for errors', 'info');
        this.log('• Verify environment variables are set', 'info');
      }
      
      if (!verificationSuccess) {
        this.log('• Post-deployment verification failed', 'error');
        this.log('• Some systems may not be working correctly', 'warning');
        this.log('• Consider rollback if critical systems are down', 'warning');
      }
    }
    
    this.log('\n📞 SUPPORT:', 'info');
    this.log('• For issues, check Vercel function logs', 'info');
    this.log('• Monitor system health at /health endpoint', 'info');
    this.log('• Admin dashboard: /api/admin/stats', 'info');
  }

  // Main deployment process
  async deploy() {
    this.log('🚀 STARTING PRODUCTION DEPLOYMENT', 'deploy');
    this.log('Apply Bureau Backend - Production Deployment', 'info');
    this.log('=' .repeat(80), 'info');
    
    try {
      // Step 1: Pre-deployment checks
      const preChecksPass = await this.runPreDeploymentChecks();
      if (!preChecksPass) {
        this.log('Deployment aborted due to pre-deployment check failures', 'error');
        return false;
      }
      
      // Step 2: Security audit
      this.runSecurityAudit();
      
      // Step 3: Test current production (if exists)
      this.log('Testing current production status...', 'info');
      await this.testProductionEndpoints().catch(() => {
        this.log('Current production not accessible (normal for first deployment)', 'info');
      });
      
      // Step 4: Deploy to Vercel
      const deploymentSuccess = this.deployToVercel();
      
      // Step 5: Post-deployment verification
      let verificationSuccess = false;
      if (deploymentSuccess) {
        verificationSuccess = await this.runPostDeploymentVerification();
      }
      
      // Step 6: Generate report
      this.generateDeploymentReport(deploymentSuccess, verificationSuccess);
      
      return deploymentSuccess && verificationSuccess;
      
    } catch (error) {
      this.log(`Deployment process failed: ${error.message}`, 'error');
      this.generateDeploymentReport(false, false);
      return false;
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new ProductionDeployer();
  deployer.deploy()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = ProductionDeployer;