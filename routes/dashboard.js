const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// GET /api/dashboard - Returns client's dashboard info
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Dashboard - req.user:', req.user);
    
    const clientId = req.user.userId || req.user.id;
    if (!clientId) {
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }

    // Get client info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email, onboarding_complete, resume_url')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client:', clientError);
      return res.status(500).json({ error: 'Failed to fetch client data' });
    }

    // Get recent applications
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (appsError) {
      console.error('Error fetching applications:', appsError);
    }

    // Get upcoming consultations
    const { data: consultations, error: consultError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('client_id', clientId)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (consultError) {
      console.error('Error fetching consultations:', consultError);
    }

    // Get unread notifications
    const { data: notifications, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', clientId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notifError) {
      console.error('Error fetching notifications:', notifError);
    }

    // Calculate statistics
    const stats = {
      total_applications: applications?.length || 0,
      pending_applications: applications?.filter(app => app.status === 'applied').length || 0,
      interviews_scheduled: applications?.filter(app => app.status === 'interview').length || 0,
      offers_received: applications?.filter(app => app.status === 'offer').length || 0,
      upcoming_consultations: consultations?.length || 0,
      unread_notifications: notifications?.length || 0
    };

    res.json({
      client: {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        onboarding_complete: client.onboarding_complete,
        resume_url: client.resume_url
      },
      stats,
      recent_applications: applications || [],
      upcoming_consultations: consultations || [],
      unread_notifications: notifications || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/dashboard/stats - Get detailed statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId || req.user.id;
    if (!clientId) {
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }

    // Get all applications for detailed stats
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('status, created_at, date_applied')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching application stats:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // Calculate detailed statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total_applications: applications.length,
      applications_by_status: {
        applied: applications.filter(app => app.status === 'applied').length,
        interview: applications.filter(app => app.status === 'interview').length,
        offer: applications.filter(app => app.status === 'offer').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        withdrawn: applications.filter(app => app.status === 'withdrawn').length
      },
      recent_activity: {
        last_7_days: applications.filter(app => 
          new Date(app.created_at) >= sevenDaysAgo
        ).length,
        last_30_days: applications.filter(app => 
          new Date(app.created_at) >= thirtyDaysAgo
        ).length
      },
      success_rate: applications.length > 0 
        ? ((applications.filter(app => app.status === 'offer').length / applications.length) * 100).toFixed(1)
        : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

module.exports = router;