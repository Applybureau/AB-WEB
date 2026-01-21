require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function testOnboardingTableDirect() {
  console.log('🔍 TESTING ONBOARDING TABLE DIRECTLY');
  console.log('====================================\n');

  const testUserId = '05eb31ea-4717-47cf-aafe-c5f201b1a755';

  try {
    // 1. Check table structure
    console.log('1. Checking table structure...');
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Error accessing table:', sampleError);
      return;
    }

    console.log('✅ Table accessible');
    if (sampleData && sampleData.length > 0) {
      console.log('   Sample columns:', Object.keys(sampleData[0]).join(', '));
    }

    // 2. Try simple insert
    console.log('\n2. Testing simple insert...');
    const simpleData = {
      user_id: testUserId,
      target_job_titles: ['Software Engineer'],
      target_industries: ['Technology'],
      target_locations: ['New York, NY'],
      target_salary_range: '$100,000 - $130,000',
      years_of_experience: 3,
      key_technical_skills: ['JavaScript'],
      job_search_timeline: 'Soon (1-3 months)',
      career_goals_short_term: 'Advance to a senior role',
      biggest_career_challenges: ['Finding the right opportunities'],
      support_areas_needed: ['Resume optimization'],
      execution_status: 'pending_approval',
      completed_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .insert(simpleData)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert error:', insertError);
      
      // Try upsert instead
      console.log('\n3. Testing upsert...');
      const { data: upsertData, error: upsertError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .upsert(simpleData, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertError) {
        console.log('❌ Upsert error:', upsertError);
      } else {
        console.log('✅ Upsert successful:', upsertData.id);
      }
    } else {
      console.log('✅ Insert successful:', insertData.id);
    }

    // 4. Check if record exists
    console.log('\n4. Checking existing records...');
    const { data: existingData, error: existingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', testUserId);

    if (existingError) {
      console.log('❌ Error checking existing records:', existingError);
    } else {
      console.log(`✅ Found ${existingData?.length || 0} existing records for user`);
      if (existingData && existingData.length > 0) {
        console.log('   Record ID:', existingData[0].id);
        console.log('   Status:', existingData[0].execution_status);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOnboardingTableDirect();