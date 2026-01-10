const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test PDF upload functionality in consultation requests
async function testPDFUpload() {
  try {
    console.log('🧪 Testing PDF Upload in Consultation Requests...\n');

    // Create a test PDF file (mock)
    const testPDFContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    // Create form data
    const formData = new FormData();
    formData.append('full_name', 'Test User PDF');
    formData.append('email', 'testpdf@example.com');
    formData.append('phone', '+1234567890');
    formData.append('linkedin_url', 'https://linkedin.com/in/testuser');
    formData.append('role_targets', 'Software Engineer, Full Stack Developer');
    formData.append('location_preferences', 'Remote, New York, San Francisco');
    formData.append('minimum_salary', '120000');
    formData.append('target_market', 'Tech Startups');
    formData.append('employment_status', 'Currently Employed');
    formData.append('package_interest', 'Tier 2');
    formData.append('area_of_concern', 'Interview preparation and salary negotiation');
    formData.append('consultation_window', 'Next 2 weeks');
    
    // Add PDF file
    formData.append('resume', testPDFContent, {
      filename: 'test-resume.pdf',
      contentType: 'application/pdf'
    });

    const baseURL = 'https://apply-bureau-backend.vercel.app';

    console.log(`📡 Sending request to: ${baseURL}/api/consultation-requests`);

    const response = await axios.post(`${baseURL}/api/consultation-requests`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    console.log('✅ PDF Upload Test Results:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.pdf_uploaded) {
      console.log('🎉 PDF upload successful!');
    } else {
      console.log('⚠️  PDF upload not confirmed in response');
    }

    return response.data;

  } catch (error) {
    console.error('❌ PDF Upload Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Test without PDF to compare
async function testWithoutPDF() {
  try {
    console.log('\n🧪 Testing Consultation Request WITHOUT PDF...\n');

    const formData = {
      full_name: 'Test User No PDF',
      email: 'testnopdf@example.com',
      phone: '+1234567890',
      linkedin_url: 'https://linkedin.com/in/testuser2',
      role_targets: 'Product Manager, Business Analyst',
      location_preferences: 'Remote, Boston',
      minimum_salary: '100000',
      target_market: 'Healthcare',
      employment_status: 'Job Seeking',
      package_interest: 'Tier 1',
      area_of_concern: 'Career transition guidance',
      consultation_window: 'Next month'
    };

    const baseURL = 'https://apply-bureau-backend.vercel.app';

    const response = await axios.post(`${baseURL}/api/consultation-requests`, formData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ No PDF Test Results:');
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
async function runTests() {
  console.log('🚀 Starting PDF Upload Tests for Apply Bureau\n');
  
  try {
    // Test 1: With PDF
    const withPDFResult = await testPDFUpload();
    
    // Test 2: Without PDF
    const withoutPDFResult = await testWithoutPDF();
    
    console.log('\n📊 Test Summary:');
    console.log('With PDF - ID:', withPDFResult.id, 'PDF Uploaded:', withPDFResult.pdf_uploaded);
    console.log('Without PDF - ID:', withoutPDFResult.id, 'PDF Uploaded:', withoutPDFResult.pdf_uploaded);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testPDFUpload, testWithoutPDF };