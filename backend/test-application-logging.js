const logger = require('./utils/logger');

// Test application logging functionality
async function testApplicationLogging() {
  console.log('🧪 Testing Application Logging System...\n');

  try {
    // Test different log levels
    logger.info('Application logging test started', { 
      testId: 'app-log-test-001',
      timestamp: new Date().toISOString()
    });

    logger.debug('Debug message for application testing', {
      debugLevel: 'verbose',
      component: 'application-tracker'
    });

    logger.warn('Warning message for application testing', {
      warningType: 'test-warning',
      severity: 'low'
    });

    // Test application-specific logging
    logger.info('Simulating application creation', {
      applicationId: 'test-app-123',
      clientId: 'test-client-456',
      status: 'pending',
      type: 'job_application'
    });

    logger.info('Simulating application status update', {
      applicationId: 'test-app-123',
      oldStatus: 'pending',
      newStatus: 'interview_scheduled',
      updatedBy: 'admin-789'
    });

    // Test error logging
    try {
      throw new Error('Simulated application error for testing');
    } catch (error) {
      logger.error('Application error test', error, {
        applicationId: 'test-app-123',
        operation: 'status_update',
        userId: 'test-user-001'
      });
    }

    // Test performance logging
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    const duration = Date.now() - startTime;
    
    logger.performance('application_query', duration, {
      operation: 'get_applications',
      userId: 'test-user-001',
      resultCount: 5
    });

    // Test security logging
    logger.security('application_access_attempt', {
      userId: 'test-user-001',
      applicationId: 'test-app-123',
      accessType: 'read',
      authorized: true
    });

    // Test HTTP-style logging
    const mockReq = {
      method: 'GET',
      url: '/api/applications',
      ip: '127.0.0.1',
      get: (header) => header === 'User-Agent' ? 'Test-Agent/1.0' : null,
      user: { id: 'test-user-001' }
    };
    
    const mockRes = {
      statusCode: 200
    };
    
    logger.http(mockReq, mockRes, 150);

    console.log('✅ Application logging test completed successfully!');
    console.log('\n📊 Log files updated:');
    console.log('   - app.log (general application logs)');
    console.log('   - error.log (error logs)');
    console.log('   - access.log (HTTP request logs)');
    console.log('   - performance.log (performance metrics)');
    console.log('   - security.log (security events)');
    
    console.log('\n🔍 To view recent logs, run:');
    console.log('   Get-Content logs/app.log -Tail 10');
    console.log('   Get-Content logs/error.log -Tail 5');
    console.log('   Get-Content logs/access.log -Tail 5');

  } catch (error) {
    console.error('❌ Application logging test failed:', error);
    logger.error('Application logging test failed', error);
  }
}

// Run the test
if (require.main === module) {
  testApplicationLogging();
}

module.exports = { testApplicationLogging };