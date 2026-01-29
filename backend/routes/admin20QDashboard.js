const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/20q-dashboard/test - Simple test endpoint
router.get('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ message: '20Q Dashboard route is working', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Test failed' });
  }
});

// GET /api/admin/20q-dashboard - Get all clients with their 20Q status
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('20Q Dashboard endpoint called');
    const { page = 1, limit = 20, status_filter, search } = req.query;
    const offset = (page - 1) * limit;

    // Simple test - just get clients first
    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email, created_at, payment_confirmed, profile_unlocked')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching clients for 20Q dashboard:', error);
      return res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
    }

    console.log('Clients fetched:', clients?.length || 0);

    // For now, return simple response without 20Q data
    const clientsWithStatus = clients.map(client => ({
      id: client.id,
      full_name: client.full_name,
      email: client.email,
      created_at: client.created_at,
      payment_confirmed: client.payment_confirmed,
      profile_unlocked: client.profile_unlocked,
      twenty_questions: {
        status: 'not_started',
        display_status: 'Not Yet Started',
        description: 'Client has not completed the 20-question assessment',
        color: 'gray',
        progress: 0,
        can_approve: false,
        requires_action: false
      },
      days_since_registration: Math.floor(
        (new Date() - new Date(client.created_at)) / (1000 * 60 * 60 * 24)
      )
    }));

    const statusSummary = {
      not_started: clientsWithStatus.length,
      pending_approval: 0,
      active: 0,
      paused: 0,
      completed: 0,
      total: clientsWithStatus.length
    };

    res.json({
      clients: clientsWithStatus,
      pagination: {
        current_page: parseInt(page),
        total_pages: 1,
        total_count: clientsWithStatus.length,
        per_page: parseInt(limit)
      },
      status_summary: statusSummary,
      filters: {
        status_filter: status_filter || 'all',
        search: search || ''
      }
    });
  } catch (error) {
    console.error('Admin 20Q dashboard error:', error);
    res.status(500).json({ error: 'Failed to load 20Q dashboard', details: error.message });
  }
});

// GET /api/admin/20q-dashboard/client/:clientId - Get detailed 20Q info for specific client
router.get('/client/:clientId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;

    // Get client information
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        id,
        full_name,
        email,
        created_at,
        payment_confirmed,
        profile_unlocked,
        resume_url,
        linkedin_profile_url
      `)
      .eq('id', clientId)
      .neq('role', 'admin')
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get 20Q data separately
    const { data: onboarding20q } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', clientId)
      .single();

    // Get strategy calls for this client
    const { data: strategyCalls } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Get applications count
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id, status, created_at')
      .eq('client_id', clientId);

    res.json({
      client: {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        created_at: client.created_at,
        payment_confirmed: client.payment_confirmed,
        profile_unlocked: client.profile_unlocked,
        has_resume: !!client.resume_url,
        has_linkedin: !!client.linkedin_profile_url
      },
      twenty_questions: format20QuestionsStatusForAdmin(onboarding20q, true), // detailed = true
      strategy_calls: strategyCalls || [],
      applications: {
        total: applications?.length || 0,
        by_status: applications?.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {}) || {}
      },
      timeline: generateClientTimeline(client, onboarding20q, strategyCalls, applications)
    });
  } catch (error) {
    console.error('Get client 20Q details error:', error);
    res.status(500).json({ error: 'Failed to get client details' });
  }
});

// PATCH /api/admin/20q-dashboard/client/:clientId/status - Update 20Q status
router.patch('/client/:clientId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { execution_status, admin_notes } = req.body;
    const adminId = req.user.id;

    // Validate status
    const validStatuses = ['pending_approval', 'active', 'paused', 'completed'];
    if (!validStatuses.includes(execution_status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    // Check if 20Q record exists
    const { data: existing } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('id')
      .eq('user_id', clientId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: '20Q assessment not found for this client' });
    }

    // Update the status
    const updateData = {
      execution_status,
      updated_at: new Date().toISOString()
    };

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    if (execution_status === 'active') {
      updateData.approved_by = adminId;
      updateData.approved_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabaseAdmin
      .from('client_onboarding_20q')
      .update(updateData)
      .eq('user_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating 20Q status:', error);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    // If approved, unlock profile
    if (execution_status === 'active') {
      await supabaseAdmin
        .from('clients')
        .update({
          profile_unlocked: true,
          profile_unlocked_by: adminId,
          profile_unlocked_at: new Date().toISOString()
        })
        .eq('id', clientId);
    }

    res.json({
      message: 'Status updated successfully',
      twenty_questions: format20QuestionsStatusForAdmin(updated, true)
    });
  } catch (error) {
    console.error('Update 20Q status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Helper function to format 20Q status for admin dashboard
function format20QuestionsStatusForAdmin(onboarding20q, detailed = false) {
  if (!onboarding20q) {
    return {
      status: 'not_started',
      display_status: 'Not Yet Started',
      description: 'Client has not completed the 20-question assessment',
      color: 'gray',
      progress: 0,
      completed_at: null,
      approved_at: null,
      can_approve: false,
      requires_action: false
    };
  }

  const statusMap = {
    'pending_approval': {
      display_status: 'Pending Review',
      description: 'Assessment completed, awaiting admin approval',
      color: 'yellow',
      progress: 75,
      can_approve: true,
      requires_action: true
    },
    'active': {
      display_status: 'Active & Approved',
      description: 'Profile approved and active for job applications',
      color: 'green',
      progress: 100,
      can_approve: false,
      requires_action: false
    },
    'paused': {
      display_status: 'Paused',
      description: 'Profile temporarily paused by admin',
      color: 'orange',
      progress: 50,
      can_approve: true,
      requires_action: true
    },
    'completed': {
      display_status: 'Completed',
      description: 'Assessment process completed',
      color: 'blue',
      progress: 100,
      can_approve: false,
      requires_action: false
    }
  };

  const statusInfo = statusMap[onboarding20q.execution_status] || statusMap['pending_approval'];

  const baseStatus = {
    status: onboarding20q.execution_status,
    display_status: statusInfo.display_status,
    description: statusInfo.description,
    color: statusInfo.color,
    progress: statusInfo.progress,
    completed_at: onboarding20q.completed_at,
    approved_at: onboarding20q.approved_at,
    approved_by: onboarding20q.approved_by,
    can_approve: statusInfo.can_approve,
    requires_action: statusInfo.requires_action,
    admin_notes: onboarding20q.admin_notes
  };

  if (detailed) {
    return {
      ...baseStatus,
      target_roles: onboarding20q.target_job_titles || [],
      target_industries: onboarding20q.target_industries || [],
      target_locations: onboarding20q.target_locations || [],
      experience_years: onboarding20q.years_of_experience,
      job_search_timeline: onboarding20q.job_search_timeline,
      key_skills: onboarding20q.key_technical_skills || [],
      career_goals_short: onboarding20q.career_goals_short_term,
      career_goals_long: onboarding20q.career_goals_long_term,
      salary_range: onboarding20q.target_salary_range,
      remote_preference: onboarding20q.remote_work_preference,
      created_at: onboarding20q.created_at,
      updated_at: onboarding20q.updated_at
    };
  }

  return baseStatus;
}

// Helper function to generate client timeline
function generateClientTimeline(client, onboarding20q, strategyCalls, applications) {
  const timeline = [];

  // Registration
  timeline.push({
    date: client.created_at,
    event: 'Client Registration',
    description: 'Client registered on the platform',
    type: 'registration',
    status: 'completed'
  });

  // Payment confirmation
  if (client.payment_confirmed) {
    timeline.push({
      date: client.created_at, // Assuming same day for now
      event: 'Payment Confirmed',
      description: 'Payment processed successfully',
      type: 'payment',
      status: 'completed'
    });
  }

  // Strategy calls
  strategyCalls?.forEach(call => {
    timeline.push({
      date: call.created_at,
      event: 'Strategy Call',
      description: `Strategy call ${call.admin_status}`,
      type: 'strategy_call',
      status: call.admin_status
    });
  });

  // 20Q Assessment
  if (onboarding20q) {
    timeline.push({
      date: onboarding20q.completed_at || onboarding20q.created_at,
      event: '20 Questions Assessment',
      description: `Assessment ${onboarding20q.execution_status}`,
      type: '20q_assessment',
      status: onboarding20q.execution_status
    });

    if (onboarding20q.approved_at) {
      timeline.push({
        date: onboarding20q.approved_at,
        event: 'Profile Approved',
        description: 'Profile approved and activated',
        type: 'approval',
        status: 'completed'
      });
    }
  }

  // Applications
  applications?.forEach(app => {
    timeline.push({
      date: app.created_at,
      event: 'Job Application',
      description: `Application ${app.status}`,
      type: 'application',
      status: app.status
    });
  });

  return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = router;