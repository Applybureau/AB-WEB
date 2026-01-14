require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkRegisteredUsersSchema() {
  try {
    console.log('🔍 Checking registered_users table schema');
    console.log('==========================================');
    
    // Try to get a sample record to see what columns exist
    const { data: sampleUsers, error: sampleError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Error fetching sample users:', sampleError.message);
    } else {
      console.log('✅ Sample users fetched');
      if (sampleUsers.length > 0) {
        console.log('📋 Available columns:');
        Object.keys(sampleUsers[0]).forEach(column => {
          console.log(`   - ${column}: ${typeof sampleUsers[0][column]}`);
        });
      } else {
        console.log('📋 No users found, trying to insert minimal record...');
        
        // Try minimal insert to see what's required
        const { data: testInsert, error: insertError } = await supabaseAdmin
          .from('registered_users')
          .insert({
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'client'
          })
          .select()
          .single();
        
        if (insertError) {
          console.log('❌ Test insert failed:', insertError.message);
          console.log('   Details:', insertError.details);
          console.log('   Hint:', insertError.hint);
        } else {
          console.log('✅ Test insert successful');
          console.log('📋 Inserted record columns:');
          Object.keys(testInsert).forEach(column => {
            console.log(`   - ${column}: ${typeof testInsert[column]}`);
          });
          
          // Clean up test record
          await supabaseAdmin
            .from('registered_users')
            .delete()
            .eq('id', testInsert.id);
          console.log('🧹 Test record cleaned up');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkRegisteredUsersSchema();