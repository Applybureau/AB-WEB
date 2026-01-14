require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkOnboardingRLS() {
  try {
    console.log('🔍 CHECKING ONBOARDING RLS POLICIES');
    console.log('===================================');
    
    const onboardingId = '398e94ed-cad5-4fe2-a96f-603dd4e8a060';
    
    // 1. Try to fetch with supabaseAdmin (should bypass RLS)
    console.log('\n📝 1. Testing with supabaseAdmin (bypasses RLS)...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('id', onboardingId)
      .single();
    
    if (adminError) {
      console.log('❌ supabaseAdmin query failed:', adminError.message);
      console.log('   Error code:', adminError.code);
      console.log('   Error details:', JSON.stringify(adminError, null, 2));
    } else {
      console.log('✅ supabaseAdmin query successful');
      console.log(`   Found record: ${adminData.id}`);
      console.log(`   User ID: ${adminData.user_id}`);
      console.log(`   Status: ${adminData.execution_status}`);
    }
    
    // 2. Check if the record exists at all
    console.log('\n🔍 2. Checking if record exists (no filters)...');
    const { data: allRecords, error: allError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('id, user_id, execution_status')
      .limit(10);
    
    if (allError) {
      console.log('❌ Query failed:', allError.message);
    } else {
      console.log(`✅ Found ${allRecords.length} total records`);
      allRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        console.log(`      User ID: ${record.user_id}`);
        console.log(`      Status: ${record.execution_status}`);
        if (record.id === onboardingId) {
          console.log('      ⭐ THIS IS OUR TARGET RECORD');
        }
      });
    }
    
    // 3. Try different query approaches
    console.log('\n🔍 3. Testing different query approaches...');
    
    // Approach A: Using .eq()
    const { data: dataA, error: errorA } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('id', onboardingId)
      .single();
    console.log(`   Approach A (.eq + .single): ${dataA ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (errorA) console.log(`      Error: ${errorA.message}`);
    
    // Approach B: Using .match()
    const { data: dataB, error: errorB } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .match({ id: onboardingId })
      .single();
    console.log(`   Approach B (.match + .single): ${dataB ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (errorB) console.log(`      Error: ${errorB.message}`);
    
    // Approach C: Without .single()
    const { data: dataC, error: errorC } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('id', onboardingId);
    console.log(`   Approach C (.eq without .single): ${dataC && dataC.length > 0 ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (errorC) console.log(`      Error: ${errorC.message}`);
    if (dataC) console.log(`      Found ${dataC.length} records`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkOnboardingRLS().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});