require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function verifyStorageSetup() {
  try {
    console.log('🔍 Verifying Supabase Storage Setup...\n');

    // Step 1: Check if buckets exist
    console.log('1️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return false;
    }

    const requiredBuckets = ['consultation-resumes', 'resumes', 'email-assets'];
    const existingBuckets = buckets.map(b => b.id);
    
    console.log('Available buckets:', existingBuckets);
    
    for (const bucket of requiredBuckets) {
      if (existingBuckets.includes(bucket)) {
        console.log(`✅ ${bucket} bucket exists`);
      } else {
        console.log(`❌ ${bucket} bucket missing`);
      }
    }

    // Step 2: Test consultation-resumes bucket specifically
    console.log('\n2️⃣ Testing consultation-resumes bucket...');
    
    const testContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<<\n/Size 1\n/Root 1 0 R\n>>\nstartxref\n32\n%%EOF');
    const testFileName = `verification_test_${Date.now()}.pdf`;
    
    // Test upload
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('consultation-resumes')
      .upload(testFileName, testContent, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      console.log('\n🚨 SOLUTION: Run one of these SQL scripts in Supabase:');
      console.log('   - CREATE_STORAGE_BUCKETS.sql (comprehensive setup)');
      console.log('   - SIMPLE_STORAGE_FIX.sql (quick fix)');
      return false;
    }

    console.log('✅ Upload test successful:', uploadData.path);

    // Test public URL generation
    const { data: urlData } = supabaseAdmin.storage
      .from('consultation-resumes')
      .getPublicUrl(testFileName);

    console.log('✅ Public URL generated:', urlData.publicUrl);

    // Test file listing
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('consultation-resumes')
      .list('', { limit: 10 });

    if (listError) {
      console.log('⚠️  File listing failed:', listError);
    } else {
      console.log(`✅ Found ${files.length} files in bucket`);
    }

    // Clean up test file
    const { error: deleteError } = await supabaseAdmin.storage
      .from('consultation-resumes')
      .remove([testFileName]);

    if (deleteError) {
      console.log('⚠️  Failed to clean up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('\n🎉 Storage verification completed successfully!');
    console.log('✅ PDF uploads should now work through the API');
    
    return true;

  } catch (error) {
    console.error('❌ Storage verification failed:', error);
    console.log('\n🚨 SOLUTION: Run the CREATE_STORAGE_BUCKETS.sql script in Supabase');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  verifyStorageSetup()
    .then(success => {
      if (success) {
        console.log('\n✅ All storage tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Storage setup needs attention');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyStorageSetup };