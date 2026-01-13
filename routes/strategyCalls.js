const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail, buildUrl } = require('../utils/email');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// Middleware to ensure user is a client
const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Access denied. Client role required.' });
  }
  next();
};

// POST /api/strategy-calls/request - Request strategy call (CLIENT ONLY)
router.post('/request', authenticateToken, requireClient, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      preferred_time_1,
      preferred_time_2,
      preferred_time_3,
      timezone,
      preparation_notes,
      specific_topics,
      urgency_level = 'normal' // normal, high, urgent
    } = req.body;

    // Validate time slots
    if (!preferred_time_1 || !preferred_time_2 || !preferred_time_3) {
      return res.status(400).json({ 
        error: 'Please provide three preferred time slots for your strategy call' 
      });
    }

    // Check if user has completed onboarding
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('onboarding_completed, full_name, email, tier')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.onboarding_completed) {
      return res.status(400).json({ 
        error: 'Please complete your onboarding questionnaire before scheduling a strategy call' 
      });
    }

    // Create strategy call request
    const { data: strategyCall, error } = await supabaseAdmin
      .from('strategy_calls')
      .insert({
        user_id: userId,
        preferred_time_1,
        preferred_time_2,
        preferred_time_3,
        timezone: timezone || 'UTC',
        preparation_notes,
        specific_topics: Array.isArray(specific_topics) ? specific_topics : [],
        urgency_level,
        status: 'pending_confirmation',
        call_type: 'strategy_and_role_alignment',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating strategy call request:', error);
      return res.status(500).json({ error: 'Failed to request strategy call' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(user.email, 'strategy_call_requested', {
        client_name: user.full_name,
        tier: user.tier || 'Your package',
        preferred_times: [preferred_time_1, preferred_time_2, preferred_time_3],
        timezone: timezone || 'UTC',
        preparation_notes: preparation_notes || 'None provided',
        specific_topics: Array.isArray(specific_topics) ? specific_topics.join(', ') : 'General strategy discussion',
        confirmation_message: 'Request received. We will confirm your strategy call shortly.',
        next_steps: 'Our team will review your preferred times and confirm one of them within 24 hours.',
        call_purpose: 'This strategy call is where we finalize your resume direction, role strategy, and search boundaries to kickoff your application execution.'
      });
    } catch (emailError) {
      console.error('Failed to send strategy call confirmation email:', emailError);
    }

    // Send notification email to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_strategy_call_request', {
        client_name: user.full_name,
        client_email: user.email,
        client_tier: user.tier || 'Not specified',
        preferred_time_1,
        preferred_time_2,
        preferred_time_3,
        timezone: timezone || 'UTC',
        preparation_notes: preparation_notes || 'None provided',
        specific_topics: Array.isArray(specific_topics) ? specific_topics.join(', ') : 'General strategy discussion',
        urgency_level,
        admin_dashboard_url: buildUrl('/admin/strategy-calls'),
        strategy_call_id: strategyCall.id
      });
    } catch (emailError) {
      console.error('Failed to send admin strategy call notification:', emailError);
    }

    // Create admin notification
    try {
      await NotificationHelpers.newStrategyCallRequest(strategyCall, user);
    } catch (notificationError) {
      console.error('Failed to create strategy call notification:', notificationError);
    }

    res.status(201).json({
      id: strategyCall.id,
      status: 'pending_confirmation',
      message: 'Request received. We will confirm your strategy call shortly.',
      preferred_times: [preferred_time_1, preferred_time_2, preferred_time_3],
      next_steps: 'Our team will review your preferred times and confirm one of them within 24 hours.',
      call_type: 'Strategy & Role Alignment Call'
    });
  } catch (error) {
    console.error('Strategy call request error:', error);
    res.status(500).json({ error: 'Failed to request strategy call' });
  }
});

// POST /api/strategy-calls/:id/request-new-times - Request new availability for strategy call (CLIENT ONLY)
router.post('/:id/request-new-times', authenticateToken, requireClient, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const {
      preferred_time_1,
      preferred_time_2,
      preferred_time_3,
      timezone,
      client_message
    } = req.body;

    // Validate time slots
    if (!preferred_time_1 || !preferred_time_2 || !preferred_time_3) {
      return res.status(400).json({ 
        error: 'Please provide three new preferred time slots' 
      });
    }

    // Get strategy call request
    const { data: strategyCall, error: fetchError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns this request
      .single();

    if (fetchError || !strategyCall) {
      return res.status(404).json({ error: 'Strategy call request not found' });
    }

    // Update with new time preferences
    const { data: updatedCall, error: updateError } = await supabaseAdmin
      .from('strategy_calls')
      .update({
        preferred_time_1,
        preferred_time_2,
        preferred_time_3,
        timezone: timezone || strategyCall.timezone,
        status: 'pending_confirmation',
        client_message: client_message || null,
        times_updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating strategy call times:', updateError);
      return res.status(500).json({ error: 'Failed to update strategy call times' });
    }

    // Send confirmation to client
    try {
      await sendEmail(req.user.email, 'strategy_call_new_times_received', {
        client_name: req.user.full_name || 'Client',
        preferred_times: [preferred_time_1, preferred_time_2, preferred_time_3],
        timezone: timezone || strategyCall.timezone,
        message: 'Thank you for providing new availability. We will review your updated preferences and confirm a time shortly.'
      });
    } catch (emailError) {
      console.error('Failed to send new times confirmation email:', emailError);
    }

    // Notify admin of new time preferences
    try {
      await sendEmail('admin@applybureau.com', 'client_updated_strategy_call_times', {
        client_name: req.user.full_name || 'Client',
        client_email: req.user.email,
        strategy_call_id: strategyCall.id,
        new_preferred_time_1: preferred_time_1,
        new_preferred_time_2: preferred_time_2,
        new_preferred_time_3: preferred_time_3,
        timezone: timezone || strategyCall.timezone,
        client_message: client_message || 'No additional message',
        admin_dashboard_url: buildUrl('/admin/strategy-calls')
      });
    } catch (emailError) {
      console.error('Failed to send admin new times notification:', emailError);
    }

    res.json({
      message: 'New availability submitted successfully',
      strategy_call: updatedCall,
      next_steps: 'We will review your updated preferences and confirm a time shortly.'
    });
  } catch (error) {
    console.error('Request new strategy call times error:', error);
    res.status(500).json({ error: 'Failed to submit new availability' });
  }
});

// GET /api/strategy-calls/my-calls - Get client's strategy calls (CLIENT ONLY)
router.get('/my-calls', authenticateToken, requireClient, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const { data: strategyCalls, error } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching strategy calls:', error);
      return res.status(500).json({ error: 'Failed to fetch strategy calls' });
    }

    // Enhance with time slot info
    const enhancedCalls = strategyCalls?.map(call => ({
      ...call,
      time_slots: [
        call.preferred_time_1,
        call.preferred_time_2,
        call.preferred_time_3
      ].filter(Boolean),
      can_request_new_times: ['pending_confirmation', 'awaiting_new_times'].includes(call.status)
    })) || [];

    res.json(enhancedCalls);
  } catch (error) {
    console.error('Get client strategy calls error:', error);
    res.status(500).json({ error: 'Failed to fetch strategy calls' });
  }
});

// ADMIN ROUTES

// GET /api/strategy-calls/admin/all - Get all strategy call requests (ADMIN ONLY)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      limit = 50, 
      offset = 0, 
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('strategy_calls')
      .select(`
        *,
        registered_users!inner(full_name, email, tier)
      `)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`registered_users.full_name.ilike.%${search}%,registered_users.email.ilike.%${search}%`);
    }

    const { data: strategyCalls, error } = await query;

    if (error) {
      console.error('Error fetching strategy calls for admin:', error);
      return res.status(500).json({ error: 'Failed to fetch strategy calls' });
    }

    // Enhance with time slot info
    const enhancedCalls = strategyCalls?.map(call => ({
      ...call,
      client_name: call.registered_users.full_name,
      client_email: call.registered_users.email,
      client_tier: call.registered_users.tier,
      time_slots: [
        call.preferred_time_1,
        call.preferred_time_2,
        call.preferred_time_3
      ].filter(Boolean)
    })) || [];

    res.json(enhancedCalls);
  } catch (error) {
    console.error('Fetch admin strategy calls error:', error);
    res.status(500).json({ error: 'Failed to fetch strategy calls' });
  }
});

// POST /api/strategy-calls/admin/:id/confirm-time - Confirm strategy call time (ADMIN ONLY)
router.post('/admin/:id/confirm-time', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      selected_time_slot, // 1, 2, or 3
      meeting_details,
      admin_notes,
      meeting_link,
      meeting_type = 'video_call'
    } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!selected_time_slot || ![1, 2, 3].includes(parseInt(selected_time_slot))) {
      return res.status(400).json({ 
        error: 'Please select a valid time slot (1, 2, or 3)' 
      });
    }

    // Get strategy call request with user info
    const { data: strategyCall, error: fetchError } = await supabaseAdmin
      .from('strategy_calls')
      .select(`
        *,
        registered_users!inner(full_name, email, tier)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !strategyCall) {
      return res.status(404).json({ error: 'Strategy call request not found' });
    }

    // Get the selected time
    const timeSlotField = `preferred_time_${selected_time_slot}`;
    const confirmedTime = strategyCall[timeSlotField];

    if (!confirmedTime) {
      return res.status(400).json({ error: 'Selected time slot is not available' });
    }

    // Update strategy call with confirmed details
    const { data: updatedCall, error: updateError } = await supabaseAdmin
      .from('strategy_calls')
      .update({
        status: 'confirmed',
        confirmed_time: confirmedTime,
        selected_time_slot: parseInt(selected_time_slot),
        meeting_details: meeting_details || 'Strategy & Role Alignment Call - Meeting details provided in confirmation email.',
        meeting_link: meeting_link || null,
        meeting_type,
        confirmed_by: adminId,
        confirmed_at: new Date().toISOString(),
        admin_notes
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error confirming strategy call:', updateError);
      return res.status(500).json({ error: 'Failed to confirm strategy call' });
    }

    // Update consultation workflow stage
    await supabaseAdmin
      .from('consultation_requests')
      .update({ 
        workflow_stage: 'strategy_call_scheduled'
      })
      .eq('user_id', strategyCall.user_id);

    // Send confirmation email to client
    try {
      const meetingDate = new Date(confirmedTime);
      await sendEmail(strategyCall.registered_users.email, 'strategy_call_confirmed', {
        client_name: strategyCall.registered_users.full_name,
        confirmed_date: meetingDate.toLocaleDateString(),
        confirmed_time: meetingDate.toLocaleTimeString(),
        timezone: strategyCall.timezone || 'UTC',
        meeting_type: meeting_type.replace('_', ' '),
        meeting_link: meeting_link || 'Meeting link will be provided separately',
        meeting_details: meeting_details || 'This strategy call is where we finalize your resume direction, role strategy, and search boundaries to kickoff your application execution.',
        tier: strategyCall.registered_users.tier || 'Your package',
        preparation_tips: [
          'Review your onboarding questionnaire responses',
          'Prepare specific questions about your job search strategy',
          'Have your current resume ready for discussion',
          'Think about your ideal role and company preferences'
        ],
        next_steps: 'After this call, application execution will begin based on the strategy we develop together.'
      });
    } catch (emailError) {
      console.error('Failed to send strategy call confirmation email:', emailError);
    }

    // Create client notification
    try {
      await NotificationHelpers.strategyCallConfirmed(strategyCall.user_id, updatedCall);
    } catch (notificationError) {
      console.error('Failed to create strategy call confirmation notification:', notificationError);
    }

    res.json({
      message: 'Strategy call confirmed successfully',
      strategy_call: updatedCall,
      confirmed_time: confirmedTime,
      next_steps: 'Client will receive confirmation email with meeting details'
    });
  } catch (error) {
    console.error('Confirm strategy call time error:', error);
    res.status(500).json({ error: 'Failed to confirm strategy call' });
  }
});

// POST /api/strategy-calls/admin/:id/request-new-availability - Request new availability (ADMIN ONLY)
router.post('/admin/:id/request-new-availability', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_message, reason } = req.body;
    const adminId = req.user.userId || req.user.id;

    // Get strategy call request with user info
    const { data: strategyCall, error: fetchError } = await supabaseAdmin
      .from('strategy_calls')
      .select(`
        *,
        registered_users!inner(full_name, email, tier)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !strategyCall) {
      return res.status(404).json({ error: 'Strategy call request not found' });
    }

    // Update strategy call status
    const { data: updatedCall, error: updateError } = await supabaseAdmin
      .from('strategy_calls')
      .update({
        status: 'awaiting_new_times',
        admin_message: admin_message || 'Unfortunately, none of the selected times work. Please select new preferred times.',
        availability_request_reason: reason || 'Schedule conflict',
        requested_new_times_by: adminId,
        requested_new_times_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error requesting new availability for strategy call:', updateError);
      return res.status(500).json({ error: 'Failed to request new availability' });
    }

    // Send email to client requesting new times
    try {
      const newTimesUrl = buildUrl(`/client/strategy-call/new-times/${strategyCall.id}`);
      await sendEmail(strategyCall.registered_users.email, 'request_new_strategy_call_times', {
        client_name: strategyCall.registered_users.full_name,
        admin_message: admin_message || 'Thanks for your availability. Unfortunately, none of the selected times work. Please select new preferred times from the available options.',
        reason: reason || 'Schedule conflict',
        new_times_url: newTimesUrl,
        tier: strategyCall.registered_users.tier || 'Your package',
        call_type: 'Strategy & Role Alignment Call',
        support_message: 'If you have any questions, please don\'t hesitate to contact us.'
      });
    } catch (emailError) {
      console.error('Failed to send new availability request email:', emailError);
    }

    // Create client notification
    try {
      await NotificationHelpers.newStrategyCallAvailabilityRequested(strategyCall.user_id, updatedCall);
    } catch (notificationError) {
      console.error('Failed to create new availability notification:', notificationError);
    }

    res.json({
      message: 'New availability requested from client',
      strategy_call: updatedCall,
      next_steps: 'Client will receive an email with instructions to provide new preferred times'
    });
  } catch (error) {
    console.error('Request new strategy call availability error:', error);
    res.status(500).json({ error: 'Failed to request new availability' });
  }
});

module.exports = router;