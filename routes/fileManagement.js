const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      'resume': ['application/pdf'],
      'profile_picture': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    const purpose = req.body.upload_purpose || 'document';
    const allowed = allowedTypes[purpose] || allowedTypes.document;

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${purpose}. Allowed: ${allowed.join(', ')}`), false);
    }
  }
});

// POST /api/files/upload - Upload file (resume, profile picture, etc.)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { upload_purpose = 'document' } = req.body;
    const userId = req.user.userId || req.user.id;
    const userType = req.user.role === 'admin' ? 'admin' : 'client';

    // Determine storage bucket based on purpose
    const bucketMap = {
      'resume': 'resumes',
      'profile_picture': 'profile-pictures',
      'document': 'documents'
    };

    const bucket = bucketMap[upload_purpose] || 'documents';
    const fileName = `${userId}/${Date.now()}-${req.file.originalname}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Save file record to database
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from('file_uploads')
      .insert({
        user_id: userId,
        user_type: userType,
        file_name: fileName,
        original_name: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        file_url: urlData.publicUrl,
        upload_purpose
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from(bucket).remove([fileName]);
      return res.status(500).json({ error: 'Failed to save file record' });
    }

    // Update user profile if it's a resume or profile picture
    if (upload_purpose === 'resume') {
      await supabaseAdmin
        .from('clients')
        .update({ resume_url: urlData.publicUrl })
        .eq('id', userId);
    } else if (upload_purpose === 'profile_picture') {
      const table = userType === 'admin' ? 'admins' : 'clients';
      await supabaseAdmin
        .from(table)
        .update({ profile_picture_url: urlData.publicUrl })
        .eq('id', userId);
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileRecord
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /api/files - List user's files
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userType = req.user.role === 'admin' ? 'admin' : 'client';
    const { upload_purpose, limit = 20, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (upload_purpose) {
      query = query.eq('upload_purpose', upload_purpose);
    }

    const { data: files, error } = await query;

    if (error) {
      console.error('Error fetching files:', error);
      return res.status(500).json({ error: 'Failed to fetch files' });
    }

    res.json({
      files: files || [],
      total: files?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// GET /api/files/:id - Get file details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const { data: file, error } = await supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check permissions - users can only access their own files, admins can access all
    if (file.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// DELETE /api/files/:id - Delete file
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const { data: file, error: fetchError } = await supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check permissions
    if (file.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as inactive instead of deleting
    const { error: updateError } = await supabaseAdmin
      .from('file_uploads')
      .update({ is_active: false })
      .eq('id', id);

    if (updateError) {
      console.error('Error deactivating file:', updateError);
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    // Optionally remove from storage (commented out to keep files for recovery)
    // const bucketMap = {
    //   'resume': 'resumes',
    //   'profile_picture': 'profile-pictures',
    //   'document': 'documents'
    // };
    // const bucket = bucketMap[file.upload_purpose] || 'documents';
    // await supabaseAdmin.storage.from(bucket).remove([file.file_name]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// GET /api/files/client/:clientId - Admin view client files
router.get('/client/:clientId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { clientId } = req.params;
    const { upload_purpose, limit = 20, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('user_id', clientId)
      .eq('user_type', 'client')
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (upload_purpose) {
      query = query.eq('upload_purpose', upload_purpose);
    }

    const { data: files, error } = await query;

    if (error) {
      console.error('Error fetching client files:', error);
      return res.status(500).json({ error: 'Failed to fetch client files' });
    }

    res.json({
      files: files || [],
      total: files?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('List client files error:', error);
    res.status(500).json({ error: 'Failed to list client files' });
  }
});

// POST /api/files/consultation/:consultationId/attach - Attach file to consultation
router.post('/consultation/:consultationId/attach', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { consultationId } = req.params;
    const { file_upload_id, document_type = 'resume' } = req.body;

    // Verify consultation exists
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultations')
      .select('id')
      .eq('id', consultationId)
      .single();

    if (consultationError || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Verify file exists
    const { data: file, error: fileError } = await supabaseAdmin
      .from('file_uploads')
      .select('id')
      .eq('id', file_upload_id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Create consultation document link
    const { data: consultationDoc, error } = await supabaseAdmin
      .from('consultation_documents')
      .insert({
        consultation_id: consultationId,
        file_upload_id,
        document_type
      })
      .select()
      .single();

    if (error) {
      console.error('Error attaching file to consultation:', error);
      return res.status(500).json({ error: 'Failed to attach file to consultation' });
    }

    res.status(201).json({
      message: 'File attached to consultation successfully',
      consultation_document: consultationDoc
    });
  } catch (error) {
    console.error('Attach file error:', error);
    res.status(500).json({ error: 'Failed to attach file to consultation' });
  }
});

module.exports = router;