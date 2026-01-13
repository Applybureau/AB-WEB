// Load environment variables
require('dotenv').config();

const axios = require('axios');
const { supabaseAdmin } = require('../utils/supabase');
const { NotificationHelpers, createNotification } = require('../utils/notifications');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://apply-bureau-backend.vercel.app'
  : 'http://localhost:3000';

const API_URL = `${BASE_URL}/api`;

// Test data
const testConsultation = {
  id: '00000000-0000-0000-0000-000000000002',
  full_name: 'John Doe',
  email: 'john.doe@example.com',
  role_targets: 'Software Engineer',
  package_interest: 'Premium Package',
  current_country: 'United States'
};

const testUserId = '00000000-0000-0000-0000-000000000001';

async function testNotificationSystem() {
  console.log('🧪 Testing Comprehensive Notification System');
  console.log('=' .repeat(50));

  try {
    // Test 1: Database Schema Enhancement
    console.log('\n1. Testing Database Schema...');
    const { data: tableInfo, error: schemaError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'notifications');

    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError);
    } else {
      console.log('✅ Notifications table schema verified');
      console.log('Columns:', tableInfo.map(col => `${col.column_name} (${col.data_type})`).join(', '));
    }

    // Test 2: Create Direct Notification
    console.log('\n2. Testing Direct Notification Creation...');
    try {
      const directNotification = await createNotification({
        userId: testUserId,
        type: 'test_notification',
        title: 'Test Direct Notification',
        message: 'This is a test notification created directly.',
        category: 'system',
        priority: 'medium',
        metadata: { test: true, timestamp: new Date().toISOString() }
      });
      console.log('✅ Direct notification created:', directNotification.id);
    } catch (error) {
      console.error('❌ Direct notification failed:', error.message);
    }

    // Test 3: Consultation Notification Helpers
    console.log('\n3. Testing Consultation Notification Helpers...');
    
    try {
      // Test consultation submitted notification
      await NotificationHelpers.consultationSubmitted(testUserId, testConsultation);
      console.log('✅ Consultation submitted notification created');
    } catch (error) {
      console.error('❌ Consultation submitted notification failed:', error.message);
    }

    try {
      // Test consultation under review notification
      await NotificationHelpers.consultationUnderReview(testUserId, testConsultation);
      console.log('✅ Consultation under review notification created');
    } catch (error) {
      console.error('❌ Consultation under review notification failed:', error.message);
    }

    try {
      // Test consultation approved notification
      await NotificationHelpers.consultationApproved(testUserId, testConsultation);
      console.log('✅ Consultation approved notification created');
    } catch (error) {
      console.error('❌ Consultation approved notification failed:', error.message);
    }

    // Test 4: Admin Notification Helpers
    console.log('\n4. Testing Admin Notification Helpers...');
    
    try {
      // Test new consultation request admin notification
      await NotificationHelpers.newConsultationRequest(testConsultation);
      console.log('✅ Admin consultation request notification created');
    } catch (error) {
      console.error('❌ Admin consultation request notification failed:', error.message);
    }

    // Test 5: Application Tracking Notifications
    console.log('\n5. Testing Application Tracking Notifications...');
    
    const testApplication = {
      id: '00000000-0000-0000-0000-000000000003',
      company: 'Tech Corp',
      position: 'Senior Developer'
    };

    try {
      await NotificationHelpers.applicationCreated(testUserId, testApplication);
      console.log('✅ Application created notification created');
    } catch (error) {
      console.error('❌ Application created notification failed:', error.message);
    }

    try {
      await NotificationHelpers.applicationStatusChanged(testUserId, testApplication, 'applied', 'interview');
      console.log('✅ Application status changed notification created');
    } catch (error) {
      console.error('❌ Application status changed notification failed:', error.message);
    }

    // Test 6: File Upload Notifications
    console.log('\n6. Testing File Upload Notifications...');
    
    try {
      await NotificationHelpers.fileUploaded(testUserId, 'resume.pdf', 'Resume');
      console.log('✅ File upload notification created');
    } catch (error) {
      console.error('❌ File upload notification failed:', error.message);
    }

    // Test 7: Meeting Notifications
    console.log('\n7. Testing Meeting Notifications...');
    
    const testMeeting = {
      id: '00000000-0000-0000-0000-000000000004',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      await NotificationHelpers.meetingScheduled(testUserId, testMeeting);
      console.log('✅ Meeting scheduled notification created');
    } catch (error) {
      console.error('❌ Meeting scheduled notification failed:', error.message);
    }

    // Test 8: System Notifications
    console.log('\n8. Testing System Notifications...');
    
    try {
      await NotificationHelpers.systemMaintenance('System maintenance scheduled for server updates.', 'Sunday 2:00 AM EST');
      console.log('✅ System maintenance notification created');
    } catch (error) {
      console.error('❌ System maintenance notification failed:', error.message);
    }

    // Test 9: Notification API Endpoints (if server is running)
    console.log('\n9. Testing Notification API Endpoints...');
    
    try {
      // Test unread count endpoint (without auth for now)
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      
      if (response.status === 401) {
        console.log('✅ Notification API endpoint accessible (requires auth as expected)');
      } else if (response.status === 200) {
        console.log('✅ Notification API endpoint working:', response.data);
      } else {
        console.log(`⚠️ Notification API returned status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️ Server not running - API endpoint test skipped');
      } else {
        console.error('❌ API endpoint test failed:', error.message);
      }
    }

    // Test 10: Verify Created Notifications
    console.log('\n10. Verifying Created Notifications...');
    
    try {
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Failed to fetch test notifications:', error);
      } else {
        console.log(`✅ Found ${notifications.length} test notifications`);
        notifications.forEach((notification, index) => {
          console.log(`   ${index + 1}. ${notification.title} (${notification.category}/${notification.priority})`);
        });
      }
    } catch (error) {
      console.error('❌ Notification verification failed:', error.message);
    }

    // Test 11: Cleanup Test Data
    console.log('\n11. Cleaning Up Test Data...');
    
    try {
      const { error: cleanupError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', testUserId);

      if (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError);
      } else {
        console.log('✅ Test notifications cleaned up');
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Notification System Test Complete!');
    console.log('\nNext Steps:');
    console.log('1. Apply database schema: Run ENHANCE_NOTIFICATIONS_TABLE.sql in Supabase');
    console.log('2. Test with real user data');
    console.log('3. Integrate with frontend notification dropdown');
    console.log('4. Set up real-time notification polling');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testNotificationSystem();
}

module.exports = { testNotificationSystem };