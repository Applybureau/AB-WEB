const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail, buildUrl } = require('../utils/email');
const { authenticateToken, requireClient, requireAdmin } = require('../middleware/auth');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// POST /api/strategy-calls - Book a strategy call (CLIENT)
router.post('/', authenticateToken, requireClient, async (req, res) => {
  try {
    const {
      preferred_slots, // Array of time slot objects: [{ date: "2024-01-15", time: "14:00" }, ...]
      message // Optional message from client
    } = req.body;

    const clientId = req.user.id;

    // Validate preferred_slots array
    if (!preferred_slots || !Array.isArray(preferred_slots) || preferred_slots.length === 0 || preferred_slots.length > 3) {
      return res.status(400).json({ 
        error: 'Please provide 1-3 preferred time slots' 
      });
    }

    // Validate each time slot
    for (let i = 0; i < preferred_slots.length; i++) {
      const slot = preferred_slots[i];
      if (!slot.date || !slot.time) {
        return res.status(400).json({ 
          error: `Time slot ${i + 1} must have both date and time fields` 
        });
      }
    }

    // Get client details
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('email, full_name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Create strategy call request
    const { data: strategyCall, error } = await supabaseAdmin
      .from('strategy_calls')
      .insert({
        client_id: clientId,
        client_name: client.full_name,
        client_email: client.email,
        preferred_slots: preferred_slots,
        message: message || null,
        status: 'pending',
        admin_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating strategy call request:', error);
      return res.status(500).json({ error: 'Failed to book strategy call' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(client.email, 'consultation_request_received', {
        client_name: client.full_name,
        preferred_slots: preferred_slots,
        message: message || 'No additional message',
        confirmation_message: 'Strategy call request submitted successfully.',
        next_steps: 'A lead strategist will review your request and confirm your preferred time within 24 hours.'
      });
    } catch (emailError) {
      console.error('Failed to send strategy call confirmation email:', emailError);
    }

    // Send admin notification
    try {
      await sendEmail('admin@applybureau.com', 'new_consultation_request', {
        client_name: client.full_name,
        client_email: client.email,
        preferred_slots: preferred_slots,
        client_message: message || 'No message provided',
        admin_dashboard_url: buildUrl('/admin/strategy-calls'),
        strategy_call_id: strategyCall.id
      });
    } catch (emailError) {
      console.error('Failed to send admin strategy call notification:', emailError);
    }

    // Create admin notification
    try {
      await NotificationHelpers.newStrategyCallRequest(strategyCall);
    } catch (notificationError) {
      console.error('Failed to create strategy call notification:', notificationError);
    }

    res.status(201).json({
      id: strategyCall.id,
      status: 'pending',
      admin_status: 'pending',
      message: 'Strategy call request submitted successfully.',
      next_steps: 'A lead strategist will review your request and confirm your preferred time within 24 hours.',
      preferred_slots: preferred_slots
    });
  } catch (error) {
    console.error('Strategy call booking error:', error);
    res.status(500).json({ error: 'Failed to book strategy call' });
  }
});

// GET /api/strategy-calls/status - Get client's strategy call status (CLIENT)
router.get('/status', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: strategyCalls, error } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching strategy calls:', error);
      return res.status(500).json({ error: 'Failed to fetch strategy call status' });
    }

    const latestCall = strategyCalls[0] || null;
    const hasBookedCall = strategyCalls.length > 0;
    const hasConfirmedCall = strategyCalls.some(call => call.admin_status === 'confirmed');

    res.json({
      has_booked_call: hasBookedCall,
      has_confirmed_call: hasConfirmedCall,
      latest_call: latestCall,
      total_calls: strategyCalls.length,
      can_book_new_call: !hasBookedCall || latestCall?.admin_status === 'completed'
    });
  } catch (error) {
    console.error('Strategy call status error:', error);
    res.status(500).json({ error: 'Failed to get strategy call status' });
  }
});

// ADMIN ROUTES

// GET /api/strategy-calls/admin - List all strategy call requests (ADMIN)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      admin_status = 'all',
      limit = 50,
      offset = 0 
    } = req.query;

    let query = supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (admin_status !== 'all') {
      query = query.eq('admin_status', admin_status);
    }

    const { data: strategyCalls, error } = await query;

    if (error) {
      console.error('Error fetching strategy calls for admin:', error);
      return res.status(500).json({ error: 'Failed to fetch strategy calls' });
    }

    res.json({
      strategy_calls: strategyCalls,
      total: strategyCalls.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Admin strategy calls list error:', error);
    res.status(500).json({ error: 'Failed to fetch strategy calls' });
  }
});

// POST /api/strategy-calls/admin/:id/confirm - Confirm strategy call (ADMIN)
router.post('/admin/:id/confirm', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      selected_slot_index,
      meeting_link,
      admin_notes
    } = req.body;

    if (selected_slot_index === undefined || selected_slot_index < 0 || selected_slot_index > 2) {
      return res.status(400).json({ 
        error: 'selected_slot_index must be 0, 1, or 2' 
      });
    }

    // Get strategy call request
    const { data: strategyCall, error: fetchError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !strategyCall) {
      return res.status(404).json({ error: 'Strategy call request not found' });
    }

    const selectedSlot = strategyCall.preferred_slots[selected_slot_index];
    if (!selectedSlot) {
      return res.status(400).json({ error: 'Invalid slot index' });
    }

    const confirmedTime = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`);

    // Update strategy call with confirmation
    const { data: updatedCall, error: updateError } = await supabaseAdmin
      .from('strategy_calls')
      .update({
        admin_status: 'confirmed',
        status: 'confirmed',
        confirmed_time: confirmedTime.toISOString(),
        meeting_link: meeting_link || null,
        admin_notes: admin_notes || null,
        admin_action_by: req.user.id,
        admin_action_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error confirming strategy call:', updateError);
      return res.status(500).json({ error: 'Failed to confirm strategy call' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(strategyCall.client_email, 'strategy_call_confirmed', {
        client_name: strategyCall.client_name,
        call_date: selectedSlot.date,
        call_time: selectedSlot.time,
        call_duration: '1 hour',
        meeting_link: meeting_link || 'Meeting details will be provided separately.',
        admin_name: req.user.full_name || 'Apply Bureau Team',
        call_purpose: 'This call aligns your goals, role targets, and application strategy.',
        next_steps: 'Please mark this time in your calendar. We look forward to discussing your career goals!'
      });
    } catch (emailError) {
      console.error('Failed to send strategy call confirmation email:', emailError);
    }

    res.json({
      message: 'Strategy call confirmed successfully',
      strategy_call: updatedCall,
      confirmed_slot: selectedSlot,
      confirmed_time: confirmedTime.toISOString()
    });
  } catch (error) {
    console.error('Confirm strategy call error:', error);
    res.status(500).json({ error: 'Failed to confirm strategy call' });
  }
});

module.exports = router;