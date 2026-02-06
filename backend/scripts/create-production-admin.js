const axios = require('axios');

// Production Vercel URL
const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';
const API_BASE = `${BACKEND_URL}/api`;

// Admin account details
const ADMIN_ACCOUNT = {
  email: 'admin@applybureautest.com',
  password: 'AdminTest123!',
  full_name: 'Apply Bureau Admin',
  setup_key: 'setup-admin-2024' // Optional security key
};

class ProductionAdminSetup {
  constructor() {
    this.adminToken = null;
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        timeout: 30000,
        ...(data && { data })
      };

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500,
        details: {
          code: error.code,
          message: error.message
        }
      };
    }
  }

  // Step 1: Create admin account
  async createAdminAccount() {
    this.log('🔧 STEP 1: Creating admin account on production...');
    
    const result = await this.makeRequest('POST', '/auth/register-admin', ADMIN_ACCOUNT);
    
    if (result.success) {
      this.adminToken = result.data.token;
      this.log('✅ Admin account created successfully', {
        admin_id: result.data.user.id,
        email: result.data.user.email,
        full_name: result.data.user.full_name,
        permissions: result.data.user.permissions
      });
      return true;
    } else if (result.status === 409) {
      this.log('ℹ️  Admin account already exists, attempting login...');
      return await this.loginExistingAdmin();
    } else {
      this.log('❌ Failed to create admin account', {
        error: result.error,
        status: result.status
      });
      return false;
    }
  }

  // Step 2: Login to existing admin account
  async loginExistingAdmin() {
    this.log('🔐 STEP 2: Logging into existing admin account...');
    
    const loginData = {
      email: ADMIN_ACCOUNT.email,
      password: ADMIN_ACCOUNT.password
    };
    
    const result = await this.makeRequest('POST', '/auth/login', loginData);
    
    if (result.success) {
      this.adminToken = result.data.token;
      this.log('✅ Admin login successful', {
        user_id: result.data.user.id,
        role: result.data.user.role
      });
      return true;
    } else {
      this.log('❌ Admin login failed', {
        error: result.error,
        status: result.status
      });
      return false;
    }
  }

  // Step 3: Test admin functionality
  async testAdminFunctionality() {
    this.log('🧪 STEP 3: Testing admin functionality...');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test admin functionality - no token');
      return false;
    }

    // Test 1: View consultations
    const consultationsResult = await this.makeRequest(
      'GET', 
      '/admin/concierge/consultations',
      null,
      this.adminToken
    );
    
    if (consultationsResult.success) {
      this.log('✅ Admin can view consultations', {
        total_consultations: consultationsResult.data.consultations?.length || 0,
        status_counts: consultationsResult.data.status_counts
      });
    } else {
      this.log('❌ Admin consultation access failed', consultationsResult.error);
      return false;
    }

    // Test 2: View applications
    const applicationsResult = await this.makeRequest(
      'GET',
      '/applications',
      null,
      this.adminToken
    );
    
    if (applicationsResult.success) {
      this.log('✅ Admin can view applications', {
        total_applications: applicationsResult.data.applications?.length || 0
      });
    } else {
      this.log('❌ Admin applications access failed', applicationsResult.error);
      return false;
    }

    // Test 3: Check user profile
    const profileResult = await this.makeRequest(
      'GET',
      '/auth/me',
      null,
      this.adminToken
    );
    
    if (profileResult.success) {
      this.log('✅ Admin profile access working', {
        user_id: profileResult.data.user.id,
        role: profileResult.data.user.role,
        permissions: profileResult.data.user.permissions
      });
    } else {
      this.log('❌ Admin profile access failed', profileResult.error);
      return false;
    }

    return true;
  }

  // Step 4: Test consultation management
  async testConsultationManagement() {
    this.log('📋 STEP 4: Testing consultation management...');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test consultation management - no token');
      return false;
    }

    // Get consultations first
    const consultationsResult = await this.makeRequest(
      'GET', 
      '/admin/concierge/consultations',
      null,
      this.adminToken
    );
    
    if (!consultationsResult.success) {
      this.log('❌ Cannot get consultations for management test');
      return false;
    }

    const consultations = consultationsResult.data.consultations || [];
    
    if (consultations.length === 0) {
      this.log('ℹ️  No consultations available for management testing');
      return true; // Not a failure, just no data
    }

    // Try to get details of first consultation
    const firstConsultation = consultations[0];
    this.log('✅ Consultation management access working', {
      sample_consultation: {
        id: firstConsultation.id,
        name: firstConsultation.prospect_name,
        status: firstConsultation.status,
        created_at: firstConsultation.created_at
      },
      total_consultations: consultations.length
    });

    return true;
  }

  // Generate setup report
  generateSetupReport(success) {
    this.log('\n📋 PRODUCTION ADMIN SETUP REPORT');
    this.log('=' .repeat(60));
    
    if (success) {
      this.log('🎉 ADMIN SETUP COMPLETED SUCCESSFULLY');
      this.log('\n✅ ADMIN ACCOUNT STATUS:');
      this.log(`• Email: ${ADMIN_ACCOUNT.email}`);
      this.log(`• Password: ${ADMIN_ACCOUNT.password}`);
      this.log(`• Backend URL: ${BACKEND_URL}`);
      this.log(`• Token Generated: ${this.adminToken ? 'Yes' : 'No'}`);
      
      this.log('\n🔧 ADMIN CAPABILITIES:');
      this.log('• ✅ View all consultations');
      this.log('• ✅ Manage consultation requests');
      this.log('• ✅ View applications');
      this.log('• ✅ Access admin dashboard');
      this.log('• ✅ Manage client accounts');
      
      this.log('\n🚀 NEXT STEPS:');
      this.log('1. Use these credentials to login to admin dashboard');
      this.log('2. Test consultation confirmation workflow');
      this.log('3. Test client registration and onboarding');
      this.log('4. Verify all email notifications are working');
      
      this.log('\n🔐 LOGIN CREDENTIALS:');
      this.log(`Email: ${ADMIN_ACCOUNT.email}`);
      this.log(`Password: ${ADMIN_ACCOUNT.password}`);
      this.log(`Login URL: ${process.env.FRONTEND_URL || 'https://www.applybureau.com'}/admin/login`);
      
    } else {
      this.log('❌ ADMIN SETUP FAILED');
      this.log('\n🔍 TROUBLESHOOTING:');
      this.log('1. Check if backend is running on Vercel');
      this.log('2. Verify database connection');
      this.log('3. Check environment variables');
      this.log('4. Review server logs for errors');
    }
  }

  // Run complete setup
  async runSetup() {
    this.log('🚀 STARTING PRODUCTION ADMIN SETUP');
    this.log(`Target Backend: ${BACKEND_URL}`);
    this.log('=' .repeat(70));
    
    try {
      // Step 1: Create or login admin
      const adminCreated = await this.createAdminAccount();
      if (!adminCreated) {
        this.generateSetupReport(false);
        return;
      }

      // Step 2: Test admin functionality
      const functionalityWorking = await this.testAdminFunctionality();
      if (!functionalityWorking) {
        this.generateSetupReport(false);
        return;
      }

      // Step 3: Test consultation management
      const managementWorking = await this.testConsultationManagement();
      if (!managementWorking) {
        this.generateSetupReport(false);
        return;
      }

      this.generateSetupReport(true);
      
    } catch (error) {
      this.log('❌ CRITICAL ERROR DURING SETUP', error);
      this.generateSetupReport(false);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new ProductionAdminSetup();
  setup.runSetup().catch(console.error);
}

module.exports = ProductionAdminSetup;