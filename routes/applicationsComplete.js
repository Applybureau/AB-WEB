const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/applications - Create new application (PROTECTED)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      company,
      role,
      jobLink,
      status = 'pending',
      salary_range,
      location,
      application_method,
      notes
    } = req.body;

    const clientId = req.user.id;

    // Validate required fields
    if (!company || !role) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: company, role',
        code: 'VALIDATION_ERROR'
      });
    }

    // Create application record
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .insert({
        clientId,
        company,
        role,
        status,
        job_link: jobLink,
        salary_range,
        location,
        application_method,
        notes,
        applied_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create application',
        code: 'DATABASE_ERROR'
      });
    }

    // Get client info for email
    const { data: client } = await supabaseAdmin
      .from('registered_users')
      .select('full_name, email')
      .eq('id', clientId)
      .single();

    // Send confirmation email to client
    try {
      if (client) {
        await sendEmail(client.email, 'application_status_update', {
          client_name: client.full_name,
          company: company,
          role: role,
          status: 'submitted',
          status_message: 'Your application has been successfully submitted and is being tracked.',
          next_steps: 'We will notify you of any updates to your application status.'
        });
      }
    } catch (emailError) {
      console.error('Failed to send application confirmation email:', emailError);
    }

    // Format response to match specification
    const formattedApplication = {
      id: application.id,
      company: application.company,
      role: application.role,
      status: application.status,
      applied_date: application.applied_date,
      job_link: application.job_link,
      salary_range: application.salary_range,
      location: application.location,
      application_method: application.application_method,
      notes: application.notes,
      interview_date: application.interview_date,
      interview_type: application.interview_type,
      interviewer: application.interviewer,
      meeting_link: application.meeting_link,
      created_at: application.created_at,
      updated_at: application.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: formattedApplication
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create application',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/client/applications - Get client applications (PROTECTED)
router.get('/client/applications', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, limit = 50, offset = 0, company, role } = req.query;

    let query = supabaseAdmin
      .from('applications')
      .select('*')
      .eq('clientId', clientId)
      .order('applied_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (company) {
      query = query.ilike('company', `%${company}%`);
    }

    if (role) {
      query = query.ilike('role', `%${role}%`);
    }

    if (limit) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    }

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching client applications:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch applications',
        code: 'DATABASE_ERROR'
      });
    }

    // Format applications to match specification
    const formattedApplications = applications?.map(app => ({
      id: app.id,
      company: app.company,
      role: app.role,
      status: app.status,
      applied_date: app.applied_date,
      job_link: app.job_link,
      salary_range: app.salary_range,
      location: app.location,
      application_method: app.application_method,
      notes: app.notes,
      interview_date: app.interview_date,
      interview_type: app.interview_type,
      interviewer: app.interviewer,
      meeting_link: app.meeting_link,
      created_at: app.created_at,
      updated_at: app.updated_at
    })) || [];

    res.json({
      success: true,
      data: formattedApplications,
      total: count || formattedApplications.length,
      page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      limit: parseInt(limit),
      totalPages: Math.ceil((count || formattedApplications.length) / parseInt(limit))
    });
  } catch (error) {
    console.error('Get client applications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applications',
      code: 'SERVER_ERROR'
    });
  }
});

// PATCH /api/applications/:id - Update application status (PROTECTED)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      interview_date,
      interview_type,
      interviewer,
      meeting_link,
      notes,
      salary_range,
      location
    } = req.body;

    const clientId = req.user.id;

    // Build update data
    const updateData = {};
    if (status) updateData.status = status;
    if (interview_date) updateData.interview_date = interview_date;
    if (interview_type) updateData.interview_type = interview_type;
    if (interviewer) updateData.interviewer = interviewer;
    if (meeting_link) updateData.meeting_link = meeting_link;
    if (notes) updateData.notes = notes;
    if (salary_range) updateData.salary_range = salary_range;
    if (location) updateData.location = location;

    // Update application
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('clientId', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update application',
        code: 'DATABASE_ERROR'
      });
    }

    if (!application) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found',
        code: 'NOT_FOUND'
      });
    }

    // Get client info for email
    const { data: client } = await supabaseAdmin
      .from('registered_users')
      .select('full_name, email')
      .eq('id', clientId)
      .single();

    // Send status update email
    try {
      if (client && status) {
        let statusMessage = '';
        let nextSteps = '';

        switch (status) {
          case 'interview_scheduled':
            statusMessage = `Great news! Your interview with ${application.company} has been scheduled.`;
            nextSteps = 'Prepare for your interview and review the company information.';
            break;
          case 'interview_completed':
            statusMessage = `Your interview with ${application.company} has been completed.`;
            nextSteps = 'We will update you when we receive feedback from the company.';
            break;
          case 'offer_received':
            statusMessage = `Congratulations! You have received an offer from ${application.company}.`;
            nextSteps = 'Review the offer details and let us know if you need assistance with negotiation.';
            break;
          case 'offer_accepted':
            statusMessage = `Congratulations! You have accepted the offer from ${application.company}.`;
            nextSteps = 'Prepare for your new role and complete any onboarding requirements.';
            break;
          case 'rejected':
            statusMessage = `Unfortunately, your application with ${application.company} was not successful.`;
            nextSteps = 'Don\'t be discouraged. Let\'s review feedback and continue with other opportunities.';
            break;
          default:
            statusMessage = `Your application status with ${application.company} has been updated to ${status}.`;
            nextSteps = 'We will keep you informed of any further developments.';
        }

        await sendEmail(client.email, 'application_status_update', {
          client_name: client.full_name,
          company: application.company,
          role: application.role,
          status: status,
          status_message: statusMessage,
          next_steps: nextSteps,
          interview_date: interview_date || null,
          meeting_link: meeting_link || null
        });
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    // Format response
    const formattedApplication = {
      id: application.id,
      company: application.company,
      role: application.role,
      status: application.status,
      applied_date: application.applied_date,
      job_link: application.job_link,
      salary_range: application.salary_range,
      location: application.location,
      application_method: application.application_method,
      notes: application.notes,
      interview_date: application.interview_date,
      interview_type: application.interview_type,
      interviewer: application.interviewer,
      meeting_link: application.meeting_link,
      created_at: application.created_at,
      updated_at: application.updated_at
    };

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: formattedApplication
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update application',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE /api/applications/:id - Delete application (PROTECTED)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;

    // Delete application
    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('clientId', clientId);

    if (error) {
      console.error('Error deleting application:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete application',
        code: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete application',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/applications/stats - Get application statistics (PROTECTED)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('status, applied_date, interview_date')
      .eq('clientId', clientId);

    if (error) {
      console.error('Error fetching application stats:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch application statistics',
        code: 'DATABASE_ERROR'
      });
    }

    // Calculate statistics
    const stats = {
      total_applications: applications?.length || 0,
      pending: applications?.filter(app => app.status === 'pending').length || 0,
      interview_scheduled: applications?.filter(app => app.status === 'interview_scheduled').length || 0,
      interview_completed: applications?.filter(app => app.status === 'interview_completed').length || 0,
      offers_received: applications?.filter(app => app.status === 'offer_received').length || 0,
      offers_accepted: applications?.filter(app => app.status === 'offer_accepted').length || 0,
      rejected: applications?.filter(app => app.status === 'rejected').length || 0,
      this_month: applications?.filter(app => {
        const appDate = new Date(app.applied_date);
        const now = new Date();
        return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
      }).length || 0,
      upcoming_interviews: applications?.filter(app => 
        app.interview_date && new Date(app.interview_date) > new Date()
      ).length || 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch application statistics',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;