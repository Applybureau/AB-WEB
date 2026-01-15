require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin@123456';

async function debugPassword() {
  console.log('🔍 Debugging Admin Password...\n');
  
  try {
    // Get admin user
    const { data: admin, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (error || !admin) {
      console.error('❌ Admin not found:', error);
      return;
    }
    
    console.log('✅ Admin found:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   ID:', admin.id);
    console.log('   Password hash:', admin.password?.substring(0, 20) + '...');
    
    // Test password comparison
    console.log('\n🔐 Testing password...');
    const isValid = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
    console.log('   Password valid:', isValid);
    
    if (!isValid) {
      console.log('\n❌ Password does not match! Updating...');
      
      // Generate new hash
      const newHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      console.log('   New hash:', newHash.substring(0, 20) + '...');
      
      // Update in database
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ password: newHash })
        .eq('email', ADMIN_EMAIL);
      
      if (updateError) {
        console.error('   ❌ Update failed:', updateError);
      } else {
        console.log('   ✅ Password updated successfully!');
        
        // Verify again
        const { data: updatedAdmin } = await supabaseAdmin
          .from('clients')
          .select('password')
          .eq('email', ADMIN_EMAIL)
          .single();
        
        const isNowValid = await bcrypt.compare(ADMIN_PASSWORD, updatedAdmin.password);
        console.log('   ✅ Verification:', isNowValid ? 'Password now works!' : 'Still not working');
      }
    } else {
      console.log('\n✅ Password is correct!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

debugPassword();
