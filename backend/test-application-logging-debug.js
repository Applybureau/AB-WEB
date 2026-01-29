const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

async function testApplicationLogging() {
  console.log('🔍 Testing Application Logging Functionality');
  console.log('===========================================');

  try {
    // 1. Admin login
    console.log('1. Admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'applybureau@gmail.com',
      password: 'Admin123@#'
    });

    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Admin login successful');

    // 2. Test application routes availability
    console.log('\n2. Testing application routes availability...');
    const routesToTest = [
      '/api/applications',
      '/api/applications/stats',
      '/api/applications/weekly',
      '/api/applications/discovery-mode'
    ];

    for (const route of routesToTest) {
      try {
        const response = await axios.get(`${BASE_URL}${route}`, { headers });
        console.log(`✅ ${route} - Available (${response.status})`);
        
        if (route === '/api/applications') {
          console.log(`   Found ${response.data.applications?.length || 0} applications`);
          console.log(`   User role: ${response.data.user_role}`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${route} - Not Found (404)`);
        } else if (error.response?.status === 403) {
          console.log(`⚠️  ${route} - Access Denied (403) - May need client token`);
        } else {
          console.log(`❌ ${route} - Error: ${error.response?.status || 'Unknown'} - ${error.response?.data?.error || error.message}`);
        }
      }
    }

    // 3. Test creating an application
    console.log('\n3. Testing application creation...');
    try {
      // First, let's get a client ID to use
      const clientsResponse = await axios.get(`${BASE_URL}/api/admin/clients`, { headers });
      const clients = clientsResponse.data.clients || [];
      
      if (clients.length === 0) {
        console.log('⚠️  No clients found to test application creation');
      } else {
        const testClient = clients[0];
        console.log(`   Using client: ${testClient.full_name} (${testClient.email})`);

        const applicationData = {
          client_id: testClient.id,
          company_name: 'Test Company Inc.',
          job_title: 'Software Engineer',
          job_description: 'Test job description for application logging',
          job_link: 'https://example.com/job',
          salary_range: '$80,000 - $100,000',
          location: 'Remote',
          job_type: 'full-time',
          application_method: 'online',
          application_strategy: 'direct application',
          admin_notes: 'Test application created for logging verification'
        };

        const createResponse = await axios.post(`${BASE_URL}/api/applications`, applicationData, { headers });
        
        if (createResponse.status === 201) {
          console.log('✅ Application creation working');
          console.log(`   Created application ID: ${createResponse.data.application.id}`);
          
          // Test updating the application
          const updateData = {
            status: 'interview_requested',
            admin_notes: 'Updated for testing - interview requested'
          };
          
          const updateResponse = await axios.patch(`${BASE_URL}/api/applications/${createResponse.data.application.id}`, updateData, { headers });
          
          if (updateResponse.status === 200) {
            console.log('✅ Application update working');
            console.log(`   Updated status to: ${updateResponse.data.application.status}`);
          } else {
            console.log('❌ Application update failed');
          }
        } else {
          console.log('❌ Application creation failed');
        }
      }
    } catch (error) {
      console.log('❌ Application creation/update failed:', error.response?.data?.error || error.message);
      if (error.response?.data?.details) {
        console.log('   Details:', error.response.data.details);
      }
    }

    // 4. Test client login and application access
    console.log('\n4. Testing client access to applications...');
    try {
      // Try to get a client with credentials
      const clientsResponse = await axios.get(`${BASE_URL}/api/admin/clients`, { headers });
      const clients = clientsResponse.data.clients || [];
      
      if (clients.length > 0) {
        const testClient = clients[0];
        console.log(`   Testing with client: ${testClient.email}`);
        
        // Try client login (this might fail if we don't have client passwords)
        try {
          const clientLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testClient.email,
            password: 'TestPassword123!' // This is likely to fail
          });
          
          const clientToken = clientLoginResponse.data.token;
          const clientHeaders = {
            'Authorization': `Bearer ${clientToken}`,
            'Content-Type': 'application/json'
          };
          
          // Test client application access
          const clientAppsResponse = await axios.get(`${BASE_URL}/api/applications`, { headers: clientHeaders });
          console.log('✅ Client application access working');
          console.log(`   Client has ${clientAppsResponse.data.applications?.length || 0} applications`);
          
        } catch (loginError) {
          console.log('⚠️  Client login failed (expected - no password set)');
          console.log('   This is normal for admin-created clients without passwords');
        }
      }
    } catch (error) {
      console.log('⚠️  Client access test skipped:', error.message);
    }

    // 5. Test application statistics
    console.log('\n5. Testing application statistics...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/applications/stats`, { headers });
      console.log('✅ Application statistics working');
      console.log('   Stats:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Application statistics failed:', error.response?.data?.error || error.message);
    }

    // 6. Test application email functionality
    console.log('\n6. Testing application email functionality...');
    try {
      // Get applications first
      const appsResponse = await axios.get(`${BASE_URL}/api/applications`, { headers });
      const applications = appsResponse.data.applications || [];
      
      if (applications.length > 0) {
        const testApp = applications[0];
        console.log(`   Testing email for application: ${testApp.title || testApp.id}`);
        
        const emailData = {
          message: 'Test application update message',
          next_steps: 'Please review the application status',
          consultant_email: 'applybureau@gmail.com',
          custom_subject: 'Test Application Update'
        };
        
        const emailResponse = await axios.post(`${BASE_URL}/api/applications/${testApp.id}/send-update`, emailData, { headers });
        
        if (emailResponse.status === 200) {
          console.log('✅ Application email functionality working');
          console.log(`   Email sent to: ${emailResponse.data.sent_to}`);
        } else {
          console.log('❌ Application email failed');
        }
      } else {
        console.log('⚠️  No applications found to test email functionality');
      }
    } catch (error) {
      console.log('❌ Application email test failed:', error.response?.data?.error || error.message);
    }

    // 7. Check database table structure
    console.log('\n7. Checking database table structure...');
    try {
      // This is a simple way to check if the table exists and has data
      const appsResponse = await axios.get(`${BASE_URL}/api/applications?limit=1`, { headers });
      console.log('✅ Applications table exists and is accessible');
      console.log(`   Table has ${appsResponse.data.total || 0} total records`);
    } catch (error) {
      if (error.response?.data?.error?.includes('42P01')) {
        console.log('❌ Applications table does not exist');
      } else {
        console.log('❌ Database access error:', error.response?.data?.error || error.message);
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

// Run the test
testApplicationLogging().then(() => {
  console.log('\n🏁 Application logging test completed');
  console.log('\n📋 SUMMARY:');
  console.log('If you see ❌ errors above, those indicate what\'s not working.');
  console.log('If you see ✅ success messages, those features are working correctly.');
  console.log('\nCommon issues:');
  console.log('- 404 errors: Route not mounted or endpoint doesn\'t exist');
  console.log('- 403 errors: Authentication/authorization issues');
  console.log('- 500 errors: Server-side errors (database, logic issues)');
  console.log('- Database errors: Table doesn\'t exist or schema issues');
}).catch(error => {
  console.error('💥 Test crashed:', error.message);
});