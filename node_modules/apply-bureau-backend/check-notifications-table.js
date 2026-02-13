require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function checkNotifications() {
  console.log('🔍 Checking notifications table...\n');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ notifications table does NOT exist or error:', error.message);
      console.log('\n💡 Need to create notifications table');
      return;
    }
    
    console.log('✅ notifications table EXISTS');
    
    if (data && data.length > 0) {
      console.log('\n📊 Columns:');
      Object.keys(data[0]).forEach(col => {
        console.log(`   • ${col}: ${typeof data[0][col]}`);
      });
    } else {
      console.log('\n⚠️  Table is empty');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkNotifications()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
