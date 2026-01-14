require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcrypt');

async function createMissingAdmin() {
  try {
    console.log('👤 Creating Missing Admin User');
    console.log('==============================');
    
    const adminId = '688b3986-0398-4c00-8aa9-0f14a411b378';
    const adminEmail = 'admin@applybureau.com';
    const adminPassword = 'admin123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Create the admin user in registered_users table
    console.log('🔄 Creating admin user in registered_users table...');
    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        id: adminId,
        email: adminEmail,
        passcode_hash: hashedPassword,
        full_name: 'Apply Bureau Admin',
        role: 'admin',
        is_active: true,
        profile_unlocked: true,
        payment_confirmed: true,
        payment_received: true,
        onboarding_completed: true,
        token_used: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating admin user:', createError.message);
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('registered_users')
        .select('*')
        .eq('id', adminId)
        .single();
      
      if (!checkError && existingUser) {
        console.log('✅ Admin user already exists');
        console.log('   ID:', existingUser.id);
        console.log('   Email:', existingUser.email);
        console.log('   Role:', existingUser.role);
        return true;
      }
      
      return false;
    }
    
    console.log('✅ Admin user created successfully');
    console.log('   ID:', newAdmin.id);
    console.log('   Email:', newAdmin.email);
    console.log('   Role:', newAdmin.role);
    console.log('   Full Name:', newAdmin.full_name);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return false;
  }
}

createMissingAdmin().then(success => {
  process.exit(success ? 0 : 1);
});