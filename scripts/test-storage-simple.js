// Simple storage test
require('dotenv').config();

const { supabaseAdmin } = require('../utils/supabase');

async function testStorageSimple() {
  console.log('🧪 Testing Storage Configuration');
  console.log('=' .repeat(40));

  try {
    // Test 1: List buckets
    console.log('\n1. Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabaseAdmin
      .storage
      .listBuckets();

    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return;
    }

    console.log('✅ Available buckets:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id} (public: ${bucket.public})`);
    });

    // Check for required buckets
    const requiredBuckets = ['consultation-resumes', 'resumes', 'documents'];
    const existingBuckets = buckets.map(b => b.id);
    const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));

    if (missingBuckets.length > 0) {
      console.log('❌ Missing buckets:', missingBuckets.join(', '));
      console.log('⚠️  Run COMPLETE_STORAGE_FIX.sql in Supabase SQL Editor');
    } else {
      console.log('✅ All required buckets exist');
    }

    // Test 2: Try to access consultation-resumes bucket
    console.log('\n2. Testing consultation-resumes bucket access...');
    
    const { data: files, error: fileError } = await supabaseAdmin
      .storage
      .from('consultation-resumes')
      .list();

    if (fileError) {
      console.error('❌ Cannot access consultation-resumes bucket:', fileError);
      console.log('⚠️  This might be due to missing bucket or RLS policies');
    } else {
      console.log(`✅ Can access consultation-resumes bucket (${files.length} files)`);
      if (files.length > 0) {
        console.log('   Files:');
        files.slice(0, 5).forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'unknown size'})`);
        });
      }
    }

    // Test 3: Check consultation_requests table for PDF URLs
    console.log('\n3. Checking consultation_requests for PDF data...');
    
    const { data: consultations, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, full_name, pdf_url, pdf_filename')
      .not('pdf_url', 'is', null)
      .limit(5);

    if (consultationError) {
      console.error('❌ Error checking consultations:', consultationError);
    } else {
      console.log(`✅ Found ${consultations.length} consultations with PDFs`);
      consultations.forEach(consultation => {
        console.log(`   - ${consultation.full_name}: ${consultation.pdf_filename}`);
        console.log(`     URL: ${consultation.pdf_url}`);
      });
    }

    // Test 4: Test PDF URL accessibility
    if (consultations && consultations.length > 0) {
      console.log('\n4. Testing PDF URL accessibility...');
      
      const testUrl = consultations[0].pdf_url;
      console.log(`Testing URL: ${testUrl}`);
      
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ PDF URL is accessible');
          console.log(`   Status: ${response.status}`);
          console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        } else {
          console.log(`❌ PDF URL returned status: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error accessing PDF URL:', error.message);
      }
    }

    console.log('\n' + '='.repeat(40));
    console.log('🎉 Storage Test Complete!');
    
    if (missingBuckets.length > 0) {
      console.log('\n⚠️  NEXT STEPS:');
      console.log('1. Run COMPLETE_STORAGE_FIX.sql in Supabase SQL Editor');
      console.log('2. Re-run this test to verify setup');
    } else {
      console.log('\n✅ Storage system appears to be working correctly!');
    }

  } catch (error) {
    console.error('💥 Storage test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testStorageSimple();
}

module.exports = { testStorageSimple };