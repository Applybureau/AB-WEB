require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function testExactQuery() {
  try {
    console.log('🧪 TESTING EXACT QUERY FROM ADMIN ROUTE');
    console.log('=======================================');
    
    const onboardingId = '9133d91c-65f2-4599-9a29-830b58e5240e';
    console.log(`Testing with ID: ${onboardingId}`);
    
    // This is the exact query from the admin route
    console.log('\n📝 1. Testing exact query from admin route...');
    const { data: onboarding, error: fetchError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('id', onboardingId)
      .single();
    
    console.log('Result:', {
      found: !!onboarding,
      error: fetchError?.message,
      errorCode: fetchError?.code
    });
    
    if (onboarding) {
      console.log('✅ Record found successfully');
      console.log(`   User ID: ${onboarding.user_id}`);
      console.log(`   Status: ${onboarding.execution_status}`);
      
      // Test the user lookup too
      console.log('\n👤 2. Testing user lookup...');
      const { data: user, error: userError } = await supabaseAdmin
        .from('registered_users')
        .select('id, email, full_name')
        .eq('id', onboarding.user_id)
        .single();
      
      console.log('User result:', {
        found: !!user,
        error: userError?.message,
        errorCode: userError?.code
      });
      
      if (user) {
        console.log('✅ User found successfully');
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.full_name}`);
      } else {
        console.log('❌ User not found');
      }
    } else {
      console.log('❌ Onboarding record not found');
      
      // Let's try to find any records with similar IDs
      console.log('\n🔍 Searching for similar records...');
      const { data: allRecords, error: allError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .select('id, execution_status')
        .limit(10);
      
      if (allRecords) {
        console.log(`Found ${allRecords.length} total records:`);
        allRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. ID: ${record.id} - Status: ${record.execution_status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExactQuery().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});