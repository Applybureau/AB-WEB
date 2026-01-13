const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// GET /api/pdf/:consultationId - Serve PDF for embedding
router.get('/:consultationId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { consultationId } = req.params;

    // Get consultation with PDF info
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('pdf_url, pdf_path, pdf_filename, full_name')
      .eq('id', consultationId)
      .single();

    if (consultationError || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    if (!consultation.pdf_url && !consultation.pdf_path) {
      return res.status(404).json({ error: 'No PDF found for this consultation' });
    }

    try {
      // Try to get PDF from storage
      let pdfBuffer;
      
      if (consultation.pdf_path) {
        // Get PDF from Supabase storage
        const { data: fileData, error: fileError } = await supabaseAdmin.storage
          .from('consultation-resumes')
          .download(consultation.pdf_path);

        if (fileError) {
          console.error('Storage download error:', fileError);
          return res.status(404).json({ error: 'PDF file not accessible' });
        }

        pdfBuffer = Buffer.from(await fileData.arrayBuffer());
      } else if (consultation.pdf_url) {
        // Try to fetch from URL
        const response = await fetch(consultation.pdf_url);
        if (!response.ok) {
          return res.status(404).json({ error: 'PDF file not accessible' });
        }
        pdfBuffer = Buffer.from(await response.arrayBuffer());
      }

      // Set proper headers for PDF embedding
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${consultation.pdf_filename || 'resume.pdf'}"`);
      res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
      res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow embedding in same origin
      
      // Send PDF buffer
      res.send(pdfBuffer);

    } catch (storageError) {
      console.error('PDF retrieval error:', storageError);
      res.status(500).json({ error: 'Failed to retrieve PDF' });
    }

  } catch (error) {
    console.error('PDF viewer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/pdf/:consultationId/info - Get PDF info without downloading
router.get('/:consultationId/info', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('pdf_url, pdf_filename, pdf_size, full_name, created_at')
      .eq('id', consultationId)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json({
      has_pdf: !!(consultation.pdf_url),
      filename: consultation.pdf_filename,
      size: consultation.pdf_size,
      client_name: consultation.full_name,
      uploaded_at: consultation.created_at,
      embed_url: consultation.pdf_url ? `/api/pdf/${consultationId}` : null
    });

  } catch (error) {
    console.error('PDF info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;