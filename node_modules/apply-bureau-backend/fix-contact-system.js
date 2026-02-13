require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function fixContactSystem() {
  console.log('🔧 Fixing Contact System Issues...');

  try {
    // Check current table constraints
    console.log('\n🔍 Checking contact_requests table constraints...');
    
    // Try to get constraint information (skip this for now)
    console.log('⚠️  Skipping constraint check, testing status values directly...');

    // Test what status values are currently allowed
    console.log('\n🧪 Testing allowed status values...');
    
    const testStatuses = ['pending', 'in_progress', 'handled', 'completed', 'archived', 'resolved', 'closed'];
    const allowedStatuses = [];
    
    for (const status of testStatuses) {
      // Create a test record with this status
      const { data: testRecord, error: testError } = await supabaseAdmin
        .from('contact_requests')
        .insert({
          name: 'Status Test',
          first_name: 'Status',
          last_name: 'Test',
          email: `test-${status}@example.com`,
          subject: 'Status Test',
          message: 'Testing status value',
          status: status,
          source: 'status_test',
          priority: 'normal'
        })
        .select('id')
        .single();

      if (testError) {
        console.log(`   ❌ "${status}": ${testError.message}`);
      } else {
        console.log(`   ✅ "${status}": Allowed`);
        allowedStatuses.push(status);
        
        // Clean up test record
        await supabaseAdmin
          .from('contact_requests')
          .delete()
          .eq('id', testRecord.id);
      }
    }

    console.log(`\n✅ Allowed status values: ${allowedStatuses.join(', ')}`);

    // Check if admin_notes column exists
    console.log('\n🔍 Checking for admin_notes column...');
    
    const { data: sampleRecord } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .limit(1)
      .single();

    const hasAdminNotes = sampleRecord && 'admin_notes' in sampleRecord;
    console.log(`   admin_notes column exists: ${hasAdminNotes ? '✅ Yes' : '❌ No'}`);

    // If "handled" is not allowed, we need to add it to the constraint
    if (!allowedStatuses.includes('handled')) {
      console.log('\n🔧 "handled" status is not allowed. Need to update database constraint.');
      console.log('   This requires database admin access to modify the check constraint.');
      
      // Create SQL to fix the constraint
      const fixSQL = `
-- Add 'handled' to the status check constraint
ALTER TABLE contact_requests 
DROP CONSTRAINT IF EXISTS contact_requests_status_check;

ALTER TABLE contact_requests 
ADD CONSTRAINT contact_requests_status_check 
CHECK (status IN ('pending', 'in_progress', 'handled', 'completed', 'archived'));

-- Add admin_notes column if it doesn't exist
ALTER TABLE contact_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;
`;

      console.log('\n📝 SQL to fix the contact system:');
      console.log(fixSQL);
      
      // Save the SQL to a file
      const fs = require('fs');
      fs.writeFileSync('./sql/fix_contact_system.sql', fixSQL);
      console.log('✅ SQL saved to ./sql/fix_contact_system.sql');
    }

    // If admin_notes doesn't exist, we need to add it
    if (!hasAdminNotes) {
      console.log('\n🔧 admin_notes column is missing. Need to add it to the table.');
    }

    // Test the current contact route with a working status
    console.log('\n🧪 Testing contact route with allowed status...');
    
    if (allowedStatuses.length > 1) {
      const workingStatus = allowedStatuses.find(s => s !== 'pending') || allowedStatuses[0];
      
      // Create test contact
      const { data: testContact, error: createError } = await supabaseAdmin
        .from('contact_requests')
        .insert({
          name: 'Route Test Contact',
          first_name: 'Route',
          last_name: 'Test',
          email: 'route-test@example.com',
          subject: 'Route Test',
          message: 'Testing contact route',
          status: 'pending',
          source: 'route_test',
          priority: 'normal'
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating test contact:', createError);
      } else {
        console.log(`✅ Test contact created: ${testContact.id}`);
        
        // Try to update without admin_notes
        const { data: updatedContact, error: updateError } = await supabaseAdmin
          .from('contact_requests')
          .update({
            status: workingStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', testContact.id)
          .select()
          .single();

        if (updateError) {
          console.log(`❌ Error updating to "${workingStatus}":`, updateError);
        } else {
          console.log(`✅ Successfully updated to "${workingStatus}"`);
        }

        // Clean up
        await supabaseAdmin
          .from('contact_requests')
          .delete()
          .eq('id', testContact.id);
      }
    }

  } catch (error) {
    console.error('❌ Fix script error:', error);
  }
}

// Run the fix
fixContactSystem();