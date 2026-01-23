require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

// Admin account details
const ADMIN_ACCOUNT = {
  email: 'admin@applybureautest.com',
  password: 'AdminTest123!',
  full_name: 'Apply Bureau Admin'
};

class DirectAdminCreation {
  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async createAdminDirectly() {
    this.log('🔧 Creating admin account directly in database...');
    
    try {
      // Check if admin already exists
      const { data: existingAdmin, error: checkError } = await supabaseAdmin
        .from('admins')
        .select('id, email')
        .eq('email', ADMIN_ACCOUNT.email)
        .single();

      if (existingAdmin) {
        this.log('ℹ️  Admin already exists', { admin_id: existingAdmin.id });
        return existingAdmin;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(ADMIN_ACCOUNT.password, 12);

      // Create admin account
      const { data: admin, error: createError } = await supabaseAdmin
        .from('admins')
        .insert({
          email: ADMIN_ACCOUNT.email,
          password: hashedPassword,
          full_name: ADMIN_ACCOUNT.full_name,
          role: 'admin',
          is_active: true,
          permissions: {
            can_create_admins: true,
            can_delete_admins: true,
            can_manage_clients: true,
            can_schedule_consultations: true,
            can_view_reports: true,
            can_manage_system: true
          },
          created_at: new Date().toISOString(),
          last_login_at: null
        })
        .select()
        .single();

      if (createError) {
        this.log('❌ Failed to create admin', createError);
        return null;
      }

      this.log('✅ Admin created successfully', {
        admin_id: admin.id,
        email: admin.email,
        full_name: admin.full_name
      });

      return admin;

    } catch (error) {
      this.log('❌ Error creating admin', error);
      return null;
    }
  }

  async testDatabaseConnection() {
    this.log('🗄️  Testing database connection...');
    
    try {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('count')
        .limit(1);

      if (error) {
        this.log('❌ Database connection failed', error);
        return false;
      }

      this.log('✅ Database connection successful');
      return true;

    } catch (error) {
      this.log('❌ Database connection error', error);
      return false;
    }
  }

  async runSetup() {
    this.log('🚀 STARTING DIRECT ADMIN CREATION');
    this.log('=' .repeat(50));
    
    // Test database connection first
    const dbConnected = await this.testDatabaseConnection();
    if (!dbConnected) {
      this.log('❌ Cannot proceed without database connection');
      return;
    }

    // Create admin
    const admin = await this.createAdminDirectly();
    
    if (admin) {
      this.log('\n📋 ADMIN CREATION REPORT');
      this.log('=' .repeat(50));
      this.log('🎉 ADMIN ACCOUNT READY');
      this.log('\n🔐 LOGIN CREDENTIALS:');
      this.log(`Email: ${ADMIN_ACCOUNT.email}`);
      this.log(`Password: ${ADMIN_ACCOUNT.password}`);
      this.log(`Admin ID: ${admin.id}`);
      
      this.log('\n🌐 BACKEND URLS:');
      this.log(`Production: https://apply-bureau-backend.vercel.app`);
      this.log(`Login Endpoint: https://apply-bureau-backend.vercel.app/api/auth/login`);
      
      this.log('\n✅ NEXT STEPS:');
      this.log('1. Test admin login via API');
      this.log('2. Test consultation management');
      this.log('3. Test application tracking');
      this.log('4. Verify all admin features work');
      
    } else {
      this.log('\n❌ ADMIN CREATION FAILED');
      this.log('Check database connection and permissions');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new DirectAdminCreation();
  setup.runSetup().catch(console.error);
}

module.exports = DirectAdminCreation;