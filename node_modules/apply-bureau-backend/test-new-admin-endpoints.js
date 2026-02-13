const { supabaseAdmin } = require('./utils/supabase');

/**
 * Test all new admin endpoints
 * Tests: 20Q mark as reviewed, file details, package monitoring, interviews
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function getAdminToken() {
  // Get admin credentials
  const { data: admin, error } = await supabaseAdmin
    .from('registered_users')
    .select('*')
    .eq('role', 'admin')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !admin) {
    throw new Error('No admin user found');
  }

  console.log(`Using admin: ${admin.email}`);
  
  // For testing, we'll use a mock token or you can implement actual login
  return 'test-admin-token';
}

async function getTestClient() {
  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('role', 'client')
    .limit(1)
    .single();

  if (error || !client) {
    throw new Error('No test client found');
  }

  return client;
}

async function test20QMarkAsReviewed(token, clientId) {
  console.log('\n📝 Testing POST /api/admin/clients/:clientId/20q/mark-reviewed');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/20q/mark-reviewed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        admin_notes: 'Test review - responses look good',
        approved: true,
        feedback: 'Great responses, ready to proceed'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 20Q marked as reviewed successfully');
      console.log('   Status:', data.twenty_questions.status);
      console.log('   Approved:', data.twenty_questions.approved);
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function test20QGetResponses(token, clientId) {
  console.log('\n📝 Testing GET /api/admin/clients/:clientId/20q/responses');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/20q/responses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 20Q responses retrieved');
      console.log('   Client:', data.client_name);
      console.log('   Status:', data.twenty_questions?.status || 'Not submitted');
      console.log('   Reviewed:', data.twenty_questions?.reviewed_at ? 'Yes' : 'No');
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testPendingReviews(token) {
  console.log('\n📝 Testing GET /api/admin/20q/pending-review');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/20q/pending-review?page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Pending reviews retrieved');
      console.log('   Total pending:', data.total_count);
      console.log('   Urgent:', data.summary.urgent);
      console.log('   High priority:', data.summary.high_priority);
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testResumeDetails(token, clientId) {
  console.log('\n📄 Testing GET /api/admin/clients/:clientId/files/resume');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/files/resume`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Resume details retrieved');
      console.log('   Filename:', data.resume.filename);
      console.log('   Size:', data.resume.file_size_formatted);
      console.log('   Versions:', data.resume.versions.length);
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testLinkedInDetails(token, clientId) {
  console.log('\n🔗 Testing GET /api/admin/clients/:clientId/files/linkedin');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/files/linkedin`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ LinkedIn details retrieved');
      console.log('   URL:', data.linkedin.url);
      console.log('   Verified:', data.linkedin.verified);
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testPortfolioDetails(token, clientId) {
  console.log('\n💼 Testing GET /api/admin/clients/:clientId/files/portfolio');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/files/portfolio`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Portfolio details retrieved');
      console.log('   Total links:', data.total_count);
      data.portfolio.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title}: ${p.url}`);
      });
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testPackageDetails(token, clientId) {
  console.log('\n📦 Testing GET /api/admin/clients/:clientId/package');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/clients/${clientId}/package`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Package details retrieved');
      console.log('   Package:', data.package_name);
      console.log('   Tier:', data.package_tier);
      console.log('   Days remaining:', data.days_remaining);
      console.log('   Status:', data.status);
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testExpiringPackages(token) {
  console.log('\n📦 Testing GET /api/admin/packages/expiring');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/packages/expiring?days=30`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Expiring packages retrieved');
      console.log('   Total expiring:', data.total_count);
      data.expiring_packages.slice(0, 3).forEach(pkg => {
        console.log(`   • ${pkg.client_name}: ${pkg.days_remaining} days left`);
      });
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testInterviewsList(token) {
  console.log('\n🎤 Testing GET /api/admin/interviews');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/interviews?limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Interviews list retrieved');
      console.log('   Total:', data.total_count);
      console.log('   Scheduled:', data.summary.scheduled);
      console.log('   Completed:', data.summary.completed);
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testCreateInterview(token, clientId) {
  console.log('\n🎤 Testing POST /api/admin/interviews');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/interviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        company: 'Test Company',
        role: 'Software Engineer',
        interview_type: 'technical',
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        interviewer_name: 'John Interviewer',
        meeting_link: 'https://zoom.us/j/test123',
        admin_notes: 'Test interview creation'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Interview created successfully');
      console.log('   ID:', data.interview.id);
      console.log('   Status:', data.interview.status);
      return data.interview.id;
    } else {
      console.log('❌ Failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🧪 Testing New Admin Endpoints\n');
  console.log('='.repeat(50));

  try {
    // Get admin token
    console.log('\n🔑 Getting admin token...');
    const token = await getAdminToken();

    // Get test client
    console.log('👤 Getting test client...');
    const client = await getTestClient();
    console.log(`   Using client: ${client.full_name} (${client.email})`);

    console.log('\n' + '='.repeat(50));
    console.log('20 QUESTIONS ENDPOINTS');
    console.log('='.repeat(50));
    
    await test20QGetResponses(token, client.id);
    await testPendingReviews(token);
    await test20QMarkAsReviewed(token, client.id);

    console.log('\n' + '='.repeat(50));
    console.log('FILE DETAILS ENDPOINTS');
    console.log('='.repeat(50));
    
    await testResumeDetails(token, client.id);
    await testLinkedInDetails(token, client.id);
    await testPortfolioDetails(token, client.id);

    console.log('\n' + '='.repeat(50));
    console.log('PACKAGE MONITORING ENDPOINTS');
    console.log('='.repeat(50));
    
    await testPackageDetails(token, client.id);
    await testExpiringPackages(token);

    console.log('\n' + '='.repeat(50));
    console.log('INTERVIEW COORDINATION ENDPOINTS');
    console.log('='.repeat(50));
    
    await testInterviewsList(token);
    const interviewId = await testCreateInterview(token, client.id);

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests
runAllTests();
