const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { validate, schemas } = require('../utils/validation');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// GET /api/consultations - List consultations for client
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId || req.user.id;
    if (!clientId) {
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }
    
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultations:', error);
      return res.status(500).json({ error: 'Failed to fetch consultations' });
    }

    res.json({
      consultations: consultations || [],
      total: consultations?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Consultations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// POST /api/consultations - Admin creates consultation
router.post('/', authenticateToken, requireAdmin, validate(schemas.consultation), async (req, res) => {
  try {
    const { client_id, scheduled_at, notes, admin_notes } = req.body;
    const finalNotes = admin_notes || notes; // Support both field names

    // Verify client exists
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Create consultation
    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert({
        client_id,
        scheduled_at,
        admin_notes: finalNotes,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation:', error);
      return res.status(500).json({ error: 'Failed to create consultation' });
    }

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: client_id,
        user_type: 'client',
        type: 'consultation_scheduled',
        title: 'Consultation Scheduled',
        message: `Your consultation has been scheduled for ${new Date(scheduled_at).toLocaleString()}`,
        is_read: false
      });

    // Send email notification
    try {
      const scheduledDate = new Date(scheduled_at);
      await sendEmail(client.email, 'consultation_scheduled', {
        client_name: client.full_name,
        consultation_date: scheduledDate.toLocaleDateString(),
        consultation_time: scheduledDate.toLocaleTimeString(),
        consultation_type: 'Career Advisory Session',
        consultation_notes: finalNotes
      });
      console.log('✅ Consultation email sent to:', client.email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Don't fail the consultation creation if email fails
    }

    res.status(201).json({
      message: 'Consultation created successfully',
      consultation
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ error: 'Failed to create consultation' });
  }
});

// GET /api/consultations/:id - Get specific consultation
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;

    let query = supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id);

    // Non-admin users can only see their own consultations
    if (req.user.role !== 'admin') {
      const clientId = req.user.userId || req.user.id;
      query = query.eq('client_id', clientId);
    }

    const { data: consultation, error } = await query.single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    res.json({ consultation });
  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation' });
  }
});

// PATCH /api/consultations/:id - Update consultation
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_at, notes, status } = req.body;

    const updateData = {};
    if (scheduled_at) updateData.scheduled_at = scheduled_at;
    if (notes !== undefined) updateData.admin_notes = notes;
    if (status) updateData.status = status;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .update(updateData)
      .eq('id', id)
      .select('*, clients(full_name, email)')
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // If rescheduled, send notification
    if (scheduled_at) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: consultation.client_id,
          user_type: 'client',
          type: 'consultation_rescheduled',
          title: 'Consultation Rescheduled',
          message: `Your consultation has been rescheduled to ${new Date(scheduled_at).toLocaleString()}`,
          is_read: false
        });

      // Send email notification
      const scheduledDate = new Date(scheduled_at);
      await sendEmail(consultation.clients.email, 'consultation_scheduled', {
        client_name: consultation.clients.full_name,
        consultation_date: scheduledDate.toLocaleDateString(),
        consultation_time: scheduledDate.toLocaleTimeString(),
        consultation_type: 'Career Advisory Session (Rescheduled)',
        consultation_notes: consultation.admin_notes
      });
    }

    res.json({
      message: 'Consultation updated successfully',
      consultation
    });
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({ error: 'Failed to update consultation' });
  }
});

// DELETE /api/consultations/:id - Cancel consultation
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get consultation details before deletion
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select('*, clients(full_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Update status to cancelled instead of deleting
    const { error } = await supabaseAdmin
      .from('consultations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling consultation:', error);
      return res.status(500).json({ error: 'Failed to cancel consultation' });
    }

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: consultation.client_id,
        user_type: 'client',
        type: 'consultation_cancelled',
        title: 'Consultation Cancelled',
        message: `Your consultation scheduled for ${new Date(consultation.scheduled_at).toLocaleString()} has been cancelled`,
        is_read: false
      });

    res.json({ message: 'Consultation cancelled successfully' });
  } catch (error) {
    console.error('Cancel consultation error:', error);
    res.status(500).json({ error: 'Failed to cancel consultation' });
  }
});

module.exports = router;