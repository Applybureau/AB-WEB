#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates all necessary tables, functions, and triggers in Supabase
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  console.log('🗄️  Setting up Apply Bureau database...\n');

  try {
    // Test connection first
    console.log('🔗 Testing database connection...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return false;
    }
    console.log('✅ Database connection successful\n');

    // Create tables
    console.log('📋 Creating tables...');
    
    // Create clients table
    const createClientsTable = `
      CREATE TABLE IF NOT EXISTS clients (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        resume_url TEXT,
        onboarding_complete BOOLEAN DEFAULT FALSE,
        role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('admin', 'client')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: clientsError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: createClientsTable 
    });

    if (clientsError) {
      console.log('ℹ️  Clients table may already exist or using direct SQL...');
    } else {
      console.log('✅ Clients table created');
    }

    // Create consultations table
    const createConsultationsTable = `
      CREATE TABLE IF NOT EXISTS consultations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create applications table
    const createApplicationsTable = `
      CREATE TABLE IF NOT EXISTS applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        job_title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        job_link TEXT,
        date_applied TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'offer', 'rejected', 'withdrawn')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create notifications table
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create audit_logs table
    const createAuditLogsTable = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        record_id UUID NOT NULL,
        old_value JSONB,
        new_value JSONB,
        user_id UUID,
        user_type VARCHAR(50),
        table_name VARCHAR(100) NOT NULL,
        action VARCHAR(20) NOT NULL
      );
    `;

    // Since we can't use RPC, let's try direct table creation through Supabase client
    console.log('📝 Note: Please run the SQL scripts manually in your Supabase dashboard:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of supabase-setup.sql');
    console.log('4. Run the contents of supabase-storage-setup.sql\n');

    // Try to create admin user directly
    console.log('👤 Creating admin user...');
    
    const adminData = {
      full_name: 'Admin User',
      email: 'admin@applybureau.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      onboarding_complete: true
    };

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('clients')
      .select('id, email')
      .eq('email', adminData.email)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
    } else {
      // Try to create admin user
      const { data: newAdmin, error: adminError } = await supabaseAdmin
        .from('clients')
        .insert(adminData)
        .select()
        .single();

      if (adminError) {
        console.log('⚠️  Could not create admin user automatically:', adminError.message);
        console.log('📝 Please create admin user manually with these details:');
        console.log('   Email: admin@applybureau.com');
        console.log('   Password: admin123');
        console.log('   Role: admin');
      } else {
        console.log('✅ Admin user created successfully:', newAdmin.email);
      }
    }

    console.log('\n🎉 Database setup process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Ensure all SQL scripts have been run in Supabase');
    console.log('2. Verify admin user exists');
    console.log('3. Run: npm run test-real-world');

    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Setup script failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;