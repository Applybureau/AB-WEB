#!/usr/bin/env node

/**
 * Update Admin Credentials Script
 * Updates the admin account to use applybureau@gmail.com with password Admin123@#
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

const NEW_ADMIN_EMAIL = 'applybureau@gmail.com';
const NEW_ADMIN_PASSWORD = 'Admin123@#';

class AdminUpdater {
  constructor() {
    this.log('🔧 Admin Credentials Updater Started');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📧',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📧';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async updateAdminCredentials() {
    try {
      this.log('Updating admin credentials...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(NEW_ADMIN_PASSWORD, 12);
      
      // First, try to find existing admin in clients table
      const { data: existingAdmin, error: findError } = await supabaseAdmin
        .from('clients')
        .select('id, email, role')
        .or(`email.eq.admin@applybureau.com,email.eq.${NEW_ADMIN_EMAIL}`)
        .eq('role', 'admin')
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingAdmin) {
        // Update existing admin
        this.log(`Found existing admin with ID: ${existingAdmin.id}`);
        
        const { data: updatedAdmin, error: updateError } = await supabaseAdmin
          .from('clients')
          .update({
            email: NEW_ADMIN_EMAIL,
            password: hashedPassword,
            full_name: 'Apply Bureau Admin',
            role: 'admin',
            status: 'active',
            onboarding_complete: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAdmin.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        this.log(`Admin credentials updated successfully!`, 'success');
        this.log(`Email: ${updatedAdmin.email}`, 'success');
        this.log(`ID: ${updatedAdmin.id}`, 'success');
        
        return updatedAdmin;
      } else {
        // Create new admin
        this.log('No existing admin found, creating new admin...');
        
        const { data: newAdmin, error: createError } = await supabaseAdmin
          .from('clients')
          .insert({
            email: NEW_ADMIN_EMAIL,
            password: hashedPassword,
            full_name: 'Apply Bureau Admin',
            role: 'admin',
            status: 'active',
            onboarding_complete: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        this.log(`New admin created successfully!`, 'success');
        this.log(`Email: ${newAdmin.email}`, 'success');
        this.log(`ID: ${newAdmin.id}`, 'success');
        
        return newAdmin;
      }
    } catch (error) {
      this.log(`Failed to update admin credentials: ${error.message}`, 'error');
      throw error;
    }
  }

  async testLogin() {
    try {
      this.log('Testing admin login...');
      
      // Find the admin
      const { data: admin, error: findError } = await supabaseAdmin
        .from('clients')
        .select('id, email, password, role')
        .eq('email', NEW_ADMIN_EMAIL)
        .eq('role', 'admin')
        .single();

      if (findError || !admin) {
        throw new Error('Admin not found');
      }

      // Test password
      const passwordMatch = await bcrypt.compare(NEW_ADMIN_PASSWORD, admin.password);
      
      if (passwordMatch) {
        this.log('Login test successful!', 'success');
        return true;
      } else {
        this.log('Login test failed - password mismatch', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Login test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    try {
      this.log('🚀 Starting admin credentials update...');
      
      // Update credentials
      const admin = await this.updateAdminCredentials();
      
      // Test login
      const loginSuccess = await this.testLogin();
      
      if (loginSuccess) {
        this.log('\n🎉 Admin credentials update completed successfully!', 'success');
        this.log(`\n📋 New Admin Credentials:`, 'info');
        this.log(`Email: ${NEW_ADMIN_EMAIL}`, 'info');
        this.log(`Password: ${NEW_ADMIN_PASSWORD}`, 'info');
        this.log(`\n🔗 You can now login at: ${process.env.FRONTEND_URL}/admin/login`, 'info');
      } else {
        this.log('\n❌ Admin credentials update failed - login test unsuccessful', 'error');
        process.exit(1);
      }
    } catch (error) {
      this.log(`\n💥 Admin credentials update failed: ${error.message}`, 'error');
      console.error('Full error:', error);
      process.exit(1);
    }
  }
}

// Run the updater
async function main() {
  const updater = new AdminUpdater();
  await updater.run();
}

if (require.main === module) {
  main();
}

module.exports = AdminUpdater;