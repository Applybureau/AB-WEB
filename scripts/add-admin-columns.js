#!/usr/bin/env node

/**
 * Add missing admin management columns to clients table
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function addAdminColumns() {
  try {
    console.log('🔧 Adding admin management columns to clients table...');
    
    const columns = [
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS suspended_by UUID;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS suspension_reason TEXT;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS reactivated_by UUID;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_by UUID;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS deletion_reason TEXT;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_reset_by UUID;',
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by_admin_id UUID;'
    ];
    
    for (const column of columns) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: column
        });
        
        if (error) {
          console.log(`   ⚠️  ${column}: ${error.message}`);
        } else {
          console.log(`   ✅ Added column successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
    }
    
    console.log('\n✅ Admin management columns added successfully!');
    
    // Test the columns by checking the current admin
    console.log('\n🔍 Testing admin detection...');
    
    const { data: admin, error } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email, role, is_active')
      .eq('email', 'admin@applybureau.com')
      .eq('role', 'admin')
      .single();
    
    if (admin) {
      console.log('✅ Super admin found:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.full_name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.is_active}`);
    } else {
      console.log('❌ Super admin not found:', error);
    }
    
  } catch (error) {
    console.error('❌ Failed to add admin columns:', error);
    process.exit(1);
  }
}

console.log('🚀 Starting Admin Columns Setup...');
addAdminColumns().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});