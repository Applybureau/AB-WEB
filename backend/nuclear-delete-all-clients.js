// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');

/**
 * NUCLEAR DELETE ALL CLIENTS
 * 
 * This is the most aggressive deletion script.
 * It will delete EVERYTHING related to clients.
 */

const SUPER_ADMIN_EMAIL = 'applybureau@gmail.com';

async function nuclearDeleteAllClients() {
  console.log('☢️  NUCLEAR DELETE ALL CLIENTS\n');
  console.log('='.repeat(70));
  console.log(`\nPreserving super admin: ${SUPER_ADMIN_EMAIL}\n`);
  console.log('='.repeat(70));
  
  try {
    // Step 1: Get all client IDs and emails
    console.log('\n🔍 Step 1: Finding all clients...\n');
    
    const clientIds = new Set();
    const clientEmails = new Set();
    
    // From registered_users
    const { data: regUsers } = await supabaseAdmin
      .from('registered_users')
      .select('id, email')
      .eq('role', 'client');
    
    if (regUsers) {
      regUsers.forEach(u => {
        clientIds.add(u.id);
        if (u.email) clientEmails.add(u.email);
      });
      console.log(`Found ${regUsers.length} clients in registered_users`);
    }
    
    // From clients table
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('id, email');
    
    if (clients) {
      clients.forEach(c => {
        clientIds.add(c.id);
        if (c.email) clientEmails.add(c.email);
      });
      console.log(`Found ${clients.length} records in clients table`);
    }
    
    console.log(`\nTotal unique IDs: ${clientIds.size}`);
    console.log(`Total unique emails: ${clientEmails.size}`);
    
    if (clientIds.size === 0) {
      console.log('\n✅ No clients found!');
      return;
    }
    
    const idsArray = Array.from(clientIds);
    const emailsArray = Array.from(clientEmails);
    
    // Step 2: Delete using raw SQL for maximum power
    console.log('\n💣 Step 2: Executing SQL deletion...\n');
    
    const sqlScript = `
      -- Disable triggers
      SET session_replication_role = 'replica';
      
      -- Delete dependent records
      DELETE FROM application_logs WHERE client_id = ANY($1::uuid[]);
      DELETE FROM messages WHERE client_id = ANY($1::uuid[]);
      DELETE FROM notifications WHERE client_id = ANY($1::uuid[]);
      DELETE FROM notifications WHERE user_id = ANY($1::uuid[]);
      DELETE FROM applications WHERE client_id = ANY($1::uuid[]);
      DELETE FROM consultations WHERE client_id = ANY($1::uuid[]);
      DELETE FROM consultation_requests WHERE email = ANY($2::text[]);
      DELETE FROM twenty_questions WHERE client_id = ANY($1::uuid[]);
      DELETE FROM strategy_calls WHERE client_id = ANY($1::uuid[]);
      DELETE FROM interviews WHERE client_id = ANY($1::uuid[]);
      DELETE FROM meetings WHERE client_id = ANY($1::uuid[]);
      DELETE FROM client_files WHERE client_id = ANY($1::uuid[]);
      DELETE FROM leads WHERE client_id = ANY($1::uuid[]);
      DELETE FROM contact_requests WHERE email = ANY($2::text[]);
      
      -- Delete from main tables
      DELETE FROM clients;
      DELETE FROM registered_users WHERE role = 'client';
      
      -- Re-enable triggers
      SET session_replication_role = 'origin';
    `;
    
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_raw_sql', {
        query: sqlScript,
        params: [idsArray, emailsArray]
      });
      
      if (error) {
        console.log('⚠️  SQL execution via RPC failed, trying direct deletion...');
        
        // Fallback: Delete one by one
        const tables = [
          'application_logs',
          'messages', 
          'notifications',
          'applications',
          'consultations',
          'twenty_questions',
          'strategy_calls',
          'interviews',
          'meetings',
          'client_files',
          'leads'
        ];
        
        for (const table of tables) {
          try {
            await supabaseAdmin.from(table).delete().in('client_id', idsArray);
            console.log(`  ✅ Deleted from ${table}`);
          } catch (e) {
            console.log(`  ⚠️  ${table}: ${e.message}`);
          }
        }
        
        // Delete consultation_requests by email
        await supabaseAdmin.from('consultation_requests').delete().in('email', emailsArray);
        console.log(`  ✅ Deleted consultation_requests`);
        
        // Delete contact_requests by email
        await supabaseAdmin.from('contact_requests').delete().in('email', emailsArray);
        console.log(`  ✅ Deleted contact_requests`);
        
        // Delete from main tables
        await supabaseAdmin.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log(`  ✅ Deleted from clients`);
        
        await supabaseAdmin.from('registered_users').delete().eq('role', 'client');
        console.log(`  ✅ Deleted from registered_users`);
        
      } else {
        console.log('✅ SQL deletion successful');
      }
    } catch (sqlError) {
      console.log('⚠️  SQL approach failed, using API deletion...');
      
      // Ultimate fallback
      for (const id of idsArray) {
        try {
          await supabaseAdmin.from('registered_users').delete().eq('id', id);
          await supabaseAdmin.from('clients').delete().eq('id', id);
        } catch (e) {
          // Continue
        }
      }
    }
    
    // Step 3: Delete from Auth
    console.log('\n🔐 Step 3: Deleting from Supabase Auth...\n');
    
    let authDeleted = 0;
    for (const id of idsArray) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(id);
        authDeleted++;
        console.log(`  ✅ Deleted auth user ${id}`);
      } catch (e) {
        if (!e.message.includes('not found')) {
          console.log(`  ⚠️  ${id}: ${e.message}`);
        }
      }
    }
    console.log(`\nDeleted ${authDeleted} auth users`);
    
    // Step 4: Verify
    console.log('\n✅ Step 4: Verifying deletion...\n');
    
    const { data: remaining } = await supabaseAdmin
      .from('registered_users')
      .select('id, email')
      .eq('role', 'client');
    
    const { data: remainingClients } = await supabaseAdmin
      .from('clients')
      .select('id, email');
    
    console.log(`Remaining in registered_users: ${remaining?.length || 0}`);
    console.log(`Remaining in clients table: ${remainingClients?.length || 0}`);
    
    if (remaining && remaining.length > 0) {
      console.log('\n⚠️  Some clients still remain:');
      remaining.forEach(r => console.log(`  - ${r.email} (${r.id})`));
    }
    
    if (remainingClients && remainingClients.length > 0) {
      console.log('\n⚠️  Some records still remain in clients table:');
      remainingClients.forEach(c => console.log(`  - ${c.email || 'No email'} (${c.id})`));
    }
    
    if ((!remaining || remaining.length === 0) && (!remainingClients || remainingClients.length === 0)) {
      console.log('\n🎉 ALL CLIENTS SUCCESSFULLY DELETED!');
    }
    
    // Verify super admin
    const { data: superAdmin } = await supabaseAdmin
      .from('admins')
      .select('email')
      .eq('email', SUPER_ADMIN_EMAIL)
      .single();
    
    if (superAdmin) {
      console.log(`\n✅ Super admin preserved: ${superAdmin.email}`);
    } else {
      console.log('\n⚠️  WARNING: Super admin not found!');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Nuclear deletion complete!\n');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    throw error;
  }
}

// Confirmation
async function confirmAndRun() {
  const CONFIRMED = false; // SET TO TRUE TO RUN
  
  if (!CONFIRMED) {
    console.log('\n⚠️  Script not confirmed. Set CONFIRMED = true to run.\n');
    return;
  }
  
  console.log('\n✅ Starting in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await nuclearDeleteAllClients();
}

if (require.main === module) {
  confirmAndRun()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { nuclearDeleteAllClients };
