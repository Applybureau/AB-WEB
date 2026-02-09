require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function testApplicationCreation() {
  console.log('🧪 Testing Application Creation...\n');

  // Test data
  const testData = {
    client_id: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
    job_title: 'Test Software Engineer',
    company: 'Test Company Inc.',
    job_description: 'Test job description',
    job_url: 'https://example.com/job',
    salary_range: '$100k-$150k',
    location: 'Remote',
    job_type: 'full-time',
    application_method: 'online',
    application_strategy: 'Direct application',
    admin_notes: 'Test application',
    status: 'applied',
    date_applied: new Date().toISOString()
  };

  console.log('📝 Test Data:', JSON.stringify(testData, null, 2));
  console.log('\n');

  // First, check the applications table schema
  console.log('🔍 Checking applications table schema...');
  const { data: schemaData, error: schemaError } = await supabaseAdmin
    .from('applications')
    .select('*')
    .limit(1);

  if (schemaError) {
    console.error('❌ Error checking schema:', schemaError);
  } else {
    console.log('✅ Schema check successful');
    if (schemaData && schemaData.length > 0) {
      console.log('📋 Available columns:', Object.keys(schemaData[0]));
    }
  }
  console.log('\n');

  // Try to create application
  console.log('🚀 Attempting to create application...');
  const { data: application, error } = await supabaseAdmin
    .from('applications')
    .insert(testData)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating application:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
    console.error('Error Hint:', error.hint);
    
    // Try with minimal data
    console.log('\n🔄 Retrying with minimal data...');
    const minimalData = {
      client_id: testData.client_id,
      status: 'applied',
      created_at: new Date().toISOString()
    };
    
    const { data: minApp, error: minError } = await supabaseAdmin
      .from('applications')
      .insert(minimalData)
      .select()
      .single();
    
    if (minError) {
      console.error('❌ Minimal insert also failed:', minError.message);
    } else {
      console.log('✅ Minimal insert succeeded!');
      console.log('Application ID:', minApp.id);
      
      // Clean up
      await supabaseAdmin.from('applications').delete().eq('id', minApp.id);
      console.log('🧹 Test application deleted');
    }
  } else {
    console.log('✅ Application created successfully!');
    console.log('Application ID:', application.id);
    console.log('Application Data:', JSON.stringify(application, null, 2));
    
    // Clean up
    await supabaseAdmin.from('applications').delete().eq('id', application.id);
    console.log('🧹 Test application deleted');
  }
}

testApplicationCreation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
