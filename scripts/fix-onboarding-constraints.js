require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function fixOnboardingConstraints() {
  console.log('🔧 FIXING ONBOARDING CONSTRAINTS');
  console.log('=================================\n');

  const testUserId = '05eb31ea-4717-47cf-aafe-c5f201b1a755';

  try {
    // Test with correct constraint values
    console.log('1. Testing with corrected constraint values...');
    
    const correctedData = {
      user_id: testUserId,
      target_job_titles: ['Software Engineer'],
      target_industries: ['Technology'],
      target_locations: ['New York, NY'],
      remote_work_preference: 'Hybrid',
      target_salary_range: '$100,000 - $130,000',
      years_of_experience: 3,
      key_technical_skills: ['JavaScript'],
      job_search_timeline: 'immediate', // Try different values
      career_goals_short_term: 'Advance to a senior role',
      biggest_career_challenges: ['Finding the right opportunities'],
      support_areas_needed: ['Resume optimization'],
      execution_status: 'pending_approval',
      completed_at: new Date().toISOString()
    };

    // Try different timeline values
    const timelineOptions = [
      'immediate',
      'soon',
      'moderate',
      'flexible',
      'Immediately (0-1 month)',
      'Soon (1-3 months)',
      'Moderate (3-6 months)',
      'Flexible (6+ months)'
    ];

    for (const timeline of timelineOptions) {
      console.log(`\nTrying timeline: "${timeline}"`);
      
      const testData = { ...correctedData, job_search_timeline: timeline };
      
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .upsert(testData, { onConflict: 'user_id' })
        .select()
        .single();

      if (insertError) {
        console.log(`❌ Failed with "${timeline}":`, insertError.message);
      } else {
        console.log(`✅ Success with "${timeline}"!`);
        console.log('   Record ID:', insertData.id);
        
        // Clean up the test record
        await supabaseAdmin
          .from('client_onboarding_20q')
          .delete()
          .eq('id', insertData.id);
        
        break;
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

fixOnboardingConstraints();