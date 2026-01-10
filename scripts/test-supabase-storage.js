require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function testSupabaseStorage() {
  try {
    console.log('🧪 Testing Supabase Storage Configuration...\n');

    // Test 1: List all buckets
    console.log('1️⃣ Listing all storage buckets...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.id} (${bucket.public ? 'public' : 'private'})`);
    });

    // Test 2: Check if consultation-resumes bucket exists
    console.log('\n2️⃣ Checking consultation-resumes bucket...');
    const consultationBucket = buckets.find(b => b.id === 'consultation-resumes');
    
    if (!consultationBucket) {
      console.log('❌ consultation-resumes bucket does not exist!');
      
      // Try to create it
      console.log('3️⃣ Attempting to create consultation-resumes bucket...');
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('consultation-resumes', {
        public: false,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
      } else {
        console.log('✅ Successfully created consultation-resumes bucket');
      }
    } else {
      console.log('✅ consultation-resumes bucket exists');
    }

    // Test 3: Try to upload a test file
    console.log('\n4️⃣ Testing file upload...');
    const testContent = Buffer.from('%PDF-1.4\ntest');
    const testFileName = `test_${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('consultation-resumes')
      .upload(testFileName, testContent, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful:', uploadData.path);
      
      // Test 4: Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('consultation-resumes')
        .getPublicUrl(testFileName);
      
      console.log('✅ Public URL generated:', urlData.publicUrl);
      
      // Test 5: Clean up test file
      const { error: deleteError } = await supabaseAdmin.storage
        .from('consultation-resumes')
        .remove([testFileName]);
      
      if (deleteError) {
        console.log('⚠️  Failed to clean up test file:', deleteError);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }

    console.log('\n✅ Supabase storage test completed!');

  } catch (error) {
    console.error('❌ Supabase storage test failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  testSupabaseStorage();
}

module.exports = { testSupabaseStorage };