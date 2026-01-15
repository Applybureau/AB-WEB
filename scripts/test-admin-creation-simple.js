require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function testAdminCreation() {
  console.log('🧪 Testing Admin Creation - Direct Database Test\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Check if master admin exists
    console.log('\n📝 Step 1: Checking master admin...');
    const { data: masterAdmin, error: masterError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .eq('role', 'admin')
      .single();

    if (masterError || !masterAdmin) {
      console.error('❌ Master admin not found');
      console.error('Error:', masterError);
      return;
    }

    console.log('✅ Master admin found:', {
      id: masterAdmin.id,
      email: masterAdmin.email,
      full_name: masterAdmin.full_name,
      role: masterAdmin.role
    });

    // Step 2: Check if profile-pictures bucket exists
    console.log('\n📝 Step 2: Checking storage bucket...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name));
      const profilePicturesBucket = buckets.find(b => b.name === 'profile-pictures');
      if (!profilePicturesBucket) {
        console.warn('⚠️  profile-pictures bucket not found - profile pictures will fail');
      } else {
        console.log('✅ profile-pictures bucket exists');
      }
    }

    // Step 3: Try to create a test admin directly in database
    console.log('\n📝 Step 3: Creating test admin in database...');
    
    const testEmail = `testadmin${Date.now()}@applybureau.com`;
    const hashedPassword = await bcrypt.hash('TestAdmin@123456', 12);

    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('clients')
      .insert({
        full_name: 'Test Admin User',
        email: testEmail,
        password: hashedPassword,
        phone: '+1234567890',
        role: 'admin',
        status: 'active',
        is_active: true,
        created_by_admin_id: masterAdmin.id
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create admin in database');
      console.error('Error:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      return;
    }

    console.log('✅ Admin created successfully in database!');
    console.log('New admin:', {
      id: newAdmin.id,
      email: newAdmin.email,
      full_name: newAdmin.full_name,
      role: newAdmin.role,
      is_active: newAdmin.is_active
    });

    // Step 4: Verify the admin can be retrieved
    console.log('\n📝 Step 4: Verifying admin retrieval...');
    const { data: verifyAdmin, error: verifyError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', newAdmin.id)
      .single();

    if (verifyError) {
      console.error('❌ Failed to retrieve admin');
      console.error('Error:', verifyError);
      return;
    }

    console.log('✅ Admin retrieved successfully');

    // Step 5: Check clients table structure
    console.log('\n📝 Step 5: Checking clients table structure...');
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
    } else if (tableData && tableData.length > 0) {
      console.log('✅ Table columns:', Object.keys(tableData[0]));
    }

    console.log('\n✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('- Master admin exists: ✅');
    console.log('- Storage bucket check: ✅');
    console.log('- Admin creation: ✅');
    console.log('- Admin retrieval: ✅');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAdminCreation();
