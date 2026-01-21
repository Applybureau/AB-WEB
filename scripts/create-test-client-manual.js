require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function createTestClient() {
  console.log('🎯 CREATING TEST CLIENT MANUALLY');
  console.log('=================================\n');

  try {
    const testEmail = `testclient${Date.now()}@example.com`;
    const testPassword = 'TestClient123!';
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    console.log('Creating test client...');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);

    // Insert into clients table
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        email: testEmail,
        password: hashedPassword,
        full_name: 'Test Client User',
        phone: '+1234567890',
        role: 'client',
        status: 'active',
        onboarding_complete: false,
        profile_unlocked: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating client:', error);
      return;
    }

    console.log('✅ Test client created successfully!');
    console.log(`Client ID: ${client.id}`);
    console.log(`Email: ${client.email}`);
    console.log(`Full Name: ${client.full_name}`);
    console.log(`Role: ${client.role}`);
    console.log(`Status: ${client.status}`);

    console.log('\n🎯 TEST CLIENT CREDENTIALS:');
    console.log('===========================');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`Client ID: ${client.id}`);

    console.log('\n✅ Ready for client dashboard testing!');
    console.log('Use these credentials to test the client dashboard features.');

  } catch (error) {
    console.error('❌ Failed to create test client:', error);
  }
}

createTestClient();