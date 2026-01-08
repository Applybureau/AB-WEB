const { supabaseAdmin } = require('../utils/supabase');
const fs = require('fs');
const path = require('path');

async function applyConsultationSchema() {
  try {
    console.log('🔧 Applying consultation requests schema...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'WEBSITE_CONSULTATION_SCHEMA.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Error applying schema:', error);
      return;
    }
    
    console.log('✅ Schema applied successfully');
    
    // Test if tables exist
    console.log('\n🔍 Checking if tables were created...');
    
    const { data: consultationRequests, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('count(*)')
      .limit(1);
    
    if (consultationError) {
      console.error('❌ consultation_requests table not found:', consultationError.message);
    } else {
      console.log('✅ consultation_requests table exists');
    }
    
    const { data: contactSubmissions, error: contactError } = await supabaseAdmin
      .from('contact_submissions')
      .select('count(*)')
      .limit(1);
    
    if (contactError) {
      console.error('❌ contact_submissions table not found:', contactError.message);
    } else {
      console.log('✅ contact_submissions table exists');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply schema:', error);
  }
}

applyConsultationSchema();