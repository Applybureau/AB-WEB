require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testActualConfirm() {
  console.log('🧪 Testing Strategy Call Confirmation Endpoint\n');

  try {
    // 1. Generate admin token
    const adminToken = jwt.sign({
      userId: 'test-admin-id',
      email: 'applybureau@gmail.com',
      role: 'admin',
      is_super_admin: true,
      source: 'admins',
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    }, process.env.JWT_SECRET);

    console.log('1️⃣ Generated admin token');

    // 2. Make the actual API call
    const strategyCallId = 'ac87b39e-175a-4716-a34b-f6b12465d25e';
    
    const requestBody = {
      strategy_call_id: strategyCallId,
      selected_slot_index: 0,
      meeting_link: 'https://meet.google.com/test-meeting-link',
      admin_notes: 'Test confirmation from script'
    };

    console.log('\n2️⃣ Making API request...');
    console.log('URL: http://localhost:8080/api/client-actions/confirm-strategy-call');
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('http://localhost:8080/api/client-actions/confirm-strategy-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('\n3️⃣ Response Status:', response.status, response.statusText);

    const data = await response.json();
    console.log('\n4️⃣ Response Body:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS! Strategy call confirmed.');
      console.log('\nConfirmed Details:');
      console.log('  • Date:', data.confirmed_slot?.date);
      console.log('  • Time:', data.confirmed_slot?.time);
      console.log('  • Email sent:', data.email_sent);
    } else {
      console.log('\n❌ FAILED! Error details above.');
      console.log('\n💡 Common issues:');
      console.log('  • Server not running on port 8080');
      console.log('  • Route not registered in server.js');
      console.log('  • Invalid strategy_call_id');
      console.log('  • Database connection issue');
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running! Start it with: npm start');
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure Node.js version supports fetch or install node-fetch');
    }
  }
}

testActualConfirm();
