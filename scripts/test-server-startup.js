require('dotenv').config();

async function testServerStartup() {
  console.log('🚀 Testing Server Startup...');
  console.log('Environment variables loaded');
  
  try {
    console.log('1️⃣ Testing basic imports...');
    
    // Test basic Node.js modules
    const express = require('express');
    console.log('✅ Express imported');
    
    const cors = require('cors');
    console.log('✅ CORS imported');
    
    // Test utils imports
    console.log('\n2️⃣ Testing utils imports...');
    const { supabaseAdmin } = require('../utils/supabase');
    console.log('✅ Supabase utils imported');
    
    const { authenticateToken } = require('../utils/auth');
    console.log('✅ Auth utils imported');
    
    const { sendEmail } = require('../utils/email');
    console.log('✅ Email utils imported');
    
    // Test route imports
    console.log('\n3️⃣ Testing route imports...');
    const authRoutes = require('../routes/auth');
    console.log('✅ Auth routes imported');
    
    const publicConsultationsRoutes = require('../routes/publicConsultations');
    console.log('✅ Public consultations routes imported');
    
    const adminConciergeRoutes = require('../routes/adminConcierge');
    console.log('✅ Admin concierge routes imported');
    
    // Test middleware imports
    console.log('\n4️⃣ Testing middleware imports...');
    const { globalErrorHandler } = require('../middleware/errorHandler');
    console.log('✅ Error handler middleware imported');
    
    // Test creating Express app
    console.log('\n5️⃣ Testing Express app creation...');
    const app = express();
    console.log('✅ Express app created');
    
    // Test basic middleware
    app.use(cors());
    app.use(express.json());
    console.log('✅ Basic middleware applied');
    
    // Test route registration
    app.use('/api/auth', authRoutes);
    app.use('/api/public-consultations', publicConsultationsRoutes);
    app.use('/api/admin/concierge', adminConciergeRoutes);
    console.log('✅ Routes registered');
    
    console.log('\n✅ SERVER STARTUP TEST PASSED');
    console.log('🎯 All imports and basic setup work correctly');
    
    return true;
  } catch (error) {
    console.log('\n❌ SERVER STARTUP TEST FAILED');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
}

testServerStartup().then(success => {
  if (success) {
    console.log('\n🚀 Ready to start the actual server');
  } else {
    console.log('\n🔧 Fix the errors above before starting server');
  }
  process.exit(success ? 0 : 1);
});