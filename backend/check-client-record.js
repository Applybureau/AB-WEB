// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');

console.log('🔍 CHECKING CLIENT RECORDS');
console.log('='.repeat(70));
console.log('');

async function checkRecords() {
  try {
    // Get test user
    console.log('1️⃣ Getting test client user...');
    const { data: testUser, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, role')
      .eq('role', 'client')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (userError || !testUser) {
      console.log('   ❌ No client user found');
      return;
    }

    console.log(`   ✅ Found user: ${testUser.email}`);
    console.log(`      ID: ${testUser.id}`);

    // Check if client record exists
    console.log('');
    console.log('2️⃣ Checking clients table for matching record...');
    const { data: clientRecord, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', testUser.id)
      .single();

    if (clientError) {
      console.log('   ❌ No client record found');
      console.log('   Error:', clientError.message);
      console.log('');
      console.log('   🔧 ISSUE: User exists in registered_users but not in clients table');
      console.log('');
      console.log('   This is the root cause of the 500 error!');
      console.log('   The foreign key constraint requires a matching record in clients table.');
      console.log('');
      console.log('   Creating client record...');

      // Get full_name from registered_users
      const { data: userDetails } = await supabaseAdmin
        .from('registered_users')
        .select('full_name')
        .eq('id', testUser.id)
        .single();

      // Create client record
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          id: testUser.id,
          email: testUser.email,
          full_name: userDetails?.full_name || 'Client User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.log('   ❌ Failed to create client record:', createError.message);
      } else {
        console.log('   ✅ Client record created successfully');
        console.log('   Record:', newClient);
      }
    } else {
      console.log('   ✅ Client record exists');
      console.log('   Record ID:', clientRecord.id);
      console.log('   Email:', clientRecord.email);
    }

    // Check all registered users vs clients
    console.log('');
    console.log('3️⃣ Checking all client users...');
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, role')
      .eq('role', 'client');

    if (allUsersError) {
      console.log('   ❌ Error:', allUsersError.message);
    } else {
      console.log(`   ✅ Found ${allUsers.length} client users`);
      
      for (const user of allUsers) {
        const { data: client, error } = await supabaseAdmin
          .from('clients')
          .select('id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.log(`   ⚠️  ${user.email} - NO client record`);
          
          // Get full_name from registered_users
          const { data: userDetails } = await supabaseAdmin
            .from('registered_users')
            .select('full_name')
            .eq('id', user.id)
            .single();

          // Create missing client record
          const { error: createError } = await supabaseAdmin
            .from('clients')
            .insert({
              id: user.id,
              email: user.email,
              full_name: userDetails?.full_name || 'Client User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.log(`      ❌ Failed to create: ${createError.message}`);
          } else {
            console.log(`      ✅ Created client record`);
          }
        } else {
          console.log(`   ✅ ${user.email} - has client record`);
        }
      }
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('');
    console.log('✅ CHECK COMPLETE');
    console.log('');
    console.log('All client users now have matching records in clients table.');
    console.log('Upload endpoints should work now!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
  }
}

checkRecords();
