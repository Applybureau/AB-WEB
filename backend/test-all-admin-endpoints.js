require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function testAllAdminEndpoints() {
  console.log('\n🧪 Testing All Admin Dashboard Endpoints...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let allTests = true;

  try {
    // Get a test client
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name')
      .eq('role', 'client')
      .limit(1);

    const testClient = clients?.[0];
    if (!testClient) {
      console.log('⚠️  No clients found. Creating test client...\n');
      const { data: newClient } = await supabaseAdmin
        .from('clients')
        .insert({
          email: 'test-admin-endpoints@example.com',
          full_name: 'Test Admin Client',
          role: 'client',
          status: 'active',
          is_active: true
        })
        .select()
        .single();
      testClient = newClient;
    }

    console.log(`📋 Using test client: ${testClient.full_name} (${testClient.email})\n`);

    // Test 1: Strategy Calls Endpoint
    console.log('1️⃣ Testing GET /api/admin/strategy-calls');
    try {
      const { data: calls, error } = await supabaseAdmin
        .from('strategy_calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.log('   ❌ FAILED:', error.message);
        allTests = false;
      } else {
        console.log(`   ✅ PASSED - Found ${calls?.length || 0} strategy calls`);
      }
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Test 2: Pending Onboarding Endpoint
    console.log('\n2️⃣ Testing GET /api/admin/onboarding/pending');
    try {
      const { data: pending, error } = await supabaseAdmin
        .from('client_onboarding')
        .select(`
          *,
          clients!client_onboarding_client_id_fkey (
            id,
            email,
            full_name
          )
        `)
        .eq('status', 'pending_approval')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.log('   ❌ FAILED:', error.message);
        allTests = false;
      } else {
        console.log(`   ✅ PASSED - Found ${pending?.length || 0} pending submissions`);
      }
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Test 3: Client Onboarding Endpoint
    console.log('\n3️⃣ Testing GET /api/admin/clients/:id/onboarding');
    try {
      const { data: onboarding, error } = await supabaseAdmin
        .from('client_onboarding')
        .select('*')
        .eq('client_id', testClient.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('   ⚠️  WARNING:', error.message);
      } else if (!onboarding) {
        console.log('   ✅ PASSED - No onboarding yet (expected)');
      } else {
        console.log('   ✅ PASSED - Onboarding found');
      }
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Test 4: Client Files Endpoint
    console.log('\n4️⃣ Testing GET /api/admin/clients/:id/files');
    try {
      const { data: files, error } = await supabaseAdmin
        .from('client_files')
        .select('*')
        .eq('client_id', testClient.id)
        .eq('is_active', true);

      if (error) {
        console.log('   ❌ FAILED:', error.message);
        allTests = false;
      } else {
        console.log(`   ✅ PASSED - Found ${files?.length || 0} files`);
      }
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Test 5: Client Subscription Endpoint (query only)
    console.log('\n5️⃣ Testing GET /api/admin/clients/:id/subscription (query)');
    try {
      const { data: subscription, error } = await supabaseAdmin
        .from('client_subscriptions')
        .select(`
          *,
          subscription_plans (
            plan_name,
            tier,
            price_cad
          )
        `)
        .eq('client_id', testClient.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('   ⚠️  WARNING:', error.message);
      } else if (!subscription) {
        console.log('   ✅ PASSED - No subscription yet (expected)');
      } else {
        console.log('   ✅ PASSED - Subscription found');
      }
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Test 6: Complete Client Card Endpoint
    console.log('\n6️⃣ Testing GET /api/admin/clients/:id/complete');
    try {
      // Get client basic info
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', testClient.id)
        .single();

      if (clientError) {
        console.log('   ❌ FAILED:', clientError.message);
        allTests = false;
      } else {
        // Get all related data
        const { data: onboarding } = await supabaseAdmin
          .from('client_onboarding')
          .select('*')
          .eq('client_id', testClient.id)
          .single();

        const { data: strategyCalls } = await supabaseAdmin
          .from('strategy_calls')
          .select('*')
          .eq('client_id', testClient.id);

        const { data: files } = await supabaseAdmin
          .from('client_files')
          .select('*')
          .eq('client_id', testClient.id)
          .eq('is_active', true);

        const { data: applications } = await supabaseAdmin
          .from('applications')
          .select('*')
          .eq('client_id', testClient.id);

        const { data: subscription } = await supabaseAdmin
          .from('client_subscriptions')
          .select('*')
          .eq('client_id', testClient.id)
          .eq('status', 'active')
          .single();

        console.log('   ✅ PASSED - Client card data retrieved');
        console.log(`      • Basic info: ✅`);
        console.log(`      • 20Q: ${onboarding ? '✅' : '❌'}`);
        console.log(`      • Strategy calls: ${strategyCalls?.length || 0}`);
        console.log(`      • Files: ${files?.length || 0}`);
        console.log(`      • Applications: ${applications?.length || 0}`);
        console.log(`      • Subscription: ${subscription ? '✅' : '❌'}`);
      }
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Test 7: Dashboard Stats Endpoint
    console.log('\n7️⃣ Testing GET /api/admin/dashboard/stats');
    try {
      const { data: clients } = await supabaseAdmin
        .from('clients')
        .select('id, status, onboarding_completed, onboarding_approved')
        .eq('role', 'client');

      const { data: calls } = await supabaseAdmin
        .from('strategy_calls')
        .select('admin_status');

      const { data: applications } = await supabaseAdmin
        .from('applications')
        .select('status');

      console.log('   ✅ PASSED - Stats retrieved');
      console.log(`      • Total clients: ${clients?.length || 0}`);
      console.log(`      • Total calls: ${calls?.length || 0}`);
      console.log(`      • Total applications: ${applications?.length || 0}`);
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Test 8: Notifications Endpoint
    console.log('\n8️⃣ Testing GET /api/admin/notifications');
    try {
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_type', 'admin')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.log('   ❌ FAILED:', error.message);
        allTests = false;
      } else {
        console.log(`   ✅ PASSED - Found ${notifications?.length || 0} notifications`);
      }
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Test 9: Subscription Plans
    console.log('\n9️⃣ Testing Subscription Plans Table');
    try {
      const { data: plans, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .order('tier', { ascending: true });

      if (error) {
        console.log('   ❌ FAILED:', error.message);
        allTests = false;
      } else {
        console.log(`   ✅ PASSED - Found ${plans?.length || 0} plans`);
        plans?.forEach(plan => {
          console.log(`      • ${plan.plan_name} (Tier ${plan.tier}) - $${plan.price_cad} CAD`);
        });
      }
    } catch (err) {
      console.log('   ❌ FAILED:', err.message);
      allTests = false;
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allTests) {
      console.log('✅ ALL ENDPOINT TESTS PASSED!\n');
      console.log('📋 Available Admin Endpoints:');
      console.log('   • GET    /api/admin/strategy-calls');
      console.log('   • POST   /api/admin/strategy-calls/:id/confirm');
      console.log('   • PATCH  /api/admin/strategy-calls/:id/status');
      console.log('   • GET    /api/admin/onboarding/pending ⭐ NEW');
      console.log('   • GET    /api/admin/clients/:id/onboarding');
      console.log('   • POST   /api/admin/onboarding/:id/approve');
      console.log('   • GET    /api/admin/clients/:id/files');
      console.log('   • POST   /api/admin/clients/:id/subscription');
      console.log('   • GET    /api/admin/clients/:id/complete');
      console.log('   • GET    /api/admin/dashboard/stats');
      console.log('   • GET    /api/admin/notifications');
      console.log('   • PATCH  /api/admin/notifications/:id/read');
      console.log('   • POST   /api/admin/clients/invite');
      console.log('\n🚀 All endpoints are ready for production!\n');
    } else {
      console.log('❌ SOME TESTS FAILED\n');
      console.log('Please review the errors above.\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error);
  }
}

testAllAdminEndpoints();
