const { supabaseAdmin } = require('../utils/supabase');

async function checkActualTableStructure() {
  try {
    console.log('🔍 Checking actual table structures in database...');
    
    // Check consultation_requests table structure
    console.log('\n📋 consultation_requests table:');
    try {
      const { data: consultations, error: consultationError } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .limit(1);
      
      if (consultationError) {
        console.error('❌ Error accessing consultation_requests:', consultationError);
      } else {
        if (consultations && consultations.length > 0) {
          const columns = Object.keys(consultations[0]);
          console.log('✅ Existing columns:', columns.join(', '));
        } else {
          console.log('📋 Table exists but no data - trying to describe structure...');
          
          // Try inserting minimal data to see what columns are required
          const testInsert = {
            name: 'Test',
            email: 'test@example.com'
          };
          
          const { data: insertTest, error: insertError } = await supabaseAdmin
            .from('consultation_requests')
            .insert(testInsert)
            .select()
            .single();
          
          if (insertError) {
            console.log('❌ Insert test error:', insertError.message);
            console.log('This tells us about the required columns and structure');
          } else {
            console.log('✅ Insert successful, columns:', Object.keys(insertTest));
            // Clean up
            await supabaseAdmin
              .from('consultation_requests')
              .delete()
              .eq('id', insertTest.id);
          }
        }
      }
    } catch (error) {
      console.error('❌ consultation_requests error:', error.message);
    }
    
    // Check registered_users table structure
    console.log('\n📋 registered_users table:');
    try {
      const { data: users, error: userError } = await supabaseAdmin
        .from('registered_users')
        .select('*')
        .limit(1);
      
      if (userError) {
        console.error('❌ Error accessing registered_users:', userError);
      } else {
        if (users && users.length > 0) {
          const columns = Object.keys(users[0]);
          console.log('✅ Existing columns:', columns.join(', '));
        } else {
          console.log('📋 Table exists but no data');
        }
      }
    } catch (error) {
      console.error('❌ registered_users error:', error.message);
    }
    
    // Check applications table structure
    console.log('\n📋 applications table:');
    try {
      const { data: applications, error: appError } = await supabaseAdmin
        .from('applications')
        .select('*')
        .limit(1);
      
      if (appError) {
        console.error('❌ Error accessing applications:', appError);
      } else {
        if (applications && applications.length > 0) {
          const columns = Object.keys(applications[0]);
          console.log('✅ Existing columns:', columns.join(', '));
        } else {
          console.log('📋 Table exists but no data');
        }
      }
    } catch (error) {
      console.error('❌ applications error:', error.message);
    }
    
    // Check notifications table structure
    console.log('\n📋 notifications table:');
    try {
      const { data: notifications, error: notifError } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .limit(1);
      
      if (notifError) {
        console.error('❌ Error accessing notifications:', notifError);
      } else {
        if (notifications && notifications.length > 0) {
          const columns = Object.keys(notifications[0]);
          console.log('✅ Existing columns:', columns.join(', '));
        } else {
          console.log('📋 Table exists but no data');
        }
      }
    } catch (error) {
      console.error('❌ notifications error:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking table structures:', error.message);
    return false;
  }
}

// Run the check
if (require.main === module) {
  checkActualTableStructure().then(success => {
    console.log('\n🎯 This will help us create the correct schema based on actual table structure');
    process.exit(0);
  });
}

module.exports = { checkActualTableStructure };