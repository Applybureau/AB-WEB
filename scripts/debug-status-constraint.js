const { supabaseAdmin } = require('../utils/supabase');

async function debugStatusConstraint() {
  try {
    console.log('🔍 Debugging consultation_requests status constraint...');
    
    // Try to insert with different status values to see which ones work
    const testStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'pending_admin_action'];
    
    for (const status of testStatuses) {
      console.log(`\n📝 Testing status: "${status}"`);
      
      const { data, error } = await supabaseAdmin
        .from('consultation_requests')
        .insert({
          full_name: 'Test User',
          email: `test-${status}@example.com`,
          phone: '+1-555-0100',
          message: 'Test message',
          status: status,
          admin_status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Status "${status}" failed:`, error.message);
      } else {
        console.log(`✅ Status "${status}" works - ID: ${data.id}`);
        
        // Clean up - delete the test record
        await supabaseAdmin
          .from('consultation_requests')
          .delete()
          .eq('id', data.id);
      }
    }
    
    console.log('\n🔍 Checking existing consultation_requests...');
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, status, admin_status')
      .limit(5);
    
    if (existingError) {
      console.log('❌ Error fetching existing records:', existingError);
    } else {
      console.log('✅ Existing records:');
      existing.forEach(record => {
        console.log(`   ID: ${record.id}, Status: ${record.status}, Admin Status: ${record.admin_status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

if (require.main === module) {
  debugStatusConstraint();
}

module.exports = { debugStatusConstraint };