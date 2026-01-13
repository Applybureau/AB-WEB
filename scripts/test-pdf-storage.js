// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('../utils/supabase');
const { uploadToSupabase } = require('../utils/upload');
const fs = require('fs');
const path = require('path');

async function testPDFStorage() {
  console.log('🧪 Testing PDF Storage and RLS Setup');
  console.log('=' .repeat(50));

  try {
    // Test 1: Check bucket configuration
    console.log('\n1. Testing Bucket Configuration...');
    const { data: buckets, error: bucketError } = await supabaseAdmin
      .from('storage.buckets')
      .select('*')
      .in('id', ['consultation-resumes', 'resumes', 'documents', 'email-assets']);

    if (bucketError) {
      console.error('❌ Bucket check failed:', bucketError);
    } else {
      console.log('✅ Found buckets:', buckets.map(b => `${b.id} (public: ${b.public})`).join(', '));
    }

    // Test 2: Check RLS policies
    console.log('\n2. Testing RLS Policies...');
    const { data: policies, error: policyError } = await supabaseAdmin
      .rpc('get_storage_policies')
      .catch(() => null);

    if (policyError) {
      console.log('⚠️ Could not check policies directly, but this is normal');
    } else if (policies) {
      console.log('✅ Storage policies found:', policies.length);
    }

    // Test 3: Create a test PDF buffer
    console.log('\n3. Creating Test PDF...');
    const testPDFContent = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF for Storage) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`);

    const testFile = {
      buffer: testPDFContent,
      mimetype: 'application/pdf',
      originalname: 'test-storage.pdf'
    };

    // Test 4: Upload to consultation-resumes bucket
    console.log('\n4. Testing Upload to consultation-resumes bucket...');
    try {
      const fileName = `test_${Date.now()}_storage_test.pdf`;
      const uploadResult = await uploadToSupabase(testFile, 'consultation-resumes', fileName);
      console.log('✅ Upload successful!');
      console.log('   Path:', uploadResult.path);
      console.log('   URL:', uploadResult.url);

      // Test 5: Verify file accessibility
      console.log('\n5. Testing File Accessibility...');
      try {
        const response = await fetch(uploadResult.url);
        if (response.ok) {
          console.log('✅ PDF is publicly accessible');
          console.log('   Status:', response.status);
          console.log('   Content-Type:', response.headers.get('content-type'));
        } else {
          console.error('❌ PDF not accessible:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error('❌ Fetch test failed:', fetchError.message);
      }

      // Test 6: Test backend download
      console.log('\n6. Testing Backend Download...');
      try {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('consultation-resumes')
          .download(fileName);

        if (downloadError) {
          console.error('❌ Backend download failed:', downloadError);
        } else {
          const buffer = Buffer.from(await fileData.arrayBuffer());
          console.log('✅ Backend download successful');
          console.log('   File size:', buffer.length, 'bytes');
          console.log('   Content starts with:', buffer.toString('utf8', 0, 10));
        }
      } catch (downloadError) {
        console.error('❌ Backend download error:', downloadError.message);
      }

      // Test 7: Test consultation request integration
      console.log('\n7. Testing Consultation Request Integration...');
      try {
        const testConsultation = {
          full_name: 'Test User',
          email: 'test@example.com',
          role_targets: 'Software Engineer',
          pdf_url: uploadResult.url,
          pdf_path: uploadResult.path,
          pdf_filename: fileName,
          pdf_size: testPDFContent.length,
          status: 'pending',
          pipeline_status: 'lead'
        };

        const { data: consultation, error: consultationError } = await supabaseAdmin
          .from('consultation_requests')
          .insert(testConsultation)
          .select()
          .single();

        if (consultationError) {
          console.error('❌ Consultation creation failed:', consultationError);
        } else {
          console.log('✅ Test consultation created with PDF');
          console.log('   Consultation ID:', consultation.id);
          console.log('   PDF URL stored:', consultation.pdf_url);

          // Clean up test consultation
          await supabaseAdmin
            .from('consultation_requests')
            .delete()
            .eq('id', consultation.id);
          console.log('✅ Test consultation cleaned up');
        }
      } catch (consultationError) {
        console.error('❌ Consultation integration test failed:', consultationError.message);
      }

      // Test 8: Clean up test file
      console.log('\n8. Cleaning Up Test File...');
      try {
        const { error: deleteError } = await supabaseAdmin.storage
          .from('consultation-resumes')
          .remove([fileName]);

        if (deleteError) {
          console.error('❌ File cleanup failed:', deleteError);
        } else {
          console.log('✅ Test file cleaned up');
        }
      } catch (deleteError) {
        console.error('❌ Cleanup error:', deleteError.message);
      }

    } catch (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
    }

    // Test 9: Check existing consultation PDFs
    console.log('\n9. Checking Existing Consultation PDFs...');
    try {
      const { data: consultationsWithPDFs, error: pdfCheckError } = await supabaseAdmin
        .from('consultation_requests')
        .select('id, full_name, pdf_url, pdf_path')
        .not('pdf_url', 'is', null)
        .limit(5);

      if (pdfCheckError) {
        console.error('❌ PDF check failed:', pdfCheckError);
      } else {
        console.log(`✅ Found ${consultationsWithPDFs.length} consultations with PDFs`);
        consultationsWithPDFs.forEach((consultation, index) => {
          console.log(`   ${index + 1}. ${consultation.full_name}: ${consultation.pdf_url ? 'Has PDF URL' : 'No PDF URL'}`);
        });
      }
    } catch (pdfCheckError) {
      console.error('❌ Existing PDF check failed:', pdfCheckError.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 PDF Storage Test Complete!');
    console.log('\nIf all tests passed, your PDF storage is working correctly.');
    console.log('PDFs should now be visible in the admin dashboard.');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPDFStorage();
}

module.exports = { testPDFStorage };