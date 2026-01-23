const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin, requireClient } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'resume': ['application/pdf'],
    'profile_picture': ['image/jpeg', 'image/png', 'image/jpg'],
    'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'portfolio': ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  };

  const uploadPurpose = req.body.upload_purpose || 'document';
  const allowed = allowedTypes[uploadPurpose] || allowedTypes['document'];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${uploadPurpose}. Allowed: ${allowed.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/files/upload - Upload file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const userType = req.user.role === 'admin' ? 'admin' : 'client';
    const { upload_purpose = 'document' } = req.body;

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${userId}_${upload_purpose}_${Date.now()}${fileExtension}`;
    const bucketName = upload_purpose === 'profile_picture' ? 'profile-pictures' : 'documents';

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
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
        upload_purpose: upload_purpose,
        uploaded_by: userId
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabaseAdmin.storage.from(bucketName).remove([fileName]);
      return res.status(500).json({ error: 'Failed to save file record' });
    }

    // Update user profile if needed
    if (upload_purpose === 'resume') {
      const table = userType === 'admin' ? 'admins' : 'clients';
      await supabaseAdmin
        .from(table)
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
      id: fileRecord.id,
      file_name: fileRecord.file_name,
      original_name: fileRecord.original_name,
      file_url: fileRecord.file_url,
      file_size: fileRecord.file_size,
      upload_purpose: fileRecord.upload_purpose,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /api/files - List user's files
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'admin' ? 'admin' : 'client';
    const { upload_purpose, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (upload_purpose) {
      query = query.eq('upload_purpose', upload_purpose);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: files, error, count } = await query;

    if (error) {
      console.error('Error fetching files:', error);
      return res.status(500).json({ error: 'Failed to fetch files' });
    }

    res.json({
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// GET /api/files/:id - Get file details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const { data: file, error } = await supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check permissions
    if (!isAdmin && file.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(file);
  } catch (error) {
    console.error('File details error:', error);
    res.status(500).json({ error: 'Failed to get file details' });
  }
});

// DELETE /api/files/:id - Delete file
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get file details
    const { data: file, error: fetchError } = await supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check permissions
    if (!isAdmin && file.uploaded_by !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as inactive instead of deleting
    const { error: updateError } = await supabaseAdmin
      .from('file_uploads')
      .update({ is_active: false })
      .eq('id', id);

    if (updateError) {
      console.error('Error marking file as inactive:', updateError);
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// GET /api/files/client/:clientId - Admin: Get client's files
router.get('/client/:clientId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { upload_purpose, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('user_id', clientId)
      .eq('user_type', 'client')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (upload_purpose) {
      query = query.eq('upload_purpose', upload_purpose);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: files, error, count } = await query;

    if (error) {
      console.error('Error fetching client files:', error);
      return res.status(500).json({ error: 'Failed to fetch client files' });
    }

    res.json({
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Client files error:', error);
    res.status(500).json({ error: 'Failed to fetch client files' });
  }
});

// POST /api/files/consultation/:consultationId/attach - Attach file to consultation
router.post('/consultation/:consultationId/attach', authenticateToken, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { file_upload_id, document_type = 'general' } = req.body;

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
      id: consultationDoc.id,
      message: 'File attached to consultation successfully'
    });
  } catch (error) {
    console.error('Consultation file attach error:', error);
    res.status(500).json({ error: 'Failed to attach file to consultation' });
  }
});

module.exports = router;