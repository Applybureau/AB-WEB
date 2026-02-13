const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// INTERVIEW COORDINATION
// ============================================

// GET /api/admin/interviews
router.get('/interviews', async (req, res) => {
  try {
    const {
      status,
      date_from,
      date_to,
      client_id,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('interviews')
      .select(`
        *,
        clients!interviews_client_id_fkey (
          id,
          full_name,
          email,
          phone
        ),
        applications!interviews_application_id_fkey (
          id,
          company,
          position_title
        )
      `)
      .order('scheduled_date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (date_from) {
      query = query.gte('scheduled_date', date_from);
    }

    if (date_to) {
      query = query.lte('scheduled_date', date_to);
    }

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    const { data: interviews, error } = await query;

    if (error) {
      logger.error('Error fetching interviews:', error);
      return res.status(500).json({ error: 'Failed to fetch interviews' });
    }

    // Get status counts
    const { data: allInterviews } = await supabaseAdmin
      .from('interviews')
      .select('status');

    const summary = {
      scheduled: allInterviews?.filter(i => i.status === 'scheduled').length || 0,
      completed: allInterviews?.filter(i => i.status === 'completed').length || 0,
      cancelled: allInterviews?.filter(i => i.status === 'cancelled').length || 0,
      rescheduled: allInterviews?.filter(i => i.status === 'rescheduled').length || 0
    };

    const formattedInterviews = interviews?.map(interview => ({
      id: interview.id,
      client_id: interview.client_id,
      client_name: interview.clients?.full_name,
      client_email: interview.clients?.email,
      application_id: interview.application_id,
      company: interview.applications?.company || interview.company,
      role: interview.applications?.position_title || interview.role,
      interview_type: interview.interview_type,
      scheduled_date: interview.scheduled_date,
      duration_minutes: interview.duration_minutes,
      interviewer_name: interview.interviewer_name,
      interviewer_email: interview.interviewer_email,
      meeting_link: interview.meeting_link,
      status: interview.status,
      preparation_status: interview.preparation_status,
      admin_notes: interview.admin_notes,
      client_notes: interview.client_notes,
      created_at: interview.created_at,
      updated_at: interview.updated_at
    })) || [];

    res.json({
      interviews: formattedInterviews,
      total_count: interviews?.length || 0,
      page: parseInt(page),
      total_pages: Math.ceil((interviews?.length || 0) / parseInt(limit)),
      summary
    });

  } catch (error) {
    logger.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to get interviews' });
  }
});

// GET /api/admin/interviews/:interviewId
router.get('/interviews/:interviewId', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .select(`
        *,
        clients!interviews_client_id_fkey (
          id,
          full_name,
          email,
          phone
        ),
        applications!interviews_application_id_fkey (
          id,
          company,
          position_title,
          job_description
        )
      `)
      .eq('id', interviewId)
      .single();

    if (error || !interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Get preparation materials
    const { data: materials } = await supabaseAdmin
      .from('interview_materials')
      .select('*')
      .eq('interview_id', interviewId)
      .order('uploaded_at', { ascending: false });

    // Get history
    const { data: history } = await supabaseAdmin
      .from('interview_history')
      .select(`
        *,
        registered_users!interview_history_by_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq('interview_id', interviewId)
      .order('timestamp', { ascending: false });

    res.json({
      interview: {
        id: interview.id,
        client_id: interview.client_id,
        client_name: interview.clients?.full_name,
        client_email: interview.clients?.email,
        client_phone: interview.clients?.phone,
        application_id: interview.application_id,
        company: interview.applications?.company || interview.company,
        role: interview.applications?.position_title || interview.role,
        job_description: interview.applications?.job_description,
        interview_type: interview.interview_type,
        interview_round: interview.interview_round,
        scheduled_date: interview.scheduled_date,
        duration_minutes: interview.duration_minutes,
        timezone: interview.timezone,
        interviewer_name: interview.interviewer_name,
        interviewer_email: interview.interviewer_email,
        interviewer_title: interview.interviewer_title,
        meeting_link: interview.meeting_link,
        meeting_password: interview.meeting_password,
        location: interview.location,
        address: interview.address,
        status: interview.status,
        preparation_status: interview.preparation_status,
        preparation_materials: materials?.map(m => ({
          type: m.type,
          title: m.title,
          url: m.url,
          uploaded_at: m.uploaded_at
        })) || [],
        admin_notes: interview.admin_notes,
        client_notes: interview.client_notes,
        feedback: interview.feedback,
        outcome: interview.outcome,
        created_at: interview.created_at,
        updated_at: interview.updated_at,
        history: history?.map(h => ({
          action: h.action,
          timestamp: h.timestamp,
          by: h.registered_users?.email,
          changes: h.changes
        })) || []
      }
    });

  } catch (error) {
    logger.error('Get interview details error:', error);
    res.status(500).json({ error: 'Failed to get interview details' });
  }
});

// POST /api/admin/interviews
router.post('/interviews', async (req, res) => {
  try {
    const {
      client_id,
      application_id,
      interview_type,
      scheduled_date,
      duration_minutes = 60,
      interviewer_name,
      interviewer_email,
      meeting_link,
      admin_notes,
      company,
      role,
      timezone = 'America/New_York'
    } = req.body;

    if (!client_id || !scheduled_date || !interview_type) {
      return res.status(400).json({ 
        error: 'client_id, scheduled_date, and interview_type are required' 
      });
    }

    // Create interview
    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .insert({
        client_id,
        application_id: application_id || null,
        company: company || null,
        role: role || null,
        interview_type,
        scheduled_date,
        duration_minutes,
        timezone,
        interviewer_name: interviewer_name || null,
        interviewer_email: interviewer_email || null,
        meeting_link: meeting_link || null,
        status: 'scheduled',
        preparation_status: 'not_started',
        admin_notes: admin_notes || null,
        created_by: req.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating interview:', error);
      return res.status(500).json({ error: 'Failed to create interview' });
    }

    // Log creation
    await supabaseAdmin
      .from('interview_history')
      .insert({
        interview_id: interview.id,
        action: 'created',
        timestamp: new Date().toISOString(),
        by_user_id: req.user.id
      });

    // Get client info for notification
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', client_id)
      .single();

    // Send notification to client
    if (client) {
      try {
        await sendEmail(client.email, 'interview_scheduled', {
          client_name: client.full_name,
          company: company || 'Company',
          role: role || 'Position',
          interview_type,
          scheduled_date: new Date(scheduled_date).toLocaleDateString(),
          scheduled_time: new Date(scheduled_date).toLocaleTimeString(),
          meeting_link: meeting_link || 'Will be provided',
          duration_minutes
        });
      } catch (emailError) {
        logger.error('Failed to send interview notification:', emailError);
      }

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: client_id,
          user_type: 'client',
          title: 'Interview Scheduled',
          message: `Your ${interview_type} interview has been scheduled`,
          type: 'interview_scheduled',
          is_read: false,
          action_url: '/client/interviews'
        });
    }

    res.status(201).json({
      success: true,
      message: 'Interview created successfully',
      interview: {
        id: interview.id,
        client_id: interview.client_id,
        scheduled_date: interview.scheduled_date,
        status: interview.status
      }
    });

  } catch (error) {
    logger.error('Create interview error:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// PUT /api/admin/interviews/:interviewId
router.put('/interviews/:interviewId', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const updates = req.body;

    // Get current interview
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (fetchError || !current) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Update interview
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('interviews')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating interview:', updateError);
      return res.status(500).json({ error: 'Failed to update interview' });
    }

    // Log update
    const changes = Object.keys(updates)
      .map(key => `${key}: ${current[key]} → ${updates[key]}`)
      .join(', ');

    await supabaseAdmin
      .from('interview_history')
      .insert({
        interview_id: interviewId,
        action: 'updated',
        timestamp: new Date().toISOString(),
        by_user_id: req.user.id,
        changes
      });

    // Notify client if status changed
    if (updates.status && updates.status !== current.status) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: current.client_id,
          user_type: 'client',
          title: 'Interview Updated',
          message: `Your interview status has been updated to ${updates.status}`,
          type: 'interview_updated',
          is_read: false,
          action_url: '/client/interviews'
        });
    }

    res.json({
      success: true,
      message: 'Interview updated successfully',
      interview: {
        id: updated.id,
        scheduled_date: updated.scheduled_date,
        status: updated.status
      }
    });

  } catch (error) {
    logger.error('Update interview error:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// POST /api/admin/interviews/:interviewId/feedback
router.post('/interviews/:interviewId/feedback', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { outcome, feedback, next_steps, admin_notes } = req.body;

    if (!outcome) {
      return res.status(400).json({ error: 'outcome is required' });
    }

    // Update interview with feedback
    const { data: interview, error } = await supabaseAdmin
      .from('interviews')
      .update({
        outcome,
        feedback: feedback || null,
        next_steps: next_steps || null,
        admin_notes: admin_notes || null,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select('client_id')
      .single();

    if (error) {
      logger.error('Error adding feedback:', error);
      return res.status(500).json({ error: 'Failed to add feedback' });
    }

    // Log feedback
    await supabaseAdmin
      .from('interview_history')
      .insert({
        interview_id: interviewId,
        action: 'feedback_added',
        timestamp: new Date().toISOString(),
        by_user_id: req.user.id,
        changes: `Outcome: ${outcome}`
      });

    // Notify client
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: interview.client_id,
        user_type: 'client',
        title: 'Interview Feedback Available',
        message: 'Feedback from your recent interview is now available',
        type: 'interview_feedback',
        is_read: false,
        action_url: '/client/interviews'
      });

    res.json({
      success: true,
      message: 'Feedback added successfully'
    });

  } catch (error) {
    logger.error('Add feedback error:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  }
});

module.exports = router;
