require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function testRealApplicationCreation() {
  console.log('🧪 Testing Real Application Creation...\n');

  // First, get a real client ID
  console.log('🔍 Finding a client...');
  const { data: clients, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('id, full_name, email')
    .limit(1);

  if (clientError || !clients || clients.length === 0) {
    console.error('❌ No clients found:', clientError);
    return;
  }

  const client = clients[0];
  console.log('✅ Found client:', client.full_name, `(${client.email})`);
  console.log('\n');

  // Test data matching the fixed schema
  const testData = {
    client_id: client.id,
    applied_by_admin: true, // Boolean field
    job_title: 'Senior Software Engineer',
    company: 'TechCorp Inc.',
    title: 'TechCorp Inc. - Senior Software Engineer', // Required field
    description: 'Full stack development role with React and Node.js',
    job_url: 'https://example.com/job/12345',
    offer_salary_min: 150000,
    offer_salary_max: 200000,
    type: 'full-time',
    application_strategy: 'Direct application through company website',
    admin_notes: 'Test application - strong match for client background',
    status: 'applied',
    date_applied: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('📝 Test Data:', JSON.stringify(testData, null, 2));
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
  } else {
    console.log('✅ Application created successfully!');
    console.log('Application ID:', application.id);
    console.log('Client ID:', application.client_id);
    console.log('Company:', application.company);
    console.log('Job Title:', application.job_title);
    console.log('Status:', application.status);
    
    // Clean up
    console.log('\n🧹 Cleaning up test application...');
    await supabaseAdmin.from('applications').delete().eq('id', application.id);
    console.log('✅ Test application deleted');
  }
}

testRealApplicationCreation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
