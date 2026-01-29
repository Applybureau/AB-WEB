const axios = require('axios');

// Configuration
const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';
const TEST_CLIENT_EMAIL = 'testclient@applybureau.com';

let adminToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = adminToken) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

async function completeTestClientSetup() {
  console.log('🔧 Completing Test Client Setup');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, '');
    
    if (!loginResult.success) {
      console.log('❌ Admin login failed:', loginResult.error);
      return;
    }
    
    adminToken = loginResult.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Find the test client
    console.log('\n🔍 Finding test client...');
    const clientsResult = await makeRequest('GET', `/api/admin-dashboard/clients?search=${TEST_CLIENT_EMAIL}`);
    
    if (!clientsResult.success) {
      console.log('❌ Failed to search for clients:', clientsResult.error);
      return;
    }
    
    const testClient = clientsResult.data.clients?.find(c => c.email === TEST_CLIENT_EMAIL);
    if (!testClient) {
      console.log('❌ Test client not found. Creating new one...');
      
      // Create client using payment confirmation
      const createResult = await makeRequest('POST', '/api/admin/concierge/payment-confirmation', {
        client_email: TEST_CLIENT_EMAIL,
        client_name: 'Test Client User',
        payment_amount: '$2,500',
        payment_date: new Date().toISOString().split('T')[0],
        package_tier: 'Premium Test Package',
        admin_notes: 'Test client for dashboard testing'
      });
      
      if (createResult.success) {
        console.log('✅ Test client created successfully');
        
        // Search again to find the client
        const newSearchResult = await makeRequest('GET', `/api/admin-dashboard/clients?search=${TEST_CLIENT_EMAIL}`);
        const newClient = newSearchResult.data.clients?.find(c => c.email === TEST_CLIENT_EMAIL);
        if (newClient) {
          console.log('✅ Found newly created client');
          console.log('   Client ID:', newClient.id);
          console.log('   Name:', newClient.full_name);
          console.log('   Email:', newClient.email);
        }
      } else {
        console.log('❌ Failed to create client:', createResult.error);
        return;
      }
    } else {
      console.log('✅ Test client found');
      console.log('   Client ID:', testClient.id);
      console.log('   Name:', testClient.full_name);
      console.log('   Email:', testClient.email);
      console.log('   Role:', testClient.role);
    }
    
    const clientId = testClient?.id;
    if (!clientId) {
      console.log('❌ Could not determine client ID');
      return;
    }
    
    // Step 3: Create test applications for the client
    console.log('\n📊 Creating test applications...');
    const testApplications = [
      {
        client_id: clientId,
        company_name: 'TechCorp Inc',
        job_title: 'Senior Software Engineer',
        job_description: 'Full-stack development role with React and Node.js',
        admin_notes: 'Test application #1 - Applied via LinkedIn'
      },
      {
        client_id: clientId,
        company_name: 'InnovateLabs',
        job_title: 'Full Stack Developer', 
        job_description: 'Modern web development with cloud technologies',
        admin_notes: 'Test application #2 - Applied via company website'
      },
      {
        client_id: clientId,
        company_name: 'DataFlow Systems',
        job_title: 'Tech Lead',
        job_description: 'Technical leadership role with team management',
        admin_notes: 'Test application #3 - Applied via referral'
      }
    ];
    
    let createdCount = 0;
    for (const app of testApplications) {
      const result = await makeRequest('POST', '/api/applications', app);
      
      if (result.success) {
        createdCount++;
        console.log(`✅ Created: ${app.company_name} - ${app.job_title}`);
      } else {
        console.log(`❌ Failed: ${app.company_name} -`, result.error);
      }
    }
    
    console.log(`✅ Created ${createdCount} test applications`);
    
    // Step 4: Check 20Q dashboard for onboarding status
    console.log('\n📝 Checking 20Q onboarding status...');
    const dashboardResult = await makeRequest('GET', '/api/admin/20q-dashboard?limit=50');
    
    if (dashboardResult.success) {
      const clientOnboarding = dashboardResult.data.clients?.find(c => c.email === TEST_CLIENT_EMAIL);
      if (clientOnboarding) {
        console.log('✅ Found client in 20Q dashboard');
        console.log('   20Q Status:', clientOnboarding.twenty_questions.status);
        console.log('   Profile unlocked:', clientOnboarding.profile_unlocked);
        
        if (clientOnboarding.twenty_questions.status === 'pending_approval') {
          console.log('⚠️  Onboarding needs approval - manual intervention required');
        }
      } else {
        console.log('⚠️  Client not found in 20Q dashboard - may need to complete onboarding');
      }
    }
    
    // Step 5: Test client login (this will likely fail until password is set properly)
    console.log('\n🧪 Testing client login...');
    const loginTest = await makeRequest('POST', '/api/auth/login', {
      email: TEST_CLIENT_EMAIL,
      password: 'TestClient123!'
    }, '');
    
    if (loginTest.success) {
      console.log('✅ Client login successful!');
      console.log('   User:', loginTest.data.user.full_name);
      console.log('   Role:', loginTest.data.user.role);
    } else {
      console.log('⚠️  Client login failed (expected - password not set via registration)');
      console.log('   Error:', loginTest.error);
    }
    
    // Final summary
    console.log('\n' + '=' .repeat(50));
    console.log('📋 TEST CLIENT SETUP STATUS');
    console.log('=' .repeat(50));
    console.log('✅ Client account exists:', TEST_CLIENT_EMAIL);
    console.log('✅ Client ID:', clientId);
    console.log('✅ Test applications created:', createdCount);
    console.log('\n🔧 MANUAL STEPS NEEDED:');
    console.log('1. Client needs to complete registration via the registration link');
    console.log('2. Client needs to submit 20Q onboarding questionnaire');
    console.log('3. Admin needs to approve onboarding to unlock profile');
    console.log('\n💡 ALTERNATIVE APPROACH:');
    console.log('Use an existing client account that has already completed onboarding');
    console.log('Check the admin dashboard for clients with unlocked profiles');
    
    // Show existing clients with unlocked profiles
    console.log('\n🔍 Checking for existing unlocked clients...');
    const allClientsResult = await makeRequest('GET', '/api/admin-dashboard/clients?limit=10');
    if (allClientsResult.success && allClientsResult.data.clients) {
      const unlockedClients = allClientsResult.data.clients.filter(c => c.profile_unlocked);
      if (unlockedClients.length > 0) {
        console.log('✅ Found existing unlocked clients:');
        unlockedClients.forEach(client => {
          console.log(`   • ${client.full_name} (${client.email}) - ID: ${client.id}`);
        });
        console.log('\n💡 You can use any of these existing clients for testing!');
      } else {
        console.log('⚠️  No unlocked clients found');
      }
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

// Run the setup
completeTestClientSetup();