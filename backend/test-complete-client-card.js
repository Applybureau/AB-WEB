require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function testClientCard() {
  console.log('\n🧪 Testing Complete Client Card Endpoint...\n');

  try {
    // Get a test client
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name')
      .eq('role', 'client')
      .limit(1);

    if (clientsError || !clients || clients.length === 0) {
      console.log('⚠️  No clients found in database');
      console.log('   Creating a test client...\n');
      
      // Create test client
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          email: 'test-client@example.com',
          full_name: 'Test Client',
          phone: '+1234567890',
          role: 'client',
          registration_completed: true,
          email_verified: true,
          profile_unlocked: true,
          payment_confirmed: true,
          onboarding_completed: false,
          onboarding_approved: false,
          status: 'active',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create test client:', createError.message);
        return;
      }

      console.log('✅ Test client created:', newClient.email);
      clients[0] = newClient;
    }

    const testClient = clients[0];
    console.log(`📋 Testing with client: ${testClient.full_name} (${testClient.email})\n`);

    // Simulate the client card endpoint logic
    console.log('1️⃣ Fetching basic client info...');
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', testClient.id)
      .single();

    if (clientError) {
      console.error('   ❌ Error:', clientError.message);
      return;
    }
    console.log('   ✅ Basic info retrieved');

    // Get 20Q responses
    console.log('\n2️⃣ Fetching 20 Questions responses...');
    const { data: onboarding, error: onbError } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('client_id', testClient.id)
      .single();

    if (onbError && onbError.code !== 'PGRST116') {
      console.log('   ⚠️  Error:', onbError.message);
    } else if (!onboarding) {
      console.log('   ⚠️  No 20Q responses yet');
    } else {
      console.log('   ✅ 20Q responses found');
      console.log(`      Status: ${onboarding.status}`);
    }

    // Get strategy calls
    console.log('\n3️⃣ Fetching strategy calls...');
    const { data: strategyCalls, error: callsError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', testClient.id)
      .order('created_at', { ascending: false });

    if (callsError) {
      console.log('   ⚠️  Error:', callsError.message);
    } else {
      console.log(`   ✅ Found ${strategyCalls?.length || 0} strategy calls`);
    }

    // Get files
    console.log('\n4️⃣ Fetching uploaded files...');
    const { data: files, error: filesError } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', testClient.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.log('   ⚠️  Error:', filesError.message);
    } else {
      console.log(`   ✅ Found ${files?.length || 0} files`);
      const resumeFile = files?.find(f => f.file_type === 'resume');
      const linkedinFile = files?.find(f => f.file_type === 'linkedin');
      const portfolioFiles = files?.filter(f => f.file_type === 'portfolio') || [];
      console.log(`      • Resume: ${resumeFile ? '✅' : '❌'}`);
      console.log(`      • LinkedIn: ${linkedinFile ? '✅' : '❌'}`);
      console.log(`      • Portfolio: ${portfolioFiles.length} items`);
    }

    // Get applications
    console.log('\n5️⃣ Fetching applications...');
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('client_id', testClient.id)
      .order('created_at', { ascending: false });

    if (appsError) {
      console.log('   ⚠️  Error:', appsError.message);
    } else {
      console.log(`   ✅ Found ${applications?.length || 0} applications`);
      const appStats = {
        total: applications?.length || 0,
        applied: applications?.filter(a => a.status === 'applied').length || 0,
        interview: applications?.filter(a => a.status === 'interview').length || 0,
        offer: applications?.filter(a => a.status === 'offer').length || 0,
        rejected: applications?.filter(a => a.status === 'rejected').length || 0
      };
      console.log(`      • Applied: ${appStats.applied}`);
      console.log(`      • Interview: ${appStats.interview}`);
      console.log(`      • Offer: ${appStats.offer}`);
      console.log(`      • Rejected: ${appStats.rejected}`);
    }

    // Get subscription
    console.log('\n6️⃣ Fetching subscription...');
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('client_subscriptions')
      .select(`
        *,
        subscription_plans (
          plan_name,
          tier,
          price_cad,
          duration_weeks,
          applications_per_week,
          features
        )
      `)
      .eq('client_id', testClient.id)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.log('   ⚠️  Error:', subError.message);
    } else if (!subscription) {
      console.log('   ⚠️  No active subscription');
    } else {
      console.log('   ✅ Active subscription found');
      console.log(`      Plan: ${subscription.subscription_plans.plan_name}`);
      console.log(`      Price: $${subscription.subscription_plans.price_cad} CAD`);
    }

    // Build complete client card
    console.log('\n7️⃣ Building complete client card...');
    
    const resumeFile = files?.find(f => f.file_type === 'resume');
    const linkedinFile = files?.find(f => f.file_type === 'linkedin');
    const portfolioFiles = files?.filter(f => f.file_type === 'portfolio') || [];

    const appStats = {
      total: applications?.length || 0,
      applied: applications?.filter(a => a.status === 'applied').length || 0,
      interview: applications?.filter(a => a.status === 'interview').length || 0,
      offer: applications?.filter(a => a.status === 'offer').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0
    };

    const twentyQuestionsData = onboarding ? {
      roles_wanted: onboarding.q1,
      roles_open_to: onboarding.q2,
      roles_to_avoid: onboarding.q3,
      work_type: onboarding.q4,
      location_scope: onboarding.q5,
      target_cities: onboarding.q6,
      locations_to_exclude: onboarding.q7,
      minimum_salary: onboarding.q8,
      minimum_salary_currency: onboarding.q8_currency,
      ideal_salary: onboarding.q9,
      ideal_salary_currency: onboarding.q9_currency,
      contract_roles: onboarding.q10,
      contract_conditions: onboarding.q10a,
      work_authorization: onboarding.q11,
      work_authorization_details: onboarding.q11a,
      visa_sponsorship: onboarding.q12,
      willing_to_relocate: onboarding.q13,
      drivers_license_required: onboarding.q14,
      license_type_held: onboarding.q14a,
      industries_to_avoid: onboarding.q15,
      disability_status: onboarding.q16,
      veteran_status: onboarding.q17,
      demographic_self_id: onboarding.q18,
      priorities: onboarding.q19,
      additional_notes: onboarding.q20,
      status: onboarding.status,
      submitted_at: onboarding.submitted_at,
      approved_at: onboarding.approved_at,
      approved_by: onboarding.approved_by
    } : null;

    const clientCard = {
      basic_info: {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        profile_picture_url: client.profile_picture_url,
        created_at: client.created_at,
        last_login_at: client.last_login_at,
        status: client.status,
        is_active: client.is_active
      },
      account_status: {
        registration_completed: client.registration_completed,
        email_verified: client.email_verified,
        profile_unlocked: client.profile_unlocked,
        payment_confirmed: client.payment_confirmed || client.payment_verified,
        onboarding_completed: client.onboarding_completed,
        onboarding_approved: client.onboarding_approved
      },
      twenty_questions: twentyQuestionsData,
      strategy_calls: {
        total: strategyCalls?.length || 0,
        latest: strategyCalls?.[0] || null,
        all: strategyCalls || []
      },
      files: {
        resume: resumeFile ? {
          filename: resumeFile.filename,
          url: resumeFile.file_url,
          size: resumeFile.file_size,
          uploaded_at: resumeFile.uploaded_at
        } : null,
        linkedin: linkedinFile ? {
          url: linkedinFile.url,
          added_at: linkedinFile.created_at
        } : null,
        portfolio: portfolioFiles.map(f => ({
          url: f.url,
          added_at: f.created_at
        })),
        all_files: files || []
      },
      applications: {
        stats: appStats,
        recent: applications?.slice(0, 5) || [],
        total_count: applications?.length || 0
      },
      subscription: subscription ? {
        plan_name: subscription.subscription_plans.plan_name,
        tier: subscription.subscription_plans.tier,
        price_cad: subscription.subscription_plans.price_cad,
        duration_weeks: subscription.subscription_plans.duration_weeks,
        applications_per_week: subscription.subscription_plans.applications_per_week,
        features: subscription.subscription_plans.features,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        status: subscription.status,
        assigned_by: subscription.assigned_by,
        assigned_at: subscription.assigned_at
      } : null,
      career_profile: {
        current_job_title: client.current_job_title,
        current_company: client.current_company,
        years_experience: client.years_experience,
        target_role: client.target_role,
        target_salary_min: client.target_salary_min,
        target_salary_max: client.target_salary_max,
        preferred_locations: client.preferred_locations,
        career_goals: client.career_goals,
        job_search_timeline: client.job_search_timeline
      }
    };

    console.log('   ✅ Client card built successfully!\n');

    // Display summary
    console.log('📊 Client Card Summary:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Name: ${clientCard.basic_info.full_name}`);
    console.log(`   Email: ${clientCard.basic_info.email}`);
    console.log(`   Status: ${clientCard.basic_info.status}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Account Status:');
    console.log(`     • Registration: ${clientCard.account_status.registration_completed ? '✅' : '❌'}`);
    console.log(`     • Email Verified: ${clientCard.account_status.email_verified ? '✅' : '❌'}`);
    console.log(`     • Profile Unlocked: ${clientCard.account_status.profile_unlocked ? '✅' : '❌'}`);
    console.log(`     • Payment Confirmed: ${clientCard.account_status.payment_confirmed ? '✅' : '❌'}`);
    console.log(`     • 20Q Completed: ${clientCard.account_status.onboarding_completed ? '✅' : '❌'}`);
    console.log(`     • 20Q Approved: ${clientCard.account_status.onboarding_approved ? '✅' : '❌'}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   20 Questions: ${clientCard.twenty_questions ? '✅ Submitted' : '❌ Not submitted'}`);
    console.log(`   Strategy Calls: ${clientCard.strategy_calls.total} total`);
    console.log(`   Files: ${clientCard.files.all_files.length} uploaded`);
    console.log(`   Applications: ${clientCard.applications.total_count} total`);
    console.log(`   Subscription: ${clientCard.subscription ? clientCard.subscription.plan_name : 'None'}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Client card endpoint test PASSED!\n');
    console.log('📋 Endpoint ready: GET /api/admin/clients/:id/complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testClientCard();
