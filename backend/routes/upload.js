const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');
const { upload, uploadToSupabase, deleteFromSupabase } = require('../utils/upload');

const router = express.Router();

// POST /api/upload/resume - Upload client resume
router.post('/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const clientId = req.user.id;
    const fileName = `${clientId}/resume_${Date.now()}.pdf`;

    // Upload to Supabase storage
    const uploadResult = await uploadToSupabase(req.file, 'resumes', fileName);

    // Update client record with resume URL
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update({ resume_url: uploadResult.url })
      .eq('id', clientId)
      .select('id, resume_url')
      .single();

    if (error) {
      console.error('Error updating client resume URL:', error);
      // Try to clean up uploaded file
      await deleteFromSupabase('resumes', uploadResult.path);
      return res.status(500).json({ error: 'Failed to update resume URL' });
    }

    res.json({
      message: 'Resume uploaded successfully',
      resume_url: client.resume_url,
      file_path: uploadResult.path
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// DELETE /api/upload/resume - Delete client resume
router.delete('/resume', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get current resume URL
    const { data: client, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select('resume_url')
      .eq('id', clientId)
      .single();

    if (fetchError || !client || !client.resume_url) {
      return res.status(404).json({ error: 'No resume found' });
    }

    // Extract file path from URL
    const url = new URL(client.resume_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(-2).join('/'); // Get last two parts (clientId/filename)

    // Delete from storage
    await deleteFromSupabase('resumes', filePath);

    // Update client record
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ resume_url: null })
      .eq('id', clientId);

    if (error) {
      console.error('Error updating client resume URL:', error);
      return res.status(500).json({ error: 'Failed to update resume URL' });
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Resume delete error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;