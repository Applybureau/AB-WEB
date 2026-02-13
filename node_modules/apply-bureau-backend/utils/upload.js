const multer = require('multer');
const path = require('path');
const { supabaseAdmin } = require('./supabase');

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow only PDF files for resumes
  if (file.fieldname === 'resume') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resumes'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (increased from 5MB)
  }
});

const uploadToSupabase = async (file, bucket, filePath) => {
  try {
    // Check if bucket exists first
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error('Storage service unavailable');
    }
    
    const bucketExists = buckets.some(b => b.name === bucket);
    if (!bucketExists) {
      throw new Error(`Storage bucket '${bucket}' does not exist`);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Upload to Supabase failed:', error);
    throw error;
  }
};

const deleteFromSupabase = async (bucket, filePath) => {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Delete from Supabase failed:', error);
    throw error;
  }
};

const downloadFromSupabase = async (bucket, filePath) => {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      console.error('Supabase download error:', error);
      throw error;
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer());
    
    return {
      buffer: buffer,
      contentType: 'application/pdf',
      size: buffer.length
    };
  } catch (error) {
    console.error('Download from Supabase failed:', error);
    throw error;
  }
};

const updateFileInSupabase = async (bucket, filePath, buffer, contentType = 'application/pdf') => {
  try {
    // Delete existing file first
    await deleteFromSupabase(bucket, filePath);
    
    // Upload updated file
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Update file in Supabase failed:', error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadToSupabase,
  deleteFromSupabase,
  downloadFromSupabase,
  updateFileInSupabase
};