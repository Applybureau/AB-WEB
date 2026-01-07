const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// GET /api/admin-dashboard - Admin dashboard with comprehensive stats
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.userId || req.user.id;

    // Get admin profile from both tables for compatibility
    let adminProfile = null;
    
    // First check admins table
    const { data: adminFromAdmins } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .single();

    if (adminFromAdmins) {
      adminProfile = adminFromAdmins;
    } else {
      // Fallback to clients table
      const { data: adminFromClients } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', adminId)
        .eq('role', 'admin')
        .single();
      
      if (adminFromClients) {
        adminProfile = {
          ...adminFromClients,
          permissions: {
            can_create_admins: true,
            can_delete_admins: true,
            can_manage_clients: true,
            can_schedule_consultations: true,
            can_view_reports: true,
            can_manage_system: true
          }
        };
      }
    }

    if (!adminProfile) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    // Get all clients count and stats
    const { data: allClients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email, role, onboarding_complete, created_at, last_login_at')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    }

    // Get all consultations
    const { data: allConsultations, error: consultationsError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (consultationsError) {
      console.error('Error fetching consultations:', consultationsError);
    }

    // Get all applications
    const { data: allApplications, error: applicationsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
    }

    // Get recent notifications
    const { data: recentNotifications, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
    }

    // Calculate comprehensive statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const clients = allClients || [];
    const consultations = allConsultations || [];
    const applications = allApplications || [];

    // Client statistics
    const clientStats = {
      total_clients: clients.length,
      active_clients: clients.filter(c => c.last_login_at && new Date(c.last_login_at) >= thirtyDaysAgo).length,
      new_clients_this_month: clients.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length,
      onboarded_clients: clients.filter(c => c.onboarding_complete).length,
      pending_onboarding: clients.filter(c => !c.onboarding_complete).length
    };

    // Consultation statistics
    const consultationStats = {
      total_consultations: consultations.length,
      scheduled_consultations: consultations.filter(c => c.status === 'scheduled').length,
      completed_consultations: consultations.filter(c => c.status === 'completed').length,
      upcoming_consultations: consultations.filter(c => 
        c.status === 'scheduled' && new Date(c.scheduled_at) >= now
      ).length,
      consultations_this_week: consultations.filter(c => 
        new Date(c.created_at) >= sevenDaysAgo
      ).length,
      consultations_this_month: consultations.filter(c => 
        new Date(c.created_at) >= thirtyDaysAgo
      ).length
    };

    // Application statistics
    const applicationStats = {
      total_applications: applications.length,
      applications_by_status: {
        applied: applications.filter(a => a.status === 'applied').length,
        interview: applications.filter(a => a.status === 'interview').length,
        offer: applications.filter(a => a.status === 'offer').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        withdrawn: applications.filter(a => a.status === 'withdrawn').length
      },
      applications_this_week: applications.filter(a => 
        new Date(a.created_at) >= sevenDaysAgo
      ).length,
      applications_this_month: applications.filter(a => 
        new Date(a.created_at) >= thirtyDaysAgo
      ).length,
      success_rate: applications.length > 0 
        ? ((applications.filter(a => a.status === 'offer').length / applications.length) * 100).toFixed(1)
        : 0
    };

    // Recent activity
    const recentClients = clients.slice(0, 5);
    const upcomingConsultations = consultations
      .filter(c => c.status === 'scheduled' && new Date(c.scheduled_at) >= now)
      .slice(0, 5);
    const recentApplications = applications.slice(0, 10);

    // System overview
    const systemStats = {
      total_users: clients.length + 1, // +1 for admin
      total_data_points: clients.length + consultations.length + applications.length,
      system_health: 'excellent',
      last_backup: now.toISOString() // Placeholder
    };

    res.json({
      admin: {
        id: adminProfile.id,
        full_name: adminProfile.full_name,
        email: adminProfile.email,
        role: adminProfile.role || 'admin',
        profile_picture_url: adminProfile.profile_picture_url,
        permissions: adminProfile.permissions,
        last_login_at: adminProfile.last_login_at
      },
      dashboard_type: 'admin',
      stats: {
        clients: clientStats,
        consultations: consultationStats,
        applications: applicationStats,
        system: systemStats
      },
      recent_activity: {
        new_clients: recentClients,
        upcoming_consultations: upcomingConsultations,
        recent_applications: recentApplications,
        notifications: recentNotifications || []
      },
      quick_actions: [
        { action: 'invite_client', label: 'Invite New Client', icon: 'user-plus' },
        { action: 'schedule_consultation', label: 'Schedule Consultation', icon: 'calendar-plus' },
        { action: 'view_reports', label: 'View Reports', icon: 'chart-bar' },
        { action: 'manage_admins', label: 'Manage Admins', icon: 'users-cog' },
        { action: 'system_settings', label: 'System Settings', icon: 'cog' }
      ]
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard data' });
  }
});

// GET /api/admin-dashboard/clients - Get all clients for admin
router.get('/clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;

    let query = supabaseAdmin
      .from('clients')
      .select('id, full_name, email, phone, onboarding_complete, created_at, last_login_at, profile_picture_url, current_job_title, current_company')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'active') {
      query = query.eq('onboarding_complete', true);
    } else if (status === 'pending') {
      query = query.eq('onboarding_complete', false);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: clients, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }

    res.json({
      clients: clients || [],
      total: clients?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Admin clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/admin-dashboard/analytics - Get detailed analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get data for the period
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('created_at, onboarding_complete')
      .gte('created_at', startDate.toISOString())
      .neq('role', 'admin');

    const { data: consultations } = await supabaseAdmin
      .from('consultations')
      .select('created_at, status, scheduled_at')
      .gte('created_at', startDate.toISOString());

    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString());

    // Process data for charts
    const analytics = {
      period,
      client_growth: processTimeSeriesData(clients || [], 'created_at'),
      consultation_trends: processTimeSeriesData(consultations || [], 'created_at'),
      application_trends: processTimeSeriesData(applications || [], 'created_at'),
      success_metrics: {
        onboarding_rate: clients ? (clients.filter(c => c.onboarding_complete).length / clients.length * 100).toFixed(1) : 0,
        consultation_completion_rate: consultations ? (consultations.filter(c => c.status === 'completed').length / consultations.length * 100).toFixed(1) : 0,
        application_success_rate: applications ? (applications.filter(a => a.status === 'offer').length / applications.length * 100).toFixed(1) : 0
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Helper function to process time series data
function processTimeSeriesData(data, dateField) {
  const dailyCounts = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  return Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = router;