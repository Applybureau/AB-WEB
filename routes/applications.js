const express = require('express');
const { supabase, supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { validate, schemas } = require('../utils/validation');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// GET /api/applications - Get client's applications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, limit = 20, offset = 0, sort = 'created_at', order = 'desc' } = req.query;

    let query = supabase
      .from('applications')
      .select('*')
      .eq('client_id', clientId)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    res.json({
      applications,
      total: applications.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// POST /api/applications - Admin adds application
router.post('/', authenticateToken, requireAdmin, validate(schemas.application), async (req, res) => {
  try {
    const { client_id, job_title, company, job_link, status = 'applied' } = req.body;

    // Verify client exists
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Create application
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .insert({
        client_id,
        job_title,
        company,
        job_link,
        status,
        date_applied: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({ error: 'Failed to create application' });
    }

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        client_id,
        type: 'application_added',
        title: 'New Application Added',
        message: `Application for ${job_title} at ${company} has been added to your profile`,
        read: false
      });

    res.status(201).json({
      message: 'Application created successfully',
      application
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// GET /api/applications/:id - Get specific application
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;

    let query = supabase
      .from('applications')
      .select('*')
      .eq('id', id);

    // Non-admin users can only see their own applications
    if (req.user.role !== 'admin') {
      query = query.eq('client_id', clientId);
    }

    const { data: application, error } = await query.single();

    if (error || !application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// PATCH /api/applications/:id - Update application
router.patch('/:id', authenticateToken, requireAdmin, validate(schemas.updateApplication), async (req, res) => {
  try {
    const { id } = req.params;
    const { job_title, company, job_link, status } = req.body;

    // Get current application data
    const { data: currentApp, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*, clients(full_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !currentApp) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updateData = {};
    if (job_title) updateData.job_title = job_title;
    if (company) updateData.company = company;
    if (job_link !== undefined) updateData.job_link = job_link;
    if (status) updateData.status = status;

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select('*, clients(full_name, email)')
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return res.status(500).json({ error: 'Failed to update application' });
    }

    // If status changed, send notification and email
    if (status && status !== currentApp.status) {
      const statusMessages = {
        applied: 'Your application has been submitted',
        interview: 'Great news! You have an interview scheduled',
        offer: 'Congratulations! You received a job offer',
        rejected: 'Unfortunately, this application was not successful',
        withdrawn: 'This application has been withdrawn'
      };

      const nextSteps = {
        applied: 'We\'ll keep you updated on any progress.',
        interview: 'Prepare well and showcase your skills!',
        offer: 'Review the offer details and let us know if you need guidance.',
        rejected: 'Don\'t get discouraged - every rejection brings you closer to the right opportunity.',
        withdrawn: 'Focus on your other active applications.'
      };

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          client_id: application.client_id,
          type: 'application_status_updated',
          title: 'Application Status Updated',
          message: `${application.job_title} at ${application.company}: ${statusMessages[status]}`,
          read: false
        });

      // Send email notification
      await sendEmail(application.clients.email, 'application_status_update', {
        client_name: application.clients.full_name,
        job_title: application.job_title,
        company: application.company,
        status: status,
        date_applied: new Date(application.date_applied).toLocaleDateString(),
        job_link: application.job_link,
        status_message: statusMessages[status],
        next_steps: nextSteps[status]
      });
    }

    res.json({
      message: 'Application updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// DELETE /api/applications/:id - Delete application
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      return res.status(500).json({ error: 'Failed to delete application' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// GET /api/applications/stats/summary - Get application statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: applications, error } = await supabase
      .from('applications')
      .select('status, created_at')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching application stats:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    const stats = {
      total: applications.length,
      by_status: {
        applied: applications.filter(app => app.status === 'applied').length,
        interview: applications.filter(app => app.status === 'interview').length,
        offer: applications.filter(app => app.status === 'offer').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        withdrawn: applications.filter(app => app.status === 'withdrawn').length
      },
      success_rate: applications.length > 0 
        ? ((applications.filter(app => app.status === 'offer').length / applications.length) * 100).toFixed(1)
        : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Application stats error:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

module.exports = router;