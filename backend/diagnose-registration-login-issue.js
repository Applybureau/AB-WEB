require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

async function diagnoseRegistrationLogin() {
  console.log('\n🔍 DIAGNOSING REGISTRATION & LOGIN ISSUE\n');
  console.log('=' .repeat(60));

  try {
    // Get all recent registered users
    const { data: registeredUsers, error: regError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, passcode_hash, role, is_active, payment_confirmed, token_used, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (regError) {
      console.error('❌ Error fetching registered_users:', regError);
    } else {
      console.log('\n📋 RECENT REGISTERED USERS:');
      console.log('-'.repeat(60));
      registeredUsers.forEach(user => {
        console.log(`\nEmail: ${user.email}`);
        console.log(`Name: ${user.full_name}`);
        console.log(`Has Password Hash: ${!!user.passcode_hash}`);
        console.log(`Password Hash Length: ${user.passcode_hash?.length || 0}`);
        console.log(`Role: ${user.role}`);
        console.log(`Active: ${user.is_active}`);
        console.log(`Payment Confirmed: ${user.payment_confirmed}`);
        console.log(`Token Used: ${user.token_used}`);
        console.log(`Created: ${user.created_at}`);
      });
    }

    // Get all recent clients
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, password, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
    } else {
      console.log('\n\n📋 RECENT CLIENTS:');
      console.log('-'.repeat(60));
      clients.forEach(client => {
        console.log(`\nEmail: ${client.email}`);
        console.log(`Name: ${client.full_name}`);
        console.log(`Has Password: ${!!client.password}`);
        console.log(`Password Length: ${client.password?.length || 0}`);
        console.log(`Role: ${client.role}`);
        console.log(`Created: ${client.created_at}`);
      });
    }

    // Test password comparison with a sample
    console.log('\n\n🔐 PASSWORD HASH TEST:');
    console.log('-'.repeat(60));
    
    const testPassword = 'TestPassword123!';
    const testHash = await bcrypt.hash(testPassword, 12);
    console.log(`\nTest Password: ${testPassword}`);
    console.log(`Generated Hash: ${testHash}`);
    console.log(`Hash Length: ${testHash.length}`);
    
    const isValid = await bcrypt.compare(testPassword, testHash);
    console.log(`Comparison Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    // Check if there are any users with matching emails in both tables
    console.log('\n\n🔄 CHECKING FOR DUPLICATE EMAILS:');
    console.log('-'.repeat(60));
    
    if (registeredUsers && clients) {
      const regEmails = new Set(registeredUsers.map(u => u.email));
      const clientEmails = new Set(clients.map(c => c.email));
      
      const duplicates = [...regEmails].filter(email => clientEmails.has(email));
      
      if (duplicates.length > 0) {
        console.log('\n⚠️  Found users in BOTH tables:');
        duplicates.forEach(email => {
          const regUser = registeredUsers.find(u => u.email === email);
          const client = clients.find(c => c.email === email);
          
          console.log(`\n  Email: ${email}`);
          console.log(`  registered_users has password: ${!!regUser.passcode_hash}`);
          console.log(`  clients has password: ${!!client.password}`);
        });
      } else {
        console.log('\n✅ No duplicate emails found');
      }
    }

    // Provide recommendations
    console.log('\n\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(60));
    console.log('\n1. Registration should save password to registered_users.passcode_hash');
    console.log('2. Login should check registered_users table and use passcode_hash');
    console.log('3. The clients table record is optional (for foreign keys only)');
    console.log('\n4. To test login:');
    console.log('   - Use an email from registered_users table');
    console.log('   - Ensure passcode_hash is not null');
    console.log('   - Ensure is_active = true');
    console.log('   - Ensure payment_confirmed = true');
    console.log('   - Ensure token_used = true (registration completed)');

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ DIAGNOSIS COMPLETE\n');

  } catch (error) {
    console.error('\n❌ DIAGNOSIS ERROR:', error);
  }
}

diagnoseRegistrationLogin();
