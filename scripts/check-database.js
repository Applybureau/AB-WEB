#!/usr/bin/env node

/**
 * Check Database Structure Script
 * Verifies the current database structure and creates missing tables/columns
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkDatabase() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check if clients table exists and its structure
    console.log('\n📋 Checking clients table...');
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.log('❌ Clients table error:', clientsError.message);
      console.log('💡 Need to create/fix clients table');
      return false;
    } else {
      console.log('✅ Clients table exists');
    }
    
    // Check other tables
    const tables = ['consultations', 'applications', 'notifications', 'audit_logs'];
    
    for (const table of tables) {
      console.log(`\n📋 Checking ${table} table...`);
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table} table error:`, error.message);
      } else {
        console.log(`✅ ${table} table exists`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return false;
  }
}

async function createBasicSchema() {
  console.log('\n🔧 Creating basic database schema...');
  
  const createTablesSQL = `
    -- Create clients table with all required columns
    CREATE TABLE IF NOT EXISTS clients (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      resume_url TEXT,
      onboarding_complete BOOLEAN DEFAULT FALSE,
      role VARCHAR(20) DEFAULT 'client',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create consultations table
    CREATE TABLE IF NOT EXISTS consultations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
      notes TEXT,
      status VARCHAR(20) DEFAULT 'scheduled',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create applications table
    CREATE TABLE IF NOT EXISTS applications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      job_title VARCHAR(255) NOT NULL,
      company VARCHAR(255) NOT NULL,
      job_link TEXT,
      date_applied TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status VARCHAR(20) DEFAULT 'applied',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create notifications table
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
    
    -- Create audit_logs table
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
  
  try {
    // Note: We can't execute raw SQL through Supabase client directly
    // This would need to be run in the Supabase SQL editor
    console.log('📝 SQL to run in Supabase SQL Editor:');
    console.log(createTablesSQL);
    console.log('\n💡 Please run this SQL in your Supabase dashboard SQL editor');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create schema:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  checkDatabase()
    .then(async (success) => {
      if (!success) {
        await createBasicSchema();
      }
      console.log('\n✅ Database check complete');
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabase, createBasicSchema };