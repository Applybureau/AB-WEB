require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function debugContactStatusUpdate() {
  console.log('🔍 Debugging Contact Status Update Issue...');

  try {
    // First, let's check the contact_requests table structure
    console.log('\n📋 Checking contact_requests table structure...');
    
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Error accessing contact_requests table:', tableError);
      return;
    }

    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Table accessible. Sample record structure:');
      console.log('   Fields:', Object.keys(tableInfo[0]));
      console.log('   Current status values in table:');
      
      // Get all unique status values
      const { data: statusData } = await supabaseAdmin
        .from('contact_requests')
        .select('status')
        .limit(100);
      
      if (statusData) {
        const uniqueStatuses = [...new Set(statusData.map(item => item.status))];
        console.log('   Existing statuses:', uniqueStatuses);
      }
    }

    // Test creating a contact and updating it
    console.log('\n📝 Testing contact creation and update...');
    
    // Create test contact
    const { data: newContact, error: createError } = await supabaseAdmin
      .from('contact_requests')
      .insert({
        name: 'Debug Test Contact',
        first_name: 'Debug',
        last_name: 'Test',
        email: 'debug@test.com',
        phone: '+1234567890',
        subject: 'Debug Test',
        message: 'This is a debug test contact',
        status: 'pending',
        source: 'debug_test',
        priority: 'normal'
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creating test contact:', createError);
      return;
    }

    console.log('✅ Test contact created:', newContact.id);

    // Try to update status to 'handled'
    console.log('\n🔄 Testing status update to "handled"...');
    
    const { data: updatedContact, error: updateError } = await supabaseAdmin
      .from('contact_requests')
      .update({
        status: 'handled',
        admin_notes: 'Debug test update',
        updated_at: new Date().toISOString()
      })
      .eq('id', newContact.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error updating contact status:', updateError);
      console.log('   Error details:', JSON.stringify(updateError, null, 2));
      
      // Try with different status values to see what works
      console.log('\n🔍 Testing other status values...');
      
      const testStatuses = ['pending', 'in_progress', 'archived'];
      for (const status of testStatuses) {
        const { error: testError } = await supabaseAdmin
          .from('contact_requests')
          .update({ status })
          .eq('id', newContact.id);
        
        console.log(`   Status "${status}": ${testError ? '❌ Failed' : '✅ Success'}`);
        if (testError) {
          console.log(`     Error: ${testError.message}`);
        }
      }
    } else {
      console.log('✅ Contact status updated successfully to "handled"');
      console.log('   Updated contact:', updatedContact);
    }

    // Clean up - delete test contact
    await supabaseAdmin
      .from('contact_requests')
      .delete()
      .eq('id', newContact.id);
    
    console.log('🧹 Test contact cleaned up');

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugContactStatusUpdate();