const { supabaseAdmin } = require('../utils/supabase');

async function checkAndAddMessageField() {
  try {
    console.log('🔍 Checking if message field exists in consultation_requests...');
    
    // Try to select from consultation_requests to see current structure
    const { data: sample, error: sampleError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error accessing consultation_requests:', sampleError);
      return false;
    }
    
    // Check if message field exists in the sample data
    const hasMessageField = sample && sample.length > 0 && 'message' in sample[0];
    
    if (hasMessageField) {
      console.log('✅ Message field already exists in consultation_requests table');
      console.log('📋 Current fields:', Object.keys(sample[0]));
      return true;
    } else {
      console.log('⚠️  Message field does not exist in consultation_requests table');
      console.log('📋 Current fields:', sample && sample.length > 0 ? Object.keys(sample[0]) : 'No data');
      
      // The field needs to be added manually in Supabase SQL Editor
      console.log('\n📝 To add the message field, run this SQL in Supabase SQL Editor:');
      console.log('ALTER TABLE consultation_requests ADD COLUMN message TEXT;');
      console.log('\n🔧 Or add it through the Supabase dashboard table editor');
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking message field:', error.message);
    return false;
  }
}

// Run the check
if (require.main === module) {
  checkAndAddMessageField().then(success => {
    if (success) {
      console.log('✅ Message field is ready for use');
    } else {
      console.log('⚠️  Message field needs to be added manually');
    }
    process.exit(0);
  });
}

module.exports = { checkAndAddMessageField };