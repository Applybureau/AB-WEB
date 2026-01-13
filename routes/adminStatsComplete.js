const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// GET /api/admin/stats - Get comprehensive admin statistics (PROTECTED)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get consultation request statistics
    const { data: consultationRequests, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('status, created_at');

    if (consultationError) {
      console.error('Error fetching consultation requests:', consultationError);
    }

    // Get client statistics
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('registered_users')
      .select('package_tier, package_expiry, status, created_at')
      .eq('role', 'client');

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    }

    // Get application statistics
    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('applications')
      .select('status, applied_date, interview_date');

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
    }

    // Get contact request statistics
    const { data: contactRequests, error: contactError } = await supabaseAdmin
      .from('contact_requests')
      .select('status, created_at');

    if (contactError) {
      console.error('Error fetching contact requests:', contactError);
    }

    // Calculate consultation request statistics
    const consultationStats = {
      total: consultationRequests?.length || 0,
      pending: consultationRequests?.filter(req => req.status === 'pending').length || 0,
      confirmed: consultationRequests?.filter(req => req.status === 'confirmed').length || 0,
      rescheduled: consultationRequests?.filter(req => req.status === 'rescheduled').length || 0,
      waitlisted: consultationRequests?.filter(req => req.status === 'waitlisted').length || 0,
      rejected: consultationRequests?.filter(req => req.status === 'rejected').length || 0
    };

    // Calculate client statistics
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const clientStats = {
      active: clients?.filter(client => client.status === 'active').length || 0,
      tier1: clients?.filter(client => client.package_tier === 'Tier 1').length || 0,
      tier2: clients?.filter(client => client.package_tier === 'Tier 2').length || 0,
      tier3: clients?.filter(client => client.package_tier === 'Tier 3').length || 0,
      expiring_soon: clients?.filter(client => 
        client.package_expiry && 
        new Date(client.package_expiry) <= sevenDaysFromNow &&
        new Date(client.package_expiry) > now
      ).length || 0
    };

    // Calculate application statistics
    const applicationStats = {
      total_submitted: applications?.length || 0,
      pending: applications?.filter(app => app.status === 'pending').length || 0,
      interview_scheduled: applications?.filter(app => app.status === 'interview_scheduled').length || 0,
      offers_received: applications?.filter(app => app.status === 'offer_received').length || 0,
      rejected: applications?.filter(app => app.status === 'rejected').length || 0
    };

    // Calculate contact request statistics
    const inquiryStats = {
      total: contactRequests?.length || 0,
      new: contactRequests?.filter(req => req.status === 'new').length || 0,
      in_progress: contactRequests?.filter(req => req.status === 'in_progress').length || 0,
      handled: contactRequests?.filter(req => req.status === 'handled').length || 0
    };

    // Calculate performance metrics
    const totalInterviews = applications?.filter(app => app.interview_date).length || 0;
    const totalOffers = applications?.filter(app => app.status === 'offer_received').length || 0;
    const totalApplications = applications?.length || 0;

    // Calculate average time to interview (simplified calculation)
    const applicationsWithInterviews = applications?.filter(app => 
      app.interview_date && app.applied_date
    ) || [];

    let averageTimeToInterview = 0;
    if (applicationsWithInterviews.length > 0) {
      const totalDays = applicationsWithInterviews.reduce((sum, app) => {
        const appliedDate = new Date(app.applied_date);
        const interviewDate = new Date(app.interview_date);
        const daysDiff = Math.ceil((interviewDate - appliedDate) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }, 0);
      averageTimeToInterview = Math.round(totalDays / applicationsWithInterviews.length);
    }

    const performanceStats = {
      average_time_to_interview: averageTimeToInterview,
      interview_success_rate: totalApplications > 0 ? parseFloat((totalInterviews / totalApplications).toFixed(2)) : 0,
      offer_acceptance_rate: totalOffers > 0 ? 0.85 : 0, // Placeholder - would need offer acceptance tracking
      client_satisfaction: 4.7 // Placeholder - would need satisfaction surveys
    };

    // Revenue statistics (placeholder - would need actual payment tracking)
    const revenueStats = {
      monthly: 45000,
      quarterly: 135000,
      annual: 540000
    };

    // Compile complete statistics
    const stats = {
      consultation_requests: consultationStats,
      clients: clientStats,
      applications: applicationStats,
      inquiries: inquiryStats,
      revenue: revenueStats,
      performance: performanceStats
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch admin statistics',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/admin/clients - Get client management data (PROTECTED)
router.get('/clients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      package_tier, 
      limit = 50, 
      page = 1, 
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('registered_users')
      .select(`
        id,
        full_name,
        email,
        phone,
        status,
        package_tier,
        package_expiry,
        profile_completion,
        profile_picture,
        linkedin_url,
        current_job,
        target_job,
        country,
        user_location,
        created_at,
        updated_at,
        last_login
      `, { count: 'exact' })
      .eq('role', 'client');

    if (status) {
      query = query.eq('status', status);
    }

    if (package_tier) {
      query = query.eq('package_tier', package_tier);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,current_job.ilike.%${search}%`);
    }

    // Apply sorting
    const ascending = sort_order === 'asc';
    query = query.order(sort_by, { ascending });

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch clients',
        code: 'DATABASE_ERROR'
      });
    }

    // Get application counts for each client
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        const { data: applications } = await supabaseAdmin
          .from('applications')
          .select('status')
          .eq('clientId', client.id);

        const applicationStats = {
          total: applications?.length || 0,
          pending: applications?.filter(app => app.status === 'pending').length || 0,
          interviews: applications?.filter(app => app.status === 'interview_scheduled').length || 0,
          offers: applications?.filter(app => app.status === 'offer_received').length || 0
        };

        return {
          ...client,
          application_stats: applicationStats,
          package_status: client.package_expiry ? 
            (new Date(client.package_expiry) > new Date() ? 'active' : 'expired') : 'no_package'
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / parseInt(limit));

    res.json({
      success: true,
      data: clientsWithStats,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch clients',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/admin/dashboard - Get admin dashboard overview (PROTECTED)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get recent activity counts
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Recent consultation requests
    const { data: recentConsultations } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent contact requests
    const { data: recentContacts } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent client registrations
    const { data: recentClients } = await supabaseAdmin
      .from('registered_users')
      .select('id, full_name, email, created_at')
      .eq('role', 'client')
      .gte('created_at', lastWeek.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // Pending items requiring attention
    const { data: pendingConsultations } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, fullName, email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: newContacts } = await supabaseAdmin
      .from('contact_requests')
      .select('id, firstName, lastName, subject, created_at')
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(10);

    // Quick stats
    const { data: todayConsultations } = await supabaseAdmin
      .from('consultation_requests')
      .select('id')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    const { data: todayContacts } = await supabaseAdmin
      .from('contact_requests')
      .select('id')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    const dashboardData = {
      quick_stats: {
        consultations_today: todayConsultations?.length || 0,
        contacts_today: todayContacts?.length || 0,
        pending_consultations: pendingConsultations?.length || 0,
        new_contacts: newContacts?.length || 0
      },
      recent_activity: {
        consultations: recentConsultations?.map(consultation => ({
          id: consultation.id,
          fullName: consultation.fullName,
          email: consultation.email,
          status: consultation.status,
          created_at: consultation.created_at
        })) || [],
        contacts: recentContacts?.map(contact => ({
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          subject: contact.subject,
          status: contact.status,
          created_at: contact.created_at
        })) || [],
        clients: recentClients?.map(client => ({
          id: client.id,
          full_name: client.full_name,
          email: client.email,
          created_at: client.created_at
        })) || []
      },
      pending_items: {
        consultations: pendingConsultations?.map(consultation => ({
          id: consultation.id,
          fullName: consultation.fullName,
          email: consultation.email,
          created_at: consultation.created_at
        })) || [],
        contacts: newContacts?.map(contact => ({
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          subject: contact.subject,
          created_at: contact.created_at
        })) || []
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch admin dashboard data',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;