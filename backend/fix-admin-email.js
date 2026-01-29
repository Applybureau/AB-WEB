const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixAdminEmail() {
  console.log('🔧 Fixing admin email to applybureau@gmail.com...');
  
  try {
    // 1. Delete existing admin accounts
    console.log('1. Deleting existing admin accounts...');
    await supabase.from('clients').delete().eq('role', 'admin');
    await supabase.from('admins').delete().neq('id', 0);
    console.log('✅ Deleted existing admin accounts');

    // 2. Hash password
    const password = 'Admin123@#';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed');

    // 3. Create admin with correct email
    const { data: adminData, error: adminError } = await supabase
      .from('clients')
      .insert({
        full_name: 'Apply Bureau Admin',
        email: 'applybureau@gmail.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (adminError) throw adminError;
    console.log('✅ Admin created with correct email:', adminData);

    // 4. Test login
    console.log('4. Testing login...');
    const response = await fetch('https://apply-bureau-backend.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'applybureau@gmail.com',
        password: 'Admin123@#'
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log('✅ Login test successful');
      console.log('🎉 Admin email fixed successfully!');
      console.log('📧 Email: applybureau@gmail.com');
      console.log('🔑 Password: Admin123@#');
    } else {
      console.log('❌ Login test failed:', result);
    }

  } catch (error) {
    console.error('❌ Error fixing admin email:', error);
  }
}

fixAdminEmail();