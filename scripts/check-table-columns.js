const { supabaseAdmin } = require('../utils/supabase');

async function checkTableColumns() {
  try {
    console.log('🔍 Checking table columns and structure...');
    
    // Check consultation_requests table
    console.log('\n📋 Checking consultation_requests table...');
    const { data: consultations, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .limit(1);
    
    if (consultationError) {
      console.error('❌ Error accessing consultation_requests:', consultationError);
    } else {
      if (consultations && consultations.length > 0) {
        const cols = Object.keys(consultations[0]);
        console.log('✅ consultation_requests columns:', cols.join(', '));
        
        const requiredCols = ['message', 'admin_status', 'preferred_slots', 'confirmed_time', 'admin_notes'];
        const missingCols = requiredCols.filter(col => !cols.includes(col));
        if (missingCols.length > 0) {
          console.log('⚠️  Missing columns:', missingCols.join(', '));
        } else {
          console.log('✅ All required columns present');
        }
      } else {
        console.log('📋 Table exists but no data - checking with INSERT test...');
        
        // Try to insert test data to see what columns exist
        const testData = {
          full_name: 'Test User',
          email: 'test@example.com',
          phone: '+1-555-0123',
          message: 'Test message',
          admin_status: 'pending',
          status: 'pending'
        };
        
        const { data: insertTest, error: insertError } = await supabaseAdmin
          .from('consultation_requests')
          .insert(testData)
          .select()
          .single();
        
        if (insertError) {
          console.log('❌ Insert test failed:', insertError.message);
          if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
            console.log('⚠️  Some required columns are missing');
          }
        } else {
          console.log('✅ Insert test successful - columns exist');
          const cols = Object.keys(insertTest);
          console.log('📋 Available columns:', cols.join(', '));
          
          // Clean up test data
          await supabaseAdmin
            .from('consultation_requests')
            .delete()
            .eq('id', insertTest.id);
        }
      }
    }
    
    // Check registered_users table
    console.log('\n📋 Checking registered_users table...');
    const { data: users, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .limit(1);
    
    if (userError) {
      console.error('❌ Error accessing registered_users:', userError);
    } else {
      if (users && users.length > 0) {
        const cols = Object.keys(users[0]);
        console.log('✅ registered_users columns:', cols.join(', '));
        
        const requiredCols = ['payment_confirmed', 'profile_unlocked', 'registration_token', 'token_expires_at'];
        const missingCols = requiredCols.filter(col => !cols.includes(col));
        if (missingCols.length > 0) {
          console.log('⚠️  Missing columns:', missingCols.join(', '));
        } else {
          console.log('✅ All required columns present');
        }
      } else {
        console.log('📋 Table exists but no data');
      }
    }
    
    // Check if client_onboarding_20q table exists
    console.log('\n📋 Checking client_onboarding_20q table...');
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .limit(1);
    
    if (onboardingError) {
      console.log('❌ client_onboarding_20q table missing or inaccessible:', onboardingError.message);
    } else {
      console.log('✅ client_onboarding_20q table exists');
      if (onboarding && onboarding.length > 0) {
        const cols = Object.keys(onboarding[0]);
        console.log('📋 Available columns:', cols.join(', '));
      }
    }
    
    // Check applications table for week_number column
    console.log('\n📋 Checking applications table...');
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .limit(1);
    
    if (appError) {
      console.error('❌ Error accessing applications:', appError);
    } else {
      if (applications && applications.length > 0) {
        const cols = Object.keys(applications[0]);
        console.log('✅ applications columns:', cols.join(', '));
        
        const requiredCols = ['week_number', 'interview_update_sent'];
        const missingCols = requiredCols.filter(col => !cols.includes(col));
        if (missingCols.length > 0) {
          console.log('⚠️  Missing columns:', missingCols.join(', '));
        } else {
          console.log('✅ All required columns present');
        }
      } else {
        console.log('📋 Table exists but no data');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking table columns:', error.message);
    return false;
  }
}

// Run the check
if (require.main === module) {
  checkTableColumns().then(success => {
    console.log('\n🎯 Summary: Run this script to identify missing columns and tables');
    console.log('If columns are missing, apply the COMPLETE_MISSING_TABLES_SCHEMA.sql');
    process.exit(0);
  });
}

module.exports = { checkTableColumns };