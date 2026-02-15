require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function syncPasswordToClientsTable() {
  console.log('\n🔄 SYNCING PASSWORD TO CLIENTS TABLE\n');
  console.log('=' .repeat(60));

  try {
    const email = 'israelloko65@gmail.com';

    // Get user from registered_users with password hash
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, passcode_hash, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ User not found in registered_users:', email);
      return;
    }

    console.log('\n📋 USER FROM REGISTERED_USERS:');
    console.log('-'.repeat(60));
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.full_name}`);
    console.log(`Has Password Hash: ${!!user.passcode_hash}`);
    console.log(`Role: ${user.role}`);

    if (!user.passcode_hash) {
      console.error('\n❌ No password hash found. Cannot sync.');
      return;
    }

    // Check if client record exists
    const { data: existingClient, error: clientCheckError } = await supabaseAdmin
      .from('clients')
      .select('id, email, password')
      .eq('email', email)
      .single();

    if (existingClient) {
      console.log('\n📋 EXISTING CLIENT RECORD:');
      console.log('-'.repeat(60));
      console.log(`Email: ${existingClient.email}`);
      console.log(`Has Password: ${!!existingClient.password}`);

      if (existingClient.password) {
        console.log('\n✅ Client record already has password. No sync needed.');
        return;
      }

      // Update existing client record with password
      console.log('\n🔄 Updating client record with password...');
      
      const { data: updatedClient, error: updateError } = await supabaseAdmin
        .from('clients')
        .update({
          password: user.passcode_hash,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating client record:', updateError);
        return;
      }

      console.log('\n✅ CLIENT RECORD UPDATED:');
      console.log('-'.repeat(60));
      console.log(`Email: ${updatedClient.email}`);
      console.log(`Has Password: ${!!updatedClient.password}`);

    } else {
      // Create new client record with password
      console.log('\n🔄 Creating client record with password...');
      
      const { data: newClient, error: insertError } = await supabaseAdmin
        .from('clients')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          password: user.passcode_hash,
          role: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating client record:', insertError);
        return;
      }

      console.log('\n✅ CLIENT RECORD CREATED:');
      console.log('-'.repeat(60));
      console.log(`Email: ${newClient.email}`);
      console.log(`Has Password: ${!!newClient.password}`);
    }

    console.log('\n\n💡 NEXT STEPS:');
    console.log('-'.repeat(60));
    console.log('1. Password is now synced to clients table');
    console.log('2. Login will work from either registered_users or clients table');
    console.log('3. Try logging in with email and password');

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ SYNC COMPLETE\n');

  } catch (error) {
    console.error('\n❌ SYNC ERROR:', error);
  }
}

syncPasswordToClientsTable();
