require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function testStrategyCallConfirm() {
  console.log('🔍 Testing Strategy Call Confirmation Setup\n');

  try {
    // 1. Check if strategy_calls table exists and has data
    console.log('1️⃣ Checking strategy_calls table...');
    const { data: strategyCalls, error: tableError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .limit(5);

    if (tableError) {
      console.error('❌ Error accessing strategy_calls table:', tableError);
      console.log('\n💡 The strategy_calls table might not exist. Check your database schema.');
      return;
    }

    if (!strategyCalls || strategyCalls.length === 0) {
      console.log('⚠️  No strategy calls found in database');
      console.log('\n💡 You need to create a strategy call first. Use the client booking endpoint:');
      console.log('   POST /api/strategy-calls');
      console.log('   Body: {');
      console.log('     "preferred_slots": [');
      console.log('       { "date": "2024-01-20", "time": "14:00" },');
      console.log('       { "date": "2024-01-21", "time": "15:00" },');
      console.log('       { "date": "2024-01-22", "time": "16:00" }');
      console.log('     ],');
      console.log('     "message": "Test booking"');
      console.log('   }');
      return;
    }

    console.log(`✅ Found ${strategyCalls.length} strategy call(s)`);
    console.log('\n📋 Strategy Calls:');
    strategyCalls.forEach((call, index) => {
      console.log(`\n   ${index + 1}. ID: ${call.id}`);
      console.log(`      Client: ${call.client_name} (${call.client_email})`);
      console.log(`      Status: ${call.status} / Admin Status: ${call.admin_status}`);
      console.log(`      Preferred Slots:`, JSON.stringify(call.preferred_slots, null, 2));
      console.log(`      Created: ${call.created_at}`);
    });

    // 2. Find a pending strategy call to test with
    const pendingCall = strategyCalls.find(call => call.admin_status === 'pending');
    
    if (!pendingCall) {
      console.log('\n⚠️  No pending strategy calls found');
      console.log('💡 All calls have been processed. Create a new one to test confirmation.');
      return;
    }

    console.log('\n\n2️⃣ Found pending strategy call to test:');
    console.log(`   ID: ${pendingCall.id}`);
    console.log(`   Client: ${pendingCall.client_name}`);
    console.log(`   Email: ${pendingCall.client_email}`);
    console.log(`   Preferred Slots:`, JSON.stringify(pendingCall.preferred_slots, null, 2));

    // 3. Show the exact request format
    console.log('\n\n3️⃣ To confirm this strategy call, use this exact request:\n');
    console.log('Endpoint: POST /api/client-actions/confirm-strategy-call');
    console.log('Headers: {');
    console.log('  "Content-Type": "application/json",');
    console.log('  "Authorization": "Bearer YOUR_ADMIN_TOKEN"');
    console.log('}');
    console.log('Body:');
    console.log(JSON.stringify({
      strategy_call_id: pendingCall.id,
      selected_slot_index: 0,
      meeting_link: "https://meet.google.com/abc-defg-hij",
      admin_notes: "Looking forward to the call"
    }, null, 2));

    console.log('\n\n4️⃣ cURL command:');
    console.log(`curl -X POST http://localhost:8080/api/client-actions/confirm-strategy-call \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\
  -d '{
    "strategy_call_id": "${pendingCall.id}",
    "selected_slot_index": 0,
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "admin_notes": "Looking forward to the call"
  }'`);

    // 4. Check if admin exists
    console.log('\n\n5️⃣ Checking for admin users...');
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email, full_name')
      .limit(3);

    if (adminError) {
      console.log('⚠️  Could not check admins table:', adminError.message);
    } else if (admins && admins.length > 0) {
      console.log(`✅ Found ${admins.length} admin(s):`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.full_name} (${admin.email})`);
      });
    } else {
      console.log('⚠️  No admins found. You need an admin account to confirm strategy calls.');
    }

    // 5. Check server logs location
    console.log('\n\n6️⃣ Debugging tips:');
    console.log('   • Make sure your backend server is running');
    console.log('   • Check server logs for errors');
    console.log('   • Verify your admin JWT token is valid');
    console.log('   • Ensure the route is registered in server.js');
    console.log('   • Check CORS settings if calling from frontend');

    console.log('\n\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStrategyCallConfirm();
