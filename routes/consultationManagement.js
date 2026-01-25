const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail, buildUrl } = require('../utils/email');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// GET /api/consultation-management - List all consultation requests for admin
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultation requests:', error);
      return res.status(500).json({ error: 'Failed to fetch consultation requests' });
    }

    // Format consultations for admin view
    const formattedConsultations = consultations.map(consultation => ({
      id: consultation.id,
      client_name: consultation.prospect_name || consultation.full_name,
      client_email: consultation.prospect_email || consultation.email,
      client_phone: consultation.prospect_phone || consultation.phone,
      message: consultation.message || consultation.client_reason,
      preferred_slots: consultation.preferred_slots || [],
      status: consultation.status,
      consultation_type: consultation.consultation_type,
      duration_minutes: consultation.duration_minutes,
      scheduled_at: consultation.scheduled_at,
      admin_notes: consultation.admin_notes,
      created_at: consultation.created_at,
      updated_at: consultation.updated_at
    }));

    res.json({
      consultations: formattedConsultations,
      total: consultations.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('List consultation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation requests' });
  }
});

// GET /api/consultation-management/:id - Get specific consultation request
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Format consultation for admin view
    const formattedConsultation = {
      id: consultation.id,
      client_name: consultation.prospect_name || consultation.full_name,
      client_email: consultation.prospect_email || consultation.email,
      client_phone: consultation.prospect_phone || consultation.phone,
      message: consultation.message || consultation.client_reason,
      preferred_slots: consultation.preferred_slots || [],
      status: consultation.status,
      consultation_type: consultation.consultation_type,
      duration_minutes: consultation.duration_minutes,
      scheduled_at: consultation.scheduled_at,
      admin_notes: consultation.admin_notes,
      created_at: consultation.created_at,
      updated_at: consultation.updated_at
    };

    res.json({ consultation: formattedConsultation });
  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation request' });
  }
});

// PATCH /api/consultation-management/:id - Update consultation request status
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      admin_notes, 
      admin_message,
      scheduled_at,
      meeting_link,
      meeting_details,
      selected_time_slot,
      payment_received
    } = req.body;

    // Get current consultation
    const { data: currentConsultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentConsultation) {
      return res.status(404).json({ error: 'Consultation not found or update failed' });
    }

    const updateData = {};
    
    if (status !== undefined) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
    // Remove payment_received field as it may not exist in the table
    
    updateData.updated_at = new Date().toISOString();

    // Handle time slot selection
    if (selected_time_slot !== undefined && currentConsultation.preferred_slots) {
      const slots = currentConsultation.preferred_slots;
      if (Array.isArray(slots) && slots[selected_time_slot]) {
        const selectedSlot = slots[selected_time_slot];
        updateData.scheduled_at = `${selectedSlot.date}T${selectedSlot.time}:00Z`;
        updateData.status = 'confirmed';
      }
    }

    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultations')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Update consultation error:', updateError);
      console.error('Update data:', updateData);
      console.error('Consultation ID:', id);
      return res.status(500).json({ 
        error: 'Failed to update consultation',
        details: updateError.message,
        updateData: updateData
      });
    }

    // Send appropriate email notifications based on status
    const clientEmail = updatedConsultation.prospect_email || updatedConsultation.email;
    const clientName = updatedConsultation.prospect_name || updatedConsultation.full_name;

    try {
      switch (status) {
        case 'confirmed':
          await sendEmail(clientEmail, 'consultation_confirmed', {
            client_name: clientName,
            consultation_date: new Date(updatedConsultation.scheduled_at).toLocaleDateString(),
            consultation_time: new Date(updatedConsultation.scheduled_at).toLocaleTimeString(),
            meeting_link: updatedConsultation.meeting_link,
            meeting_details: meeting_details || 'Your consultation has been confirmed.',
            admin_message: admin_message,
            current_year: new Date().getFullYear()
          });
          break;
        
        case 'awaiting_new_times':
          await sendEmail(clientEmail, 'consultation_reschedule_request', {
            client_name: clientName,
            admin_message: admin_message || 'We need to reschedule your consultation. Please provide new availability that works for you.',
            reason: req.body.reason || 'Schedule conflict',
            new_proposed_times: req.body.new_proposed_times,
            new_date_time: req.body.new_date_time,
            reschedule_link: buildUrl(`/consultation/reschedule/${id}`),
            current_year: new Date().getFullYear()
          });
          break;
        
        case 'completed':
          await sendEmail(clientEmail, 'consultation_completed', {
            client_name: clientName,
            admin_message: admin_message || 'Thank you for your consultation. We will be in touch soon.',
            next_steps: 'Our team will follow up with next steps based on your consultation.',
            current_year: new Date().getFullYear()
          });
          break;
        
        case 'payment_received':
          await sendEmail(clientEmail, 'payment_confirmed_welcome_concierge', {
            client_name: clientName,
            admin_message: admin_message || 'Payment received. Welcome to Apply Bureau!',
            next_steps: 'You will receive registration details shortly.',
            current_year: new Date().getFullYear()
          });
          break;
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the update if email fails
    }

    // Create notification for status changes
    if (status && status !== currentConsultation.status) {
      try {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: updatedConsultation.client_id,
            type: `consultation_${status}`,
            title: `Consultation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: admin_message || `Your consultation status has been updated to ${status}`,
            data: JSON.stringify({
              consultation_id: updatedConsultation.id,
              status: status,
              scheduled_at: updatedConsultation.scheduled_at
            }),
            priority: status === 'confirmed' ? 'high' : 'medium'
          });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }
    }

    // Format response
    const formattedConsultation = {
      id: updatedConsultation.id,
      client_name: updatedConsultation.prospect_name || updatedConsultation.full_name,
      client_email: updatedConsultation.prospect_email || updatedConsultation.email,
      client_phone: updatedConsultation.prospect_phone || updatedConsultation.phone,
      message: updatedConsultation.message || updatedConsultation.client_reason,
      preferred_slots: updatedConsultation.preferred_slots || [],
      status: updatedConsultation.status,
      consultation_type: updatedConsultation.consultation_type,
      duration_minutes: updatedConsultation.duration_minutes,
      scheduled_at: updatedConsultation.scheduled_at,
      admin_notes: updatedConsultation.admin_notes,
      meeting_link: updatedConsultation.meeting_link,
      created_at: updatedConsultation.created_at,
      updated_at: updatedConsultation.updated_at
    };

    res.json({
      message: 'Consultation updated successfully',
      consultation: formattedConsultation
    });
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({ error: 'Failed to update consultation' });
  }
});

// POST /api/consultation-management/:id/confirm-time - Confirm specific time slot
router.post('/:id/confirm-time', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      selected_time_slot, 
      meeting_details, 
      meeting_link, 
      meeting_type = 'video_call',
      admin_notes 
    } = req.body;

    // Get consultation
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Validate time slot selection
    const slots = consultation.preferred_slots || [];
    if (!Array.isArray(slots) || !slots[selected_time_slot]) {
      return res.status(400).json({ error: 'Invalid time slot selection' });
    }

    const selectedSlot = slots[selected_time_slot];
    const scheduledDateTime = `${selectedSlot.date}T${selectedSlot.time}:00Z`;

    // Update consultation with confirmed time
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultations')
      .update({
        status: 'confirmed',
        scheduled_at: scheduledDateTime,
        meeting_link: meeting_link,
        meeting_type: meeting_type,
        admin_notes: admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to confirm consultation time' });
    }

    // Send confirmation email
    const clientEmail = updatedConsultation.prospect_email || updatedConsultation.email;
    const clientName = updatedConsultation.prospect_name || updatedConsultation.full_name;

    try {
      await sendEmail(clientEmail, 'consultation_confirmed', {
        client_name: clientName,
        consultation_date: new Date(scheduledDateTime).toLocaleDateString(),
        consultation_time: new Date(scheduledDateTime).toLocaleTimeString(),
        meeting_link: meeting_link,
        meeting_details: meeting_details || 'Your consultation has been confirmed.',
        meeting_type: meeting_type,
        current_year: new Date().getFullYear()
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({
      message: 'Consultation time confirmed successfully',
      consultation: {
        id: updatedConsultation.id,
        status: updatedConsultation.status,
        scheduled_at: updatedConsultation.scheduled_at,
        meeting_link: updatedConsultation.meeting_link,
        selected_slot: selectedSlot
      }
    });
  } catch (error) {
    console.error('Confirm consultation time error:', error);
    res.status(500).json({ error: 'Failed to confirm consultation time' });
  }
});

// POST /api/consultation-management/:id/request-new-times - Admin requests new availability
router.post('/:id/request-new-times', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_message, reason } = req.body;

    // Get consultation
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Update status to awaiting new times
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultations')
      .update({
        status: 'awaiting_new_times',
        admin_notes: reason || 'Admin requested new availability',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to request new times' });
    }

    // Send email to client requesting new times
    const clientEmail = updatedConsultation.prospect_email || updatedConsultation.email;
    const clientName = updatedConsultation.prospect_name || updatedConsultation.full_name;

    try {
      await sendEmail(clientEmail, 'consultation_reschedule_request', {
        client_name: clientName,
        admin_message: admin_message || 'We need to reschedule your consultation. Please provide new availability that works for you.',
        reason: reason || 'Schedule conflict',
        new_proposed_times: req.body.new_proposed_times,
        new_date_time: req.body.new_date_time,
        reschedule_link: buildUrl(`/consultation/reschedule/${id}`),
        current_year: new Date().getFullYear()
      });
    } catch (emailError) {
      console.error('Failed to send reschedule request email:', emailError);
    }

    res.json({
      message: 'New availability requested successfully',
      consultation: {
        id: updatedConsultation.id,
        status: updatedConsultation.status,
        admin_message: admin_message
      }
    });
  } catch (error) {
    console.error('Request new times error:', error);
    res.status(500).json({ error: 'Failed to request new availability' });
  }
});

// DELETE /api/consultation-management/:id - Cancel/reject consultation
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, admin_message } = req.body;

    // Get consultation
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Update status to rejected instead of deleting
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultations')
      .update({
        status: 'rejected',
        admin_notes: reason || 'Consultation rejected by admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to reject consultation' });
    }

    // Send rejection email
    const clientEmail = updatedConsultation.prospect_email || updatedConsultation.email;
    const clientName = updatedConsultation.prospect_name || updatedConsultation.full_name;

    try {
      await sendEmail(clientEmail, 'consultation_rejected', {
        client_name: clientName,
        admin_message: admin_message || 'Unfortunately, we cannot accommodate your consultation request at this time.',
        reason: reason || 'Unable to accommodate request'
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.json({
      message: 'Consultation rejected successfully',
      consultation: {
        id: updatedConsultation.id,
        status: updatedConsultation.status,
        reason: reason
      }
    });
  } catch (error) {
    console.error('Reject consultation error:', error);
    res.status(500).json({ error: 'Failed to reject consultation' });
  }
});

module.exports = router;