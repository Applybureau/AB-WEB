require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function createUserAccount() {
  try {
    console.log('Creating client account...');
    
    const email = 'israelloko65@gmail.com';
    const password = 'Great123@';
    const name = 'Israel Loko';
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Check if client already exists
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (existingClient) {
      console.log('❌ Client already exists:', existingClient.email);
      return;
    }
    
    // Create the client
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        email: email,
        password: hashedPassword,
        full_name: name,
        role: 'client',
        status: 'active',
        email_verified: true,
        onboarding_complete: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating client:', error);
      return;
    }
    
    console.log('✅ Client account created successfully!');
    console.log('📧 Email:', client.email);
    console.log('👤 Name:', client.full_name);
    console.log('🔑 Role:', client.role);
    console.log('🆔 Client ID:', client.id);
    console.log('');
    console.log('🔐 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');
    console.log('🌐 You can now login at the frontend with these credentials.');
    
  } catch (error) {
    console.error('❌ Failed to create client:', error);
  }
}

createUserAccount();