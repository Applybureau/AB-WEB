const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

async function testAdminManagementEndpoints() {
  console.log('👥 Testing Admin Management Endpoints');
  console.log('====================================');

  try {
    // Login as admin
    console.log('1. Admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'applybureau@gmail.com',
      password: 'Admin123@#'
    });

    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Admin login successful');

    console.log('\n📋 ADMIN MANAGEMENT ENDPOINTS:');
    console.log('===============================');

    // 1. GET /api/admin-management - List all admins (root endpoint)
    console.log('\n1️⃣ GET ALL ADMINS (Root Endpoint)');
    console.log('   Endpoint: GET /api/admin-management');
    console.log('   Purpose: Load all admins for admin management page');
    try {
      const adminsResponse = await axios.get(`${BASE_URL}/api/admin-management`, { headers });
      console.log('   ✅ Working');
      console.log(`   📊 Found ${adminsResponse.data.admins?.length || 0} admins`);
      console.log(`   📧 Super Admin: ${adminsResponse.data.super_admin_email}`);
      
      if (adminsResponse.data.admins?.length > 0) {
        const admin = adminsResponse.data.admins[0];
        console.log(`   👤 Sample Admin: ${admin.full_name} (${admin.email})`);
        console.log(`   🔑 Is Super Admin: ${admin.is_super_admin}`);
        console.log(`   📅 Created: ${admin.created_at}`);
        console.log(`   🟢 Active: ${admin.is_active !== false}`);
      }
    } catch (error) {
      console.log('   ❌ Failed:', error.response?.data?.error || error.message);
    }

    // 2. GET /api/admin-management/admins - List all admins (alternative endpoint)
    console.log('\n2️⃣ GET ALL ADMINS (Alternative Endpoint)');
    console.log('   Endpoint: GET /api/admin-management/admins');
    console.log('   Purpose: Alternative endpoint to load all admins');
    try {
      const adminsAltResponse = await axios.get(`${BASE_URL}/api/admin-management/admins`, { headers });
      console.log('   ✅ Working');
      console.log(`   📊 Found ${adminsAltResponse.data.admins?.length || 0} admins`);
    } catch (error) {
      console.log('   ❌ Failed:', error.response?.data?.error || error.message);
    }

    // 3. GET /api/admin-management/profile - Get current admin profile
    console.log('\n3️⃣ GET CURRENT ADMIN PROFILE');
    console.log('   Endpoint: GET /api/admin-management/profile');
    console.log('   Purpose: Get current admin profile with permissions');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/admin-management/profile`, { headers });
      console.log('   ✅ Working');
      console.log(`   👤 Admin: ${profileResponse.data.admin?.full_name}`);
      console.log(`   📧 Email: ${profileResponse.data.admin?.email}`);
      console.log(`   🔑 Super Admin: ${profileResponse.data.admin?.is_super_admin}`);
      console.log(`   🛡️ Permissions: ${Object.keys(profileResponse.data.admin?.permissions || {}).length} permissions`);
    } catch (error) {
      console.log('   ❌ Failed:', error.response?.data?.error || error.message);
    }

    // 4. GET /api/admin-management/settings - Get admin settings
    console.log('\n4️⃣ GET ADMIN SETTINGS');
    console.log('   Endpoint: GET /api/admin-management/settings');
    console.log('   Purpose: Get system settings (super admin only)');
    try {
      const settingsResponse = await axios.get(`${BASE_URL}/api/admin-management/settings`, { headers });
      console.log('   ✅ Working');
      console.log(`   ⚙️ System Status: ${settingsResponse.data.settings?.system_status}`);
      console.log(`   📧 Email Notifications: ${settingsResponse.data.settings?.email_notifications_enabled}`);
    } catch (error) {
      console.log('   ❌ Failed:', error.response?.data?.error || error.message);
    }

    console.log('\n🔧 ADMIN MANAGEMENT ACTIONS:');
    console.log('=============================');

    // 5. POST /api/admin-management/admins - Create new admin
    console.log('\n5️⃣ CREATE NEW ADMIN');
    console.log('   Endpoint: POST /api/admin-management/admins');
    console.log('   Purpose: Create a new admin account (super admin only)');
    console.log('   Required Data:');
    console.log('   - full_name: Admin full name');
    console.log('   - email: Admin email address');
    console.log('   - password: Admin password');
    console.log('   - phone: Admin phone number (optional)');
    console.log('   - profile_picture: Profile picture file (optional)');

    // 6. PUT /api/admin-management/admins/:id/suspend - Suspend admin
    console.log('\n6️⃣ SUSPEND ADMIN ACCOUNT');
    console.log('   Endpoint: PUT /api/admin-management/admins/:id/suspend');
    console.log('   Purpose: Suspend an admin account (super admin only)');
    console.log('   Required Data:');
    console.log('   - reason: Reason for suspension');

    // 7. PUT /api/admin-management/admins/:id/reactivate - Reactivate admin
    console.log('\n7️⃣ REACTIVATE ADMIN ACCOUNT');
    console.log('   Endpoint: PUT /api/admin-management/admins/:id/reactivate');
    console.log('   Purpose: Reactivate a suspended admin account (super admin only)');

    // 8. DELETE /api/admin-management/admins/:id - Delete admin
    console.log('\n8️⃣ DELETE ADMIN ACCOUNT');
    console.log('   Endpoint: DELETE /api/admin-management/admins/:id');
    console.log('   Purpose: Delete an admin account (super admin only)');
    console.log('   Required Data:');
    console.log('   - reason: Reason for deletion');

    // 9. POST /api/admin-management/reset-password - Reset admin password
    console.log('\n9️⃣ RESET ADMIN PASSWORD');
    console.log('   Endpoint: POST /api/admin-management/reset-password');
    console.log('   Purpose: Reset another admin\'s password (super admin only)');
    console.log('   Required Data:');
    console.log('   - admin_email: Email of admin to reset');
    console.log('   - new_password: New password');
    console.log('   - send_email: Whether to send email notification (optional)');

    // 10. POST /api/admin-management/change-password - Change own password
    console.log('\n🔟 CHANGE OWN PASSWORD');
    console.log('   Endpoint: POST /api/admin-management/change-password');
    console.log('   Purpose: Change current admin\'s own password');
    console.log('   Required Data:');
    console.log('   - current_password: Current password');
    console.log('   - new_password: New password');

    console.log('\n🎯 FRONTEND INTEGRATION GUIDE:');
    console.log('===============================');
    console.log('For your Admin Management page, use these endpoints:');
    console.log('');
    console.log('1. Load Admin List:');
    console.log('   GET /api/admin-management');
    console.log('   or');
    console.log('   GET /api/admin-management/admins');
    console.log('');
    console.log('2. Get Current Admin Info:');
    console.log('   GET /api/admin-management/profile');
    console.log('');
    console.log('3. Admin Actions (Super Admin Only):');
    console.log('   - Create: POST /api/admin-management/admins');
    console.log('   - Suspend: PUT /api/admin-management/admins/:id/suspend');
    console.log('   - Reactivate: PUT /api/admin-management/admins/:id/reactivate');
    console.log('   - Delete: DELETE /api/admin-management/admins/:id');
    console.log('   - Reset Password: POST /api/admin-management/reset-password');

    console.log('\n📊 RESPONSE FORMAT EXAMPLE:');
    console.log('============================');
    console.log('GET /api/admin-management returns:');
    console.log('{');
    console.log('  "admins": [');
    console.log('    {');
    console.log('      "id": "admin-uuid",');
    console.log('      "full_name": "Admin Name",');
    console.log('      "email": "admin@example.com",');
    console.log('      "role": "admin",');
    console.log('      "is_active": true,');
    console.log('      "is_super_admin": false,');
    console.log('      "can_be_modified": true,');
    console.log('      "created_at": "2026-01-26T...",');
    console.log('      "last_login_at": "2026-01-26T...",');
    console.log('      "profile_picture_url": "...",');
    console.log('      "phone": "+1234567890",');
    console.log('      "source": "admins_table"');
    console.log('    }');
    console.log('  ],');
    console.log('  "total": 5,');
    console.log('  "super_admin_email": "applybureau@gmail.com"');
    console.log('}');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

// Run the test
testAdminManagementEndpoints().then(() => {
  console.log('\n🏁 Admin management endpoints test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error.message);
});