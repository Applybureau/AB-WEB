const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail, buildUrl } = require('../utils/email');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// POST /api/public-consultations - Simplified public consultation request (CONCIERGE MODEL)
router.post('/', async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      message, // Brief message from client
      preferred_slots // Optional array of time slot objects: [{ date: "2024-01-15", time: "14:00" }, ...]
    } = req.body;

    // Validate required fields (SIMPLIFIED FOR CONCIERGE MODEL)
    if (!full_name || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: full_name, email, phone' 
      });
    }

    // Validate preferred_slots array (optional - can be empty for simple booking)
    if (preferred_slots && (!Array.isArray(preferred_slots) || preferred_slots.length > 3)) {
      return res.status(400).json({ 
        error: 'preferred_slots must be an array with maximum 3 time slots' 
      });
    }

    // Validate each time slot if provided
    if (preferred_slots && preferred_slots.length > 0) {
      for (let i = 0; i < preferred_slots.length; i++) {
        const slot = preferred_slots[i];
        if (!slot.date || !slot.time) {
          return res.status(400).json({ 
            error: `Time slot ${i + 1} must have both date and time fields` 
          });
        }
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create simplified consultation request (CONCIERGE MODEL)
    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert({
        prospect_name: full_name,
        prospect_email: email,
        prospect_phone: phone,
        message: message || null,
        client_reason: message || null, // Store the brief message
        preferred_slots: preferred_slots || [], // Store as JSONB (can be empty)
        status: 'pending', // Use valid status value
        consultation_type: 'general_consultation',
        duration_minutes: 60,
        urgency_level: 'normal',
        country: 'Not specified',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation request:', error);
      return res.status(500).json({ error: 'Failed to submit consultation request' });
    }

    // Send simple confirmation email to client
    try {
      await sendEmail(email, 'consultation_request_received', {
        client_name: full_name,
        request_id: consultation.id,
        message: message || 'No message provided',
        preferred_slots: preferred_slots || [],
        confirmation_message: 'Request received. We will confirm your consultation shortly.',
        next_steps: 'Our team will review your request and contact you within 24 hours to confirm your consultation time.'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Send admin notification with all booking details
    try {
      await sendEmail('admin@applybureau.com', 'new_consultation_request_concierge', {
        client_name: full_name,
        client_email: email,
        client_phone: phone,
        client_message: message || 'No message provided',
        preferred_slots: preferred_slots || [],
        has_time_slots: preferred_slots && preferred_slots.length > 0,
        admin_dashboard_url: buildUrl('/admin/consultations'),
        consultation_id: consultation.id,
        admin_actions: {
          confirm_url: buildUrl(`/admin/consultations/${consultation.id}/confirm`),
          reschedule_url: buildUrl(`/admin/consultations/${consultation.id}/reschedule`),
          waitlist_url: buildUrl(`/admin/consultations/${consultation.id}/waitlist`)
        }
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    // Create admin notification
    try {
      await NotificationHelpers.newConsultationRequestConcierge(consultation);
    } catch (notificationError) {
      console.error('Failed to create admin notification:', notificationError);
    }

    res.status(201).json({
      id: consultation.id,
      status: 'pending',
      admin_status: 'pending',
      message: 'Request received. We will confirm your consultation shortly.',
      booking_details: {
        name: full_name,
        email: email,
        phone: phone,
        message: message || null,
        preferred_slots: preferred_slots || []
      },
      next_steps: 'Our team will review your request and contact you within 24 hours to confirm your consultation time.'
    });
  } catch (error) {
    console.error('Public consultation request error:', error);
    res.status(500).json({ error: 'Failed to submit consultation request' });
  }
});

// POST /api/public-consultations/request-new-times/:id - Request new availability (PUBLIC)
router.post('/request-new-times/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      preferred_slots,
      client_message
    } = req.body;

    // Validate preferred_slots array
    if (!preferred_slots || !Array.isArray(preferred_slots) || preferred_slots.length !== 3) {
      return res.status(400).json({ 
        error: 'Please provide exactly 3 new preferred time slots' 
      });
    }

    // Get consultation request
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Update with new time preferences
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultations')
      .update({
        preferred_slots,
        status: 'pending', // Reset to pending for admin review
        admin_notes: client_message || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating consultation times:', updateError);
      return res.status(500).json({ error: 'Failed to update consultation times' });
    }

    // Send confirmation to client
    try {
      await sendEmail(consultation.prospect_email, 'new_times_received', {
        client_name: consultation.prospect_name,
        preferred_slots: preferred_slots,
        message: 'Thank you for providing new availability. We will review your updated preferences and confirm a time shortly.'
      });
    } catch (emailError) {
      console.error('Failed to send new times confirmation email:', emailError);
    }

    // Notify admin of new time preferences
    try {
      await sendEmail('admin@applybureau.com', 'client_updated_consultation_times_concierge', {
        client_name: consultation.prospect_name,
        client_email: consultation.prospect_email,
        consultation_id: consultation.id,
        new_preferred_slots: preferred_slots,
        client_message: client_message || 'No additional message',
        admin_dashboard_url: buildUrl('/admin/consultations')
      });
    } catch (emailError) {
      console.error('Failed to send admin new times notification:', emailError);
    }

    res.json({
      message: 'New availability submitted successfully',
      consultation: updatedConsultation,
      next_steps: 'We will review your updated preferences and confirm a time shortly.'
    });
  } catch (error) {
    console.error('Request new times error:', error);
    res.status(500).json({ error: 'Failed to submit new availability' });
  }
});

module.exports = router;