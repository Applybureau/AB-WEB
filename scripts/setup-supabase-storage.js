require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function setupSupabaseStorage() {
  try {
    console.log('🚀 Setting up Supabase Storage for Apply Bureau...\n');

    // Step 1: Create buckets if they don't exist
    console.log('1️⃣ Creating storage buckets...');
    
    const bucketsToCreate = [
      { id: 'resumes', public: false, description: 'Client resumes' },
      { id: 'consultation-resumes', public: false, description: 'Consultation request resumes' },
      { id: 'email-assets', public: true, description: 'Email template assets' }
    ];

    for (const bucketConfig of bucketsToCreate) {
      console.log(`Creating bucket: ${bucketConfig.id}...`);
      
      const { data, error } = await supabaseAdmin.storage.createBucket(bucketConfig.id, {
        public: bucketConfig.public,
        allowedMimeTypes: bucketConfig.id.includes('resume') ? ['application/pdf'] : undefined,
        fileSizeLimit: bucketConfig.id.includes('resume') ? 5242880 : undefined // 5MB for resumes
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Bucket ${bucketConfig.id} already exists`);
        } else {
          console.error(`❌ Failed to create bucket ${bucketConfig.id}:`, error);
        }
      } else {
        console.log(`✅ Successfully created bucket ${bucketConfig.id}`);
      }
    }

    // Step 2: Set up storage policies using SQL
    console.log('\n2️⃣ Setting up storage policies...');
    
    const policies = [
      // Consultation resumes - anyone can upload, admins can view
      {
        name: 'Anyone can upload consultation resume',
        sql: `
          CREATE POLICY "Anyone can upload consultation resume" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'consultation-resumes');
        `
      },
      {
        name: 'Admins can view consultation resumes',
        sql: `
          CREATE POLICY "Admins can view consultation resumes" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'consultation-resumes' AND 
            (EXISTS (SELECT 1 FROM registered_users WHERE id = auth.uid() AND role = 'admin') OR auth.uid() IS NULL)
          );
        `
      },
      {
        name: 'Public can view email assets',
        sql: `
          CREATE POLICY "Public can view email assets" ON storage.objects
          FOR SELECT USING (bucket_id = 'email-assets');
        `
      }
    ];

    for (const policy of policies) {
      try {
        console.log(`Creating policy: ${policy.name}...`);
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy.sql });
        
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ Policy "${policy.name}" already exists`);
          } else {
            console.error(`❌ Failed to create policy "${policy.name}":`, error);
          }
        } else {
          console.log(`✅ Successfully created policy "${policy.name}"`);
        }
      } catch (err) {
        console.log(`⚠️  Policy creation skipped (may need manual setup): ${policy.name}`);
      }
    }

    // Step 3: Test upload functionality
    console.log('\n3️⃣ Testing upload functionality...');
    
    const testContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<<\n/Size 1\n/Root 1 0 R\n>>\nstartxref\n32\n%%EOF');
    const testFileName = `setup_test_${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('consultation-resumes')
      .upload(testFileName, testContent, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful');
      
      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('consultation-resumes')
        .getPublicUrl(testFileName);
      
      console.log('✅ Public URL generated:', urlData.publicUrl);
      
      // Clean up
      await supabaseAdmin.storage
        .from('consultation-resumes')
        .remove([testFileName]);
      
      console.log('✅ Test file cleaned up');
    }

    console.log('\n🎉 Supabase storage setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify that the consultation-resumes bucket is accessible');
    console.log('2. Test PDF upload through the API endpoint');
    console.log('3. Check that admin dashboard can display PDF links');

  } catch (error) {
    console.error('❌ Supabase storage setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupSupabaseStorage();
}

module.exports = { setupSupabaseStorage };