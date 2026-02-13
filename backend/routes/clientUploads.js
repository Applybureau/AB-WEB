const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireClient } = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow resume files (PDF, DOC, DOCX)
    if (file.fieldname === 'resume') {
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExt = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(fileExt)) {
        cb(null, true);
      } else {
        cb(new Error('Resume must be PDF, DOC, or DOCX format'));
      }
    } else {
      cb(new Error('Invalid file field'));
    }
  }
});

// POST /api/client/uploads/resume - Upload resume (CLIENT)
router.post('/resume', authenticateToken, requireClient, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file provided' });
    }

    const clientId = req.user.id;
    const file = req.file;
    const fileName = `resumes/${clientId}/${Date.now()}_${file.originalname}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('client-files')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Resume upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload resume' });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('client-files')
      .getPublicUrl(fileName);

    const resumeUrl = urlData.publicUrl;

    // Save to client_files table
    const { error: fileError } = await supabaseAdmin
      .from('client_files')
      .insert({
        client_id: clientId,
        file_type: 'resume',
        filename: file.originalname,
        file_url: resumeUrl,
        file_size: file.size,
        mime_type: file.mimetype,
        is_active: true,
        uploaded_at: new Date().toISOString()
      });

    if (fileError) {
      console.error('Error saving file record:', fileError);
      return res.status(500).json({ error: 'Failed to save resume information' });
    }

    // Also update clients table for backward compatibility
    await supabaseAdmin
      .from('clients')
      .update({
        resume_url: resumeUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    res.json({
      message: 'Resume uploaded successfully',
      resume_url: resumeUrl,
      file_name: file.originalname,
      file_size: file.size
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// POST /api/client/uploads/linkedin - Add LinkedIn profile URL (CLIENT)
router.post('/linkedin', authenticateToken, requireClient, async (req, res) => {
  try {
    const { linkedin_url } = req.body;
    const clientId = req.user.id;

    if (!linkedin_url) {
      return res.status(400).json({ error: 'LinkedIn URL is required' });
    }

    // Basic LinkedIn URL validation
    const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    if (!linkedinRegex.test(linkedin_url)) {
      return res.status(400).json({ 
        error: 'Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)' 
      });
    }

    // Save to client_files table
    const { error: fileError } = await supabaseAdmin
      .from('client_files')
      .insert({
        client_id: clientId,
        file_type: 'linkedin',
        url: linkedin_url,
        is_active: true,
        uploaded_at: new Date().toISOString()
      });

    if (fileError) {
      console.error('Error saving LinkedIn URL:', fileError);
      return res.status(500).json({ error: 'Failed to save LinkedIn URL' });
    }

    // Also update clients table for backward compatibility
    await supabaseAdmin
      .from('clients')
      .update({
        linkedin_url: linkedin_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    res.json({
      message: 'LinkedIn profile URL added successfully',
      linkedin_url: linkedin_url
    });
  } catch (error) {
    console.error('LinkedIn URL error:', error);
    res.status(500).json({ error: 'Failed to add LinkedIn URL' });
  }
});

// POST /api/client/uploads/portfolio - Add portfolio/website/GitHub URLs (CLIENT)
router.post('/portfolio', authenticateToken, requireClient, async (req, res) => {
  try {
    const { portfolio_urls } = req.body;
    const clientId = req.user.id;

    if (!portfolio_urls || !Array.isArray(portfolio_urls)) {
      return res.status(400).json({ error: 'Portfolio URLs must be provided as an array' });
    }

    if (portfolio_urls.length === 0) {
      return res.status(400).json({ error: 'At least one portfolio URL is required' });
    }

    if (portfolio_urls.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 portfolio URLs allowed' });
    }

    // Validate URLs
    const urlRegex = /^https?:\/\/.+/;
    for (const url of portfolio_urls) {
      if (!urlRegex.test(url)) {
        return res.status(400).json({ 
          error: `Invalid URL format: ${url}. URLs must start with http:// or https://` 
        });
      }
    }

    // Save each portfolio URL to client_files table
    const fileInserts = portfolio_urls.map(url => ({
      client_id: clientId,
      file_type: 'portfolio',
      url: url,
      is_active: true,
      uploaded_at: new Date().toISOString()
    }));

    const { error: fileError } = await supabaseAdmin
      .from('client_files')
      .insert(fileInserts);

    if (fileError) {
      console.error('Error saving portfolio URLs:', fileError);
      return res.status(500).json({ error: 'Failed to save portfolio URLs' });
    }

    // Also update clients table for backward compatibility
    await supabaseAdmin
      .from('clients')
      .update({
        portfolio_url: portfolio_urls[0], // Store first URL in clients table
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    res.json({
      message: 'Portfolio URLs added successfully',
      portfolio_urls: portfolio_urls,
      count: portfolio_urls.length
    });
  } catch (error) {
    console.error('Portfolio URLs error:', error);
    res.status(500).json({ error: 'Failed to add portfolio URLs' });
  }
});

// GET /api/client/uploads/status - Get upload status (CLIENT)
router.get('/status', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: files, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching upload status:', error);
      return res.status(500).json({ error: 'Failed to get upload status' });
    }

    const resumeFile = files?.find(f => f.file_type === 'resume');
    const linkedinFile = files?.find(f => f.file_type === 'linkedin');
    const portfolioFiles = files?.filter(f => f.file_type === 'portfolio') || [];

    res.json({
      resume: {
        uploaded: !!resumeFile,
        url: resumeFile?.file_url,
        filename: resumeFile?.filename
      },
      linkedin: {
        added: !!linkedinFile,
        url: linkedinFile?.url
      },
      portfolio: {
        added: portfolioFiles.length > 0,
        urls: portfolioFiles.map(f => f.url),
        count: portfolioFiles.length
      }
    });
  } catch (error) {
    console.error('Upload status error:', error);
    res.status(500).json({ error: 'Failed to get upload status' });
  }
});

// DELETE /api/client/uploads/resume - Delete resume (CLIENT)
router.delete('/resume', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get resume file record
    const { data: resumeFile, error: fetchError } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .eq('file_type', 'resume')
      .eq('is_active', true)
      .single();

    if (fetchError || !resumeFile) {
      return res.status(404).json({ error: 'No resume found to delete' });
    }

    // Delete from storage if file_url exists
    if (resumeFile.file_url) {
      const fileName = resumeFile.file_url.split('/').pop();
      const { error: deleteError } = await supabaseAdmin.storage
        .from('client-files')
        .remove([`resumes/${clientId}/${fileName}`]);

      if (deleteError) {
        console.error('Error deleting resume from storage:', deleteError);
      }
    }

    // Mark file as inactive (soft delete)
    const { error: updateError } = await supabaseAdmin
      .from('client_files')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', resumeFile.id);

    if (updateError) {
      console.error('Error marking resume as deleted:', updateError);
      return res.status(500).json({ error: 'Failed to delete resume' });
    }

    // Also update clients table
    await supabaseAdmin
      .from('clients')
      .update({
        resume_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    res.json({
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Resume deletion error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;