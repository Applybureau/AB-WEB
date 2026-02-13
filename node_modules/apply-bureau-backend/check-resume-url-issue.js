require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function checkResumeURLIssue() {
  try {
    console.log('Checking resume URL issue...\n');

    // Get a client with a resume
    const { data: files, error: filesError } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('file_type', 'resume')
      .eq('is_active', true)
      .limit(5);

    if (filesError) {
      console.error('Error fetching files:', filesError);
      return;
    }

    if (!files || files.length === 0) {
      console.log('No resume files found in database');
      return;
    }

    console.log(`Found ${files.length} resume file(s):\n`);

    for (const file of files) {
      console.log(`File ID: ${file.id}`);
      console.log(`Client ID: ${file.client_id}`);
      console.log(`Filename: ${file.filename}`);
      console.log(`File URL: ${file.file_url}`);
      console.log(`File Size: ${file.file_size} bytes`);
      console.log(`Uploaded: ${file.uploaded_at}`);
      
      // Try to extract the path from the URL
      if (file.file_url) {
        const urlParts = file.file_url.split('/client-files/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          console.log(`Storage Path: ${filePath}`);
          
          // Try to get a signed URL (works even if bucket is private)
          const { data: signedData, error: signedError } = await supabaseAdmin.storage
            .from('client-files')
            .createSignedUrl(filePath, 3600); // 1 hour expiry

          if (signedError) {
            console.log(`❌ Error creating signed URL: ${signedError.message}`);
          } else {
            console.log(`✓ Signed URL (1hr): ${signedData.signedUrl}`);
          }
        }
      }
      
      console.log('---\n');
    }

    // Check bucket configuration
    console.log('\n=== BUCKET CONFIGURATION ===');
    console.log('Checking if client-files bucket is public...');
    
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      const clientFilesBucket = buckets.find(b => b.name === 'client-files');
      if (clientFilesBucket) {
        console.log(`\nBucket: ${clientFilesBucket.name}`);
        console.log(`Public: ${clientFilesBucket.public}`);
        console.log(`ID: ${clientFilesBucket.id}`);
        
        if (!clientFilesBucket.public) {
          console.log('\n⚠️  ISSUE FOUND: The client-files bucket is PRIVATE');
          console.log('\nSOLUTION OPTIONS:');
          console.log('1. Make bucket public in Supabase Dashboard:');
          console.log('   - Go to Storage > client-files');
          console.log('   - Click "Make Public"');
          console.log('\n2. OR use signed URLs instead of public URLs');
          console.log('   - Update the upload endpoint to use createSignedUrl()');
        } else {
          console.log('\n✓ Bucket is public - URLs should work');
        }
      } else {
        console.log('\n❌ client-files bucket not found!');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkResumeURLIssue();
