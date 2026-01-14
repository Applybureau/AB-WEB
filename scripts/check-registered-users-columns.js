require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkRegisteredUsersColumns() {
  try {
    console.log('🔍 CHECKING REGISTERED_USERS TABLE COLUMNS');
    console.log('==========================================');
    
    // Get a sample record to see the column structure
    const { data: sampleUser, error } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.log('❌ Error fetching sample user:', error.message);
      return;
    }
    
    console.log('✅ Sample user record:');
    console.log('Columns available:');
    Object.keys(sampleUser).forEach(column => {
      console.log(`   - ${column}: ${typeof sampleUser[column]}`);
    });
    
    // Check if profile_unlocked and onboarding_completed columns exist
    const hasProfileUnlocked = 'profile_unlocked' in sampleUser;
    const hasOnboardingCompleted = 'onboarding_completed' in sampleUser;
    
    console.log('\n📊 Column Check:');
    console.log(`   profile_unlocked: ${hasProfileUnlocked ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   onboarding_completed: ${hasOnboardingCompleted ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasProfileUnlocked || !hasOnboardingCompleted) {
      console.log('\n⚠️  Missing columns need to be added to registered_users table');
      console.log('Run this SQL in Supabase SQL Editor:');
      console.log('ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS profile_unlocked BOOLEAN DEFAULT FALSE;');
      console.log('ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkRegisteredUsersColumns().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});