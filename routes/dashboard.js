const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// GET /api/dashboard - Returns client's dashboard info
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Dashboard - req.user:', req.user);
    
    const clientId = req.user.id;
    if (!clientId) {
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }

    // Get client info with fallback
    let client = null;
    try {
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, full_name, email, onboarding_complete, resume_url')
        .eq('id', clientId)
        .single();

      if (clientData) {
        client = clientData;
      }
    } catch (dbError) {
      console.error('Client fetch error, using fallback:', dbError);
    }

    // Fallback client data
    if (!client) {
      client = {
        id: clientId,
        full_name: req.user.full_name || 'Admin User',
        email: req.user.email,
        onboarding_complete: true,
        resume_url: null
      };
    }

    // Get recent applications (with error handling)
    let applications = [];
    try {
      // Try with client_id first
      const { data: appsData, error: appsError } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (appsError && appsError.message.includes('client_id')) {
        console.log('client_id column missing, trying user_id...');
        // Fallback to user_id if client_id doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('applications')
          .select('*')
          .eq('user_id', clientId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (fallbackData && !fallbackError) {
          applications = fallbackData;
        }
      } else if (appsData) {
        applications = appsData;
      }
    } catch (error) {
      console.error('Applications fetch error:', error);
    }

    // Get upcoming consultations (with error handling)
    let consultations = [];
    try {
      const { data: consultData, error: consultError } = await supabaseAdmin
        .from('consultations')
        .select('*')
        .eq('client_id', clientId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (consultData) consultations = consultData;
    } catch (error) {
      console.error('Consultations fetch error:', error);
    }

    // Get unread notifications (with error handling)
    let notifications = [];
    try {
      const { data: notifData, error: notifError } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', clientId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (notifError && notifError.message.includes('is_read')) {
        console.log('is_read column missing, getting all notifications...');
        // Fallback without is_read filter if column doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('user_id', clientId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (fallbackData && !fallbackError) {
          notifications = fallbackData;
        }
      } else if (notifData) {
        notifications = notifData;
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
    }

    // Calculate statistics
    const stats = {
      total_applications: applications.length,
      pending_applications: applications.filter(app => app.status === 'applied').length,
      interviews_scheduled: applications.filter(app => app.status === 'interview').length,
      offers_received: applications.filter(app => app.status === 'offer').length,
      upcoming_consultations: consultations.length,
      unread_notifications: notifications.length
    };

    res.json({
      client,
      stats,
      recent_applications: applications,
      upcoming_consultations: consultations,
      unread_notifications: notifications
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/dashboard/stats - Get detailed statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    if (!clientId) {
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }

    // Get all applications for detailed stats with error handling
    let applications = [];
    try {
      // Try with client_id first
      const { data: appsData, error } = await supabaseAdmin
        .from('applications')
        .select('status, created_at, date_applied')
        .eq('client_id', clientId);

      if (error && error.message.includes('client_id')) {
        console.log('client_id column missing, trying user_id...');
        // Fallback to user_id if client_id doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('applications')
          .select('status, created_at, date_applied')
          .eq('user_id', clientId);
        
        if (fallbackData && !fallbackError) {
          applications = fallbackData;
        } else {
          console.error('Both client_id and user_id failed:', fallbackError);
          applications = [];
        }
      } else if (error) {
        console.error('Applications query error:', error);
        applications = [];
      } else {
        applications = appsData || [];
      }
    } catch (dbError) {
      console.error('Database error in stats:', dbError);
      applications = [];
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

// GET /api/dashboard/contacts - Get contacts for dashboard
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get contacts based on user role
    let contacts = [];
    try {
      if (userRole === 'admin') {
        // Admin can see all contacts
        const { data, error } = await supabaseAdmin
          .from('contact_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (data) contacts = data;
      } else {
        // Client can see their own contacts
        const { data, error } = await supabaseAdmin
          .from('contact_requests')
          .select('*')
          .eq('client_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (data) contacts = data;
      }
    } catch (dbError) {
      console.error('Database error fetching contacts:', dbError);
      contacts = [];
    }

    res.json({
      contacts,
      total: contacts.length
    });
  } catch (error) {
    console.error('Dashboard contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

module.exports = router;