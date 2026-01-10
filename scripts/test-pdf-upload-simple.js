const axios = require('axios');
const FormData = require('form-data');

// Simple PDF upload test with better error handling
async function testSimplePDFUpload() {
  try {
    console.log('🧪 Testing Simple PDF Upload...\n');

    // Create a very small test PDF
    const testPDFContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<<\n/Size 1\n/Root 1 0 R\n>>\nstartxref\n32\n%%EOF');
    
    // Create form data
    const formData = new FormData();
    formData.append('full_name', 'PDF Test User');
    formData.append('email', 'pdftest@example.com');
    formData.append('role_targets', 'Software Engineer');
    
    // Add a very small PDF file
    formData.append('resume', testPDFContent, {
      filename: 'test-resume.pdf',
      contentType: 'application/pdf'
    });

    const baseURL = 'https://apply-bureau-backend.vercel.app';

    console.log(`📡 Sending PDF upload request to: ${baseURL}/api/consultation-requests`);

    const response = await axios.post(`${baseURL}/api/consultation-requests`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // Increase timeout for file upload
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('✅ PDF Upload Success:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;

  } catch (error) {
    console.error('❌ PDF Upload Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Request Error:', error.message);
      console.error('Code:', error.code);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Test without PDF for comparison
async function testWithoutPDFComparison() {
  try {
    console.log('\n🧪 Testing WITHOUT PDF for comparison...\n');

    const formData = {
      full_name: 'No PDF Test User',
      email: 'nopdftest@example.com',
      role_targets: 'Product Manager'
    };

    const baseURL = 'https://apply-bureau-backend.vercel.app';

    const response = await axios.post(`${baseURL}/api/consultation-requests`, formData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ No PDF Test Success:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;

  } catch (error) {
    console.error('❌ No PDF Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Main test function
async function runSimpleTests() {
  console.log('🚀 Starting Simple PDF Upload Tests\n');
  
  try {
    // Test 1: Without PDF (should work)
    const withoutPDFResult = await testWithoutPDFComparison();
    
    // Test 2: With PDF (might fail)
    const withPDFResult = await testSimplePDFUpload();
    
    console.log('\n📊 Test Summary:');
    console.log('Without PDF - ID:', withoutPDFResult.id, 'PDF Uploaded:', withoutPDFResult.pdf_uploaded);
    console.log('With PDF - ID:', withPDFResult.id, 'PDF Uploaded:', withPDFResult.pdf_uploaded);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSimpleTests();
}

module.exports = { testSimplePDFUpload, testWithoutPDFComparison };