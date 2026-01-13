const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// GET /api/applications/weekly - Get applications grouped by week (PROTECTED - CLIENT)
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      weeks_back = 12, // Default to 12 weeks of data
      include_empty_weeks = false 
    } = req.query;

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Only clients can view weekly applications',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Calculate date range for weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks_back * 7));

    // Get applications grouped by week
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id, company, job_title, job_url, status, date_applied, 
        interview_date, offer_date, rejection_date, admin_notes,
        week_start, concierge_note,
        created_at, updated_at
      `)
      .eq('client_id', userId)
      .gte('applied_date', startDate.toISOString())
      .lte('applied_date', endDate.toISOString())
      .order('week_start', { ascending: false })
      .order('applied_date', { ascending: false });

    if (error) {
      console.error('Error fetching weekly applications:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch weekly applications',
        code: 'DATABASE_ERROR'
      });
    }

    // Group applications by week_start
    const weeklyGroups = {};
    const applicationsByWeek = applications || [];

    applicationsByWeek.forEach(app => {
      const weekKey = app.week_start || 'unknown';
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = {
          week_start: app.week_start,
          week_label: app.week_start ? formatWeekLabel(new Date(app.week_start)) : 'Unknown Week',
          applications: [],
          total_applications: 0,
          status_breakdown: {
            pending: 0,
            interview: 0,
            offer: 0,
            rejected: 0
          },
          concierge_note: app.concierge_note || null
        };
      }

      weeklyGroups[weekKey].applications.push({
        id: app.id,
        company: app.company,
        role: app.role,
        jobLink: app.job_link,
        status: app.status,
        applied_date: app.applied_date,
        interview_date: app.interview_date,
        offer_date: app.offer_date,
        rejection_date: app.rejection_date,
        notes: app.notes,
        created_at: app.created_at,
        updated_at: app.updated_at
      });

      weeklyGroups[weekKey].total_applications++;
      weeklyGroups[weekKey].status_breakdown[app.status] = 
        (weeklyGroups[weekKey].status_breakdown[app.status] || 0) + 1;
    });

    // Convert to array and sort by week_start
    let weeklyData = Object.values(weeklyGroups);
    weeklyData.sort((a, b) => {
      if (!a.week_start) return 1;
      if (!b.week_start) return -1;
      return new Date(b.week_start) - new Date(a.week_start);
    });

    // Add empty weeks if requested
    if (include_empty_weeks === 'true') {
      weeklyData = addEmptyWeeks(weeklyData, startDate, endDate);
    }

    // Calculate summary statistics
    const totalApplications = applicationsByWeek.length;
    const statusSummary = {
      pending: applicationsByWeek.filter(app => app.status === 'pending').length,
      interview: applicationsByWeek.filter(app => app.status === 'interview').length,
      offer: applicationsByWeek.filter(app => app.status === 'offer').length,
      rejected: applicationsByWeek.filter(app => app.status === 'rejected').length
    };

    res.json({
      success: true,
      weekly_applications: weeklyData,
      summary: {
        total_applications: totalApplications,
        weeks_included: parseInt(weeks_back),
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        status_summary: statusSummary
      }
    });
  } catch (error) {
    console.error('Weekly applications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch weekly applications',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/applications/weekly/:week_start/note - Update concierge note for a week (PROTECTED - ADMIN)
router.patch('/weekly/:week_start/note', authenticateToken, async (req, res) => {
  try {
    const { week_start } = req.params;
    const { concierge_note, client_id } = req.body;
    const adminId = req.user.userId || req.user.id;

    // Verify admin permissions
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role, full_name')
      .eq('id', adminId)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (!client_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Client ID is required',
        code: 'MISSING_CLIENT_ID'
      });
    }

    // Validate week_start format
    const weekStartDate = new Date(week_start);
    if (isNaN(weekStartDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid week_start format',
        code: 'INVALID_DATE_FORMAT'
      });
    }

    // Update all applications for this user and week with the concierge note
    const { data: updatedApps, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        concierge_note: concierge_note,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', client_id)
      .eq('week_start', weekStartDate.toISOString())
      .select('id, company, role');

    if (updateError) {
      console.error('Error updating concierge note:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update concierge note',
        code: 'UPDATE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Concierge note updated successfully',
      updated_applications: updatedApps?.length || 0,
      week_start: weekStartDate.toISOString(),
      concierge_note: concierge_note
    });
  } catch (error) {
    console.error('Update concierge note error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update concierge note',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/applications/weekly/:client_id - Admin view of client's weekly applications
router.get('/admin/weekly/:client_id', authenticateToken, async (req, res) => {
  try {
    const { client_id } = req.params;
    const { weeks_back = 12 } = req.query;
    const adminId = req.user.userId || req.user.id;

    // Verify admin permissions
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role')
      .eq('id', adminId)
      .single();

    if (adminError || !admin || admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get client info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('id, full_name, email')
      .eq('id', client_id)
      .eq('role', 'client')
      .single();

    if (clientError || !client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks_back * 7));

    // Get applications grouped by week
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id, company, role, job_link, status, applied_date, 
        interview_date, offer_date, rejection_date, notes,
        week_start, concierge_note,
        created_at, updated_at
      `)
      .eq('client_id', client_id)
      .gte('applied_date', startDate.toISOString())
      .lte('applied_date', endDate.toISOString())
      .order('week_start', { ascending: false })
      .order('applied_date', { ascending: false });

    if (error) {
      console.error('Error fetching client weekly applications:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch client weekly applications',
        code: 'DATABASE_ERROR'
      });
    }

    // Group applications by week (same logic as client endpoint)
    const weeklyGroups = {};
    const applicationsByWeek = applications || [];

    applicationsByWeek.forEach(app => {
      const weekKey = app.week_start || 'unknown';
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = {
          week_start: app.week_start,
          week_label: app.week_start ? formatWeekLabel(new Date(app.week_start)) : 'Unknown Week',
          applications: [],
          total_applications: 0,
          status_breakdown: {
            pending: 0,
            interview: 0,
            offer: 0,
            rejected: 0
          },
          concierge_note: app.concierge_note || null
        };
      }

      weeklyGroups[weekKey].applications.push({
        id: app.id,
        company: app.company,
        role: app.role,
        jobLink: app.job_link,
        status: app.status,
        applied_date: app.applied_date,
        interview_date: app.interview_date,
        offer_date: app.offer_date,
        rejection_date: app.rejection_date,
        notes: app.notes,
        created_at: app.created_at,
        updated_at: app.updated_at
      });

      weeklyGroups[weekKey].total_applications++;
      weeklyGroups[weekKey].status_breakdown[app.status] = 
        (weeklyGroups[weekKey].status_breakdown[app.status] || 0) + 1;
    });

    // Convert to array and sort
    let weeklyData = Object.values(weeklyGroups);
    weeklyData.sort((a, b) => {
      if (!a.week_start) return 1;
      if (!b.week_start) return -1;
      return new Date(b.week_start) - new Date(a.week_start);
    });

    // Calculate summary
    const totalApplications = applicationsByWeek.length;
    const statusSummary = {
      pending: applicationsByWeek.filter(app => app.status === 'pending').length,
      interview: applicationsByWeek.filter(app => app.status === 'interview').length,
      offer: applicationsByWeek.filter(app => app.status === 'offer').length,
      rejected: applicationsByWeek.filter(app => app.status === 'rejected').length
    };

    res.json({
      success: true,
      client: {
        id: client.id,
        full_name: client.full_name,
        email: client.email
      },
      weekly_applications: weeklyData,
      summary: {
        total_applications: totalApplications,
        weeks_included: parseInt(weeks_back),
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        status_summary: statusSummary
      }
    });
  } catch (error) {
    console.error('Admin weekly applications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch client weekly applications',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Helper function to format week labels
function formatWeekLabel(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const options = { month: 'short', day: 'numeric' };
  const startStr = weekStart.toLocaleDateString('en-US', options);
  const endStr = weekEnd.toLocaleDateString('en-US', options);
  
  return `${startStr} - ${endStr}`;
}

// Helper function to add empty weeks
function addEmptyWeeks(weeklyData, startDate, endDate) {
  const allWeeks = [];
  const existingWeeks = new Set(weeklyData.map(w => w.week_start));
  
  // Generate all weeks in range
  const currentWeek = new Date(startDate);
  currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Start of week (Monday)
  
  while (currentWeek <= endDate) {
    const weekKey = currentWeek.toISOString();
    
    if (existingWeeks.has(weekKey)) {
      // Add existing week data
      allWeeks.push(weeklyData.find(w => w.week_start === weekKey));
    } else {
      // Add empty week
      allWeeks.push({
        week_start: weekKey,
        week_label: formatWeekLabel(new Date(currentWeek)),
        applications: [],
        total_applications: 0,
        status_breakdown: {
          pending: 0,
          interview: 0,
          offer: 0,
          rejected: 0
        },
        concierge_note: null
      });
    }
    
    currentWeek.setDate(currentWeek.getDate() + 7);
  }
  
  return allWeeks.reverse(); // Most recent first
}

module.exports = router;