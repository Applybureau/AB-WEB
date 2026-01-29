const { supabaseAdmin } = require('./utils/supabase');

async function debugApplicationEndpoints() {
  console.log('🔍 Debugging Application Endpoints...\n');

  try {
    // Test 1: Check if applications table exists and its structure
    console.log('1. Checking applications table structure:');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'applications')
      .order('ordinal_position');

    if (columnsError) {
      console.log('   ❌ Error checking table structure:', columnsError.message);
    } else if (!columns || columns.length === 0) {
      console.log('   ❌ Applications table does not exist!');
    } else {
      console.log('   ✅ Applications table exists with columns:');
      columns.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Test 2: Check if we can query the applications table
    console.log('\n2. Testing applications table query:');
    const { data: applications, error: queryError } = await supabaseAdmin
      .from('applications')
      .select('id, user_id, client_id, type, title, status, created_at')
      .limit(5);

    if (queryError) {
      console.log('   ❌ Error querying applications:', queryError.message);
      console.log('   Details:', queryError);
    } else {
      console.log(`   ✅ Successfully queried applications table (${applications.length} records)`);
      if (applications.length > 0) {
        console.log('   Sample record:');
        console.log('     ', applications[0]);
      }
    }

    // Test 3: Check auth.users table access
    console.log('\n3. Testing auth.users table access:');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .limit(3);

    if (usersError) {
      console.log('   ❌ Error accessing auth.users:', usersError.message);
    } else {
      console.log(`   ✅ Successfully accessed auth.users (${users.length} records)`);
      users.forEach(user => {
        const role = user.raw_user_meta_data?.role || 'no role';
        console.log(`     - ${user.email}: ${role}`);
      });
    }

    // Test 4: Test application creation with proper schema
    console.log('\n4. Testing application creation:');
    
    // Get a test user ID
    const { data: testUser } = await supabaseAdmin
      .from('auth.users')
      .select('id, email')
      .limit(1)
      .single();

    if (!testUser) {
      console.log('   ⚠️  No users found to test with');
    } else {
      console.log(`   Using test user: ${testUser.email} (${testUser.id})`);
      
      const testApplication = {
        user_id: testUser.id,
        type: 'job_application',
        title: 'Test Company - Test Role',
        description: 'Test application for debugging',
        status: 'applied',
        admin_notes: 'Created by debug script'
      };

      const { data: newApp, error: createError } = await supabaseAdmin
        .from('applications')
        .insert(testApplication)
        .select()
        .single();

      if (createError) {
        console.log('   ❌ Error creating test application:', createError.message);
        console.log('   Details:', createError);
      } else {
        console.log('   ✅ Successfully created test application:', newApp.id);
        
        // Clean up - delete the test application
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('id', newApp.id);
        console.log('   ✅ Cleaned up test application');
      }
    }

    // Test 5: Check RLS policies
    console.log('\n5. Testing Row Level Security policies:');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname, tablename, permissive, roles, cmd, qual')
      .eq('tablename', 'applications');

    if (policiesError) {
      console.log('   ❌ Error checking RLS policies:', policiesError.message);
    } else {
      console.log(`   ✅ Found ${policies.length} RLS policies for applications table:`);
      policies.forEach(policy => {
        console.log(`     - ${policy.policyname} (${policy.cmd})`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }

  console.log('\n🎉 Application Endpoints Debug Complete!\n');
}

// Run the debug
if (require.main === module) {
  debugApplicationEndpoints().catch(console.error);
}

module.exports = debugApplicationEndpoints;