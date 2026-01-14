require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function applyConciergeSchemaManual() {
  try {
    console.log('🔧 Applying Concierge Schema Changes Manually');
    console.log('=============================================');
    
    // Check if client_onboarding_20q table exists by trying to query it
    console.log('🔍 Checking if client_onboarding_20q table exists...');
    const { data: onboardingTest, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('id')
      .limit(1);
    
    if (onboardingError && onboardingError.code === 'PGRST205') {
      console.log('❌ client_onboarding_20q table does not exist');
      console.log('⚠️  This table needs to be created manually in Supabase SQL Editor');
      console.log('📋 Please run the CONCIERGE_COMPLETE_SCHEMA_FIX.sql file in Supabase');
      return false;
    } else if (onboardingError) {
      console.log('❌ Error checking client_onboarding_20q table:', onboardingError.message);
      return false;
    } else {
      console.log('✅ client_onboarding_20q table exists');
    }
    
    // Test if we can create a sample onboarding record
    console.log('🧪 Testing onboarding record creation...');
    const testUserId = '688b3986-0398-4c00-8aa9-0f14a411b378'; // Admin user ID
    
    const { data: testOnboarding, error: testError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .insert({
        user_id: testUserId,
        target_job_titles: ['Software Engineer'],
        target_industries: ['Technology'],
        target_company_sizes: ['Startup'],
        target_locations: ['Toronto'],
        remote_work_preference: 'hybrid',
        current_salary_range: '80000-100000',
        target_salary_range: '100000-120000',
        salary_negotiation_comfort: 7,
        years_of_experience: 5,
        key_technical_skills: ['JavaScript'],
        soft_skills_strengths: ['Communication'],
        certifications_licenses: [],
        job_search_timeline: '3_6_months',
        application_volume_preference: 'quality_focused',
        networking_comfort_level: 6,
        interview_confidence_level: 7,
        career_goals_short_term: 'Get promoted',
        career_goals_long_term: 'Become a tech lead',
        biggest_career_challenges: ['Salary negotiation'],
        support_areas_needed: ['Resume optimization'],
        execution_status: 'pending_approval'
      })
      .select()
      .single();
    
    if (testError) {
      console.log('❌ Error creating test onboarding record:', testError.message);
      return false;
    } else {
      console.log('✅ Test onboarding record created successfully');
      
      // Clean up test record
      await supabaseAdmin
        .from('client_onboarding_20q')
        .delete()
        .eq('id', testOnboarding.id);
      console.log('🧹 Test record cleaned up');
    }
    
    console.log('✅ Concierge schema appears to be working correctly');
    return true;
    
  } catch (error) {
    console.error('❌ Schema application failed:', error.message);
    return false;
  }
}

applyConciergeSchemaManual().then(success => {
  if (success) {
    console.log('🎉 Schema check completed successfully');
  } else {
    console.log('⚠️  Manual schema application required');
    console.log('📋 Please run CONCIERGE_COMPLETE_SCHEMA_FIX.sql in Supabase SQL Editor');
  }
  process.exit(success ? 0 : 1);
});