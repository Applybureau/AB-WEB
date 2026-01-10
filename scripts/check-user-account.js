require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function checkUserAccount() {
  try {
    console.log('Checking client account...');
    
    const email = 'israelloko65@gmail.com';
    const newPassword = 'Great123@';
    
    // Check if client exists
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.log('❌ Client not found:', error.message);
      return;
    }
    
    console.log('✅ Client found!');
    console.log('📧 Email:', client.email);
    console.log('👤 Name:', client.full_name);
    console.log('🔑 Role:', client.role);
    console.log('🆔 Client ID:', client.id);
    console.log('📅 Created:', client.created_at);
    console.log('✅ Onboarding Complete:', client.onboarding_complete);
    console.log('📊 Status:', client.status);
    
    // Ask if you want to update the password
    console.log('\n🔐 Current login credentials:');
    console.log('Email:', email);
    console.log('Password: [encrypted in database]');
    
    // Update password to the requested one
    console.log('\n🔄 Updating password to "Great123@"...');
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', client.id);
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      return;
    }
    
    console.log('✅ Password updated successfully!');
    console.log('\n🔐 Updated login credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('\n🌐 You can now login at the frontend with these credentials.');
    
  } catch (error) {
    console.error('❌ Failed to check/update client:', error);
  }
}

checkUserAccount();