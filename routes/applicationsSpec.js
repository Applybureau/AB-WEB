const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// POST /api/applications - Log new application (PROTECTED - CLIENT)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      clientId,
      company,
      role,
      jobLink,
      status = 'pending'
    } = req.body;

    // Validate required fields
    if (!company || !role) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: company, role',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Use clientId from request or authenticated user
    const userId = clientId || req.user.userId || req.user.id;

    // Verify user exists and is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'client' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Only clients can log applications',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Create application record
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: userId,
        company,
        role,
        job_link: jobLink,
        status,
        applied_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to log application',
        code: 'DATABASE_ERROR'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Application logged successfully',
      application: {
        id: application.id,
        company: application.company,
        role: application.role,
        jobLink: application.job_link,
        status: application.status,
        applied_date: application.applied_date,
        created_at: application.created_at
      }
    });
  } catch (error) {
    console.error('Log application error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to log application',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/applications - Get applications (PROTECTED)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      clientId,
      status,
      company,
      limit = 50, 
      offset = 0,
      sort_by = 'applied_date',
      sort_order = 'desc'
    } = req.query;

    // Determine which user's applications to fetch
    let userId;
    if (req.user.role === 'admin' && clientId) {
      userId = clientId;
    } else if (req.user.role === 'client') {
      userId = req.user.userId || req.user.id;
    } else if (req.user.role === 'admin' && !clientId) {
      // Admin viewing all applications - don't filter by user
      userId = null;
    } else {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    let query = supabaseAdmin
      .from('applications')
      .select(`
        id, company, role, job_link, status, applied_date, 
        interview_date, offer_date, rejection_date, notes,
        created_at, updated_at,
        registered_users!inner(id, full_name, email)
      `)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply user filter if specified
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply other filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (company) {
      query = query.ilike('company', `%${company}%`);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch applications',
        code: 'DATABASE_ERROR'
      });
    }

    // Format applications according to spec
    const formattedApplications = (applications || []).map(app => ({
      id: app.id,
      clientId: app.registered_users.id,
      clientName: app.registered_users.full_name,
      clientEmail: app.registered_users.email,
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
    }));

    res.json({
      success: true,
      applications: formattedApplications,
      total: applications?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applications',
      code: 'INTERNAL_ERROR'
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
      offer_date, 
      rejection_date, 
      notes 
    } = req.body;

    // Get current application
    const { data: currentApp, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*, registered_users!inner(id, full_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !currentApp) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found',
        code: 'NOT_FOUND'
      });
    }

    // Check permissions
    const userId = req.user.userId || req.user.id;
    if (req.user.role !== 'admin' && currentApp.user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Prepare update data
    let updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      
      // Set appropriate date fields based on status
      if (status === 'interview' && interview_date) {
        updateData.interview_date = interview_date;
      } else if (status === 'offer' && offer_date) {
        updateData.offer_date = offer_date;
      } else if (status === 'rejected' && rejection_date) {
        updateData.rejection_date = rejection_date;
      }
    }

    if (interview_date !== undefined) {
      updateData.interview_date = interview_date;
    }

    if (offer_date !== undefined) {
      updateData.offer_date = offer_date;
    }

    if (rejection_date !== undefined) {
      updateData.rejection_date = rejection_date;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update application
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        *, 
        registered_users!inner(id, full_name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update application',
        code: 'UPDATE_ERROR'
      });
    }

    // Format response
    const formattedApp = {
      id: updatedApp.id,
      clientId: updatedApp.registered_users.id,
      clientName: updatedApp.registered_users.full_name,
      clientEmail: updatedApp.registered_users.email,
      company: updatedApp.company,
      role: updatedApp.role,
      jobLink: updatedApp.job_link,
      status: updatedApp.status,
      applied_date: updatedApp.applied_date,
      interview_date: updatedApp.interview_date,
      offer_date: updatedApp.offer_date,
      rejection_date: updatedApp.rejection_date,
      notes: updatedApp.notes,
      created_at: updatedApp.created_at,
      updated_at: updatedApp.updated_at
    };

    res.json({
      success: true,
      message: 'Application updated successfully',
      application: formattedApp
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update application',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/applications/:id - Delete application (PROTECTED)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current application
    const { data: currentApp, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentApp) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found',
        code: 'NOT_FOUND'
      });
    }

    // Check permissions
    const userId = req.user.userId || req.user.id;
    if (req.user.role !== 'admin' && currentApp.user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Delete application
    const { error: deleteError } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting application:', deleteError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete application',
        code: 'DELETE_ERROR'
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
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;