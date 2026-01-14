require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createFreshTestUser() {
  try {
    console.log('🔧 CREATING FRESH TEST USER');
    console.log('===========================');
    
    const testEmail = 'fresh.test@example.com';
    const testName = 'Fresh Test User';
    const testPassword = 'FreshTest123!';
    
    // 1. Delete existing user if exists
    console.log('\n🧹 1. Cleaning up existing user...');
    await supabaseAdmin.from('client_onboarding_20q').delete().eq('user_id', (await supabaseAdmin.from('registered_users').select('id').eq('email', testEmail).single()).data?.id);
    await supabaseAdmin.from('registered_users').delete().eq('email', testEmail);
    console.log('✅ Cleanup completed');
    
    // 2. Create new user
    console.log('\n👤 2. Creating new user...');
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const registrationToken = jwt.sign({
      email: testEmail,
      name: testName,
      type: 'registration',
      payment_confirmed: true
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        email: testEmail,
        full_name: testName,
        passcode_hash: hashedPassword,
        role: 'client',
        is_active: true,
        payment_confirmed: true,
        payment_received: true,
        registration_token: registrationToken,
        token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        token_used: true,
        profile_unlocked: false,
        onboarding_completed: false
      })
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Failed to create user:', userError.message);
      return false;
    }
    
    console.log('✅ User created successfully');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    
    // 3. Create onboarding record
    console.log('\n📝 3. Creating onboarding record...');
    const onboardingData = {
      user_id: newUser.id,
      target_job_titles: ['Software Engineer', 'Full Stack Developer'],
      target_industries: ['Technology', 'Software'],
      target_company_sizes: ['Startup (1-50)', 'Scale-up (51-200)'],
      target_locations: ['Toronto', 'Remote'],
      remote_work_preference: 'hybrid',
      current_salary_range: '80000-100000',
      target_salary_range: '100000-130000',
      salary_negotiation_comfort: 7,
      years_of_experience: 5,
      key_technical_skills: ['JavaScript', 'React', 'Node.js'],
      soft_skills_strengths: ['Communication', 'Problem Solving'],
      certifications_licenses: [],
      job_search_timeline: '3_6_months',
      application_volume_preference: 'quality_focused',
      networking_comfort_level: 6,
      interview_confidence_level: 7,
      career_goals_short_term: 'Secure a senior developer role',
      career_goals_long_term: 'Become a tech lead',
      biggest_career_challenges: ['Interview preparation'],
      support_areas_needed: ['Resume optimization'],
      execution_status: 'pending_approval',
      completed_at: new Date().toISOString()
    };
    
    const { data: newOnboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .insert(onboardingData)
      .select()
      .single();
    
    if (onboardingError) {
      console.log('❌ Failed to create onboarding:', onboardingError.message);
      return false;
    }
    
    console.log('✅ Onboarding record created successfully');
    console.log(`   ID: ${newOnboarding.id}`);
    console.log(`   Status: ${newOnboarding.execution_status}`);
    
    console.log('\n🎉 Fresh test user created successfully!');
    console.log('📋 Test Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   User ID: ${newUser.id}`);
    console.log(`   Onboarding ID: ${newOnboarding.id}`);
    
    return {
      userId: newUser.id,
      onboardingId: newOnboarding.id,
      email: testEmail,
      password: testPassword
    };
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
    return false;
  }
}

createFreshTestUser().then(result => {
  if (result) {
    console.log('\n✅ Ready for testing!');
  }
  process.exit(result ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});