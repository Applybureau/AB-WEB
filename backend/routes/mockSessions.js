const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin, requireClient } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { 
  createSuccessResponse, 
  createPaginatedResponse,
  handleValidationError,
  handleNotFoundError,
  handleDatabaseError,
  handleBusinessLogicError,
  ERROR_CODES 
} = require('../middleware/errorHandler');
const { 
  parsePaginationParams, 
  addValidSortFields, 
  paginateResults 
} = require('../middleware/pagination');

const router = express.Router();

// POST /api/client/mock-sessions - Schedule mock session (CLIENT ONLY)
router.post('/', authenticateToken, requireClient, async (req, res) => {
  try {
    const {
      session_type,
      preferred_date,
      focus_areas = [],
      preparation_level = 'intermediate',
      specific_company,
      notes
    } = req.body;

    const clientId = req.user.id;

    // Validate required fields
    const requiredFields = ['session_type', 'preferred_date'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return handleValidationError(req, res, [
        `Missing required fields: ${missingFields.join(', ')}`
      ]);
    }

    // Validate session_type
    const validSessionTypes = [
      'Technical Interview', 'Behavioral Interview', 'System Design', 
      'Coding Challenge', 'Case Study', 'Presentation', 'General Interview'
    ];
    if (!validSessionTypes.includes(session_type)) {
      return handleValidationError(req, res, [
        `Invalid session_type. Valid options: ${validSessionTypes.join(', ')}`
      ]);
    }

    // Validate preparation_level
    const validPreparationLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validPreparationLevels.includes(preparation_level)) {
      return handleValidationError(req, res, [
        `Invalid preparation_level. Valid options: ${validPreparationLevels.join(', ')}`
      ]);
    }

    // Validate preferred_date
    const scheduledDate = new Date(preferred_date);
    if (isNaN(scheduledDate.getTime())) {
      return handleValidationError(req, res, ['Invalid preferred_date format']);
    }

    // Check if date is in the future
    if (scheduledDate <= new Date()) {
      return handleValidationError(req, res, ['preferred_date must be in the future']);
    }

    // Create mock session
    const { data: mockSession, error } = await supabaseAdmin
      .from('mock_sessions')
      .insert({
        client_id: clientId,
        session_type,
        scheduled_date: scheduledDate.toISOString(),
        focus_areas,
        preparation_level,
        specific_company,
        notes,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mock session:', error);
      return handleDatabaseError(req, res, error, 'Failed to schedule mock session');
    }

    // Send confirmation email to client
    try {
      const { data: client } = await supabaseAdmin
        .from('registered_users')
        .select('full_name, email')
        .eq('id', clientId)
        .single();

      if (client) {
        await sendEmail(client.email, 'meeting_scheduled', {
          client_name: client.full_name,
          session_type: session_type,
          scheduled_date: scheduledDate.toLocaleDateString(),
          scheduled_time: scheduledDate.toLocaleTimeString(),
          focus_areas: focus_areas.join(', ') || 'General interview skills',
          preparation_level: preparation_level,
          specific_company: specific_company || 'General preparation',
          next_steps: 'You will receive a meeting link 24 hours before your session.'
        });
      }
    } catch (emailError) {
      console.error('Failed to send mock session confirmation email:', emailError);
    }

    // Send notification to admin
    try {
      await sendEmail(process.env.ADMIN_EMAIL || 'admin@applybureau.com', 'new_consultation_request', {
        client_name: req.user.full_name || 'Client',
        client_email: req.user.email,
        session_type: session_type,
        scheduled_date: scheduledDate.toLocaleDateString(),
        scheduled_time: scheduledDate.toLocaleTimeString(),
        focus_areas: focus_areas.join(', ') || 'General interview skills',
        preparation_level: preparation_level,
        specific_company: specific_company || 'Not specified',
        notes: notes || 'No additional notes',
        admin_dashboard_link: `${process.env.FRONTEND_URL}/admin/mock-sessions/${mockSession.id}`
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    // Format response according to specification
    const responseData = {
      id: mockSession.id,
      session_type: mockSession.session_type,
      scheduled_date: mockSession.scheduled_date,
      coach: mockSession.coach,
      coach_profile: mockSession.coach_profile || {},
      status: mockSession.status,
      meeting_link: mockSession.meeting_link,
      focus_areas: mockSession.focus_areas || [],
      preparation_level: mockSession.preparation_level,
      specific_company: mockSession.specific_company,
      notes: mockSession.notes,
      preparation_materials: mockSession.preparation_materials || [],
      feedback: mockSession.feedback,
      created_at: mockSession.created_at
    };

    res.status(201).json(createSuccessResponse(
      responseData,
      'Mock session scheduled successfully'
    ));
  } catch (error) {
    console.error('Mock session scheduling error:', error);
    return handleDatabaseError(req, res, error, 'Failed to schedule mock session');
  }
});

// GET /api/client/mock-sessions - Get client's mock sessions (CLIENT ONLY)
router.get('/', 
  authenticateToken, 
  requireClient,
  addValidSortFields(['scheduled_date', 'created_at', 'session_type', 'status']),
  parsePaginationParams,
  async (req, res) => {
    try {
      const clientId = req.user.id;

      // Add search fields for filtering
      req.searchFields = ['session_type', 'coach', 'specific_company', 'notes'];

      // Base query
      const baseQuery = supabaseAdmin
        .from('mock_sessions')
        .select(`
          id,
          session_type,
          scheduled_date,
          coach,
          coach_profile,
          status,
          meeting_link,
          focus_areas,
          preparation_level,
          specific_company,
          notes,
          preparation_materials,
          feedback,
          overall_rating,
          technical_skills,
          communication,
          problem_solving,
          strengths,
          areas_for_improvement,
          recommendations,
          next_session_suggestions,
          created_at,
          updated_at
        `)
        .eq('client_id', clientId);

      // Count query
      const countQuery = supabaseAdmin
        .from('mock_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

      // Get paginated results
      const result = await paginateResults(baseQuery, countQuery, req);

      // Format response data
      const formattedData = result.data.map(session => ({
        id: session.id,
        session_type: session.session_type,
        scheduled_date: session.scheduled_date,
        coach: session.coach,
        coach_profile: session.coach_profile || {},
        status: session.status,
        meeting_link: session.meeting_link,
        focus_areas: session.focus_areas || [],
        preparation_level: session.preparation_level,
        specific_company: session.specific_company,
        notes: session.notes,
        preparation_materials: session.preparation_materials || [],
        feedback: session.feedback,
        overall_rating: session.overall_rating,
        technical_skills: session.technical_skills,
        communication: session.communication,
        problem_solving: session.problem_solving,
        strengths: session.strengths || [],
        areas_for_improvement: session.areas_for_improvement || [],
        recommendations: session.recommendations || [],
        next_session_suggestions: session.next_session_suggestions,
        created_at: session.created_at
      }));

      res.json(createPaginatedResponse(
        formattedData,
        result.pagination,
        'Mock sessions retrieved successfully'
      ));
    } catch (error) {
      console.error('Error fetching mock sessions:', error);
      return handleDatabaseError(req, res, error, 'Failed to fetch mock sessions');
    }
  }
);

// GET /api/admin/mock-sessions - Get all mock sessions (ADMIN ONLY)
router.get('/admin', 
  authenticateToken, 
  requireAdmin,
  addValidSortFields(['scheduled_date', 'created_at', 'session_type', 'status', 'coach']),
  parsePaginationParams,
  async (req, res) => {
    try {
      // Add search fields for filtering
      req.searchFields = ['session_type', 'coach', 'specific_company'];

      // Base query with client information
      const baseQuery = supabaseAdmin
        .from('mock_sessions')
        .select(`
          id,
          client_id,
          session_type,
          scheduled_date,
          coach,
          coach_profile,
          status,
          meeting_link,
          focus_areas,
          preparation_level,
          specific_company,
          notes,
          preparation_materials,
          feedback,
          overall_rating,
          created_at,
          updated_at,
          registered_users!inner(full_name, email)
        `);

      // Count query
      const countQuery = supabaseAdmin
        .from('mock_sessions')
        .select('*', { count: 'exact', head: true });

      // Get paginated results
      const result = await paginateResults(baseQuery, countQuery, req);

      // Format response data
      const formattedData = result.data.map(session => ({
        id: session.id,
        client_id: session.client_id,
        client_name: session.registered_users?.full_name,
        client_email: session.registered_users?.email,
        session_type: session.session_type,
        scheduled_date: session.scheduled_date,
        coach: session.coach,
        coach_profile: session.coach_profile || {},
        status: session.status,
        meeting_link: session.meeting_link,
        focus_areas: session.focus_areas || [],
        preparation_level: session.preparation_level,
        specific_company: session.specific_company,
        notes: session.notes,
        preparation_materials: session.preparation_materials || [],
        feedback: session.feedback,
        overall_rating: session.overall_rating,
        created_at: session.created_at,
        updated_at: session.updated_at
      }));

      res.json(createPaginatedResponse(
        formattedData,
        result.pagination,
        'Mock sessions retrieved successfully'
      ));
    } catch (error) {
      console.error('Error fetching mock sessions for admin:', error);
      return handleDatabaseError(req, res, error, 'Failed to fetch mock sessions');
    }
  }
);

// PATCH /api/admin/mock-sessions/:id - Update mock session (ADMIN ONLY)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      coach,
      coach_profile,
      status,
      meeting_link,
      preparation_materials,
      scheduled_date
    } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'];
      if (!validStatuses.includes(status)) {
        return handleValidationError(req, res, [
          `Invalid status. Valid options: ${validStatuses.join(', ')}`
        ]);
      }
    }

    const updateData = {};
    
    if (coach) updateData.coach = coach;
    if (coach_profile) updateData.coach_profile = coach_profile;
    if (status) updateData.status = status;
    if (meeting_link) updateData.meeting_link = meeting_link;
    if (preparation_materials) updateData.preparation_materials = preparation_materials;
    if (scheduled_date) updateData.scheduled_date = scheduled_date;

    const { data: mockSession, error } = await supabaseAdmin
      .from('mock_sessions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        registered_users!inner(full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating mock session:', error);
      return handleDatabaseError(req, res, error, 'Failed to update mock session');
    }

    if (!mockSession) {
      return handleNotFoundError(req, res, 'Mock session');
    }

    // Send appropriate email based on status change
    try {
      const clientEmail = mockSession.registered_users?.email;
      const clientName = mockSession.registered_users?.full_name;

      if (status === 'scheduled' && meeting_link && clientEmail) {
        await sendEmail(clientEmail, 'meeting_scheduled', {
          client_name: clientName,
          session_type: mockSession.session_type,
          scheduled_date: new Date(mockSession.scheduled_date).toLocaleDateString(),
          scheduled_time: new Date(mockSession.scheduled_date).toLocaleTimeString(),
          coach: coach || 'Your assigned coach',
          meeting_link: meeting_link
        });
      } else if (status === 'cancelled' && clientEmail) {
        await sendEmail(clientEmail, 'consultation_cancelled', {
          client_name: clientName,
          session_type: mockSession.session_type,
          scheduled_date: new Date(mockSession.scheduled_date).toLocaleDateString()
        });
      }
    } catch (emailError) {
      console.error('Failed to send mock session update email:', emailError);
    }

    // Format response
    const responseData = {
      id: mockSession.id,
      session_type: mockSession.session_type,
      scheduled_date: mockSession.scheduled_date,
      coach: mockSession.coach,
      coach_profile: mockSession.coach_profile || {},
      status: mockSession.status,
      meeting_link: mockSession.meeting_link,
      focus_areas: mockSession.focus_areas || [],
      preparation_materials: mockSession.preparation_materials || [],
      created_at: mockSession.created_at,
      updated_at: mockSession.updated_at
    };

    res.json(createSuccessResponse(
      responseData,
      'Mock session updated successfully'
    ));
  } catch (error) {
    console.error('Update mock session error:', error);
    return handleDatabaseError(req, res, error, 'Failed to update mock session');
  }
});

// POST /api/mock-sessions/:id/feedback - Submit session feedback (ADMIN ONLY)
router.post('/:id/feedback', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      overall_rating,
      technical_skills,
      communication,
      problem_solving,
      strengths = [],
      areas_for_improvement = [],
      recommendations = [],
      next_session_suggestions
    } = req.body;

    // Validate required fields
    const requiredFields = ['overall_rating', 'technical_skills', 'communication', 'problem_solving'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return handleValidationError(req, res, [
        `Missing required fields: ${missingFields.join(', ')}`
      ]);
    }

    // Validate rating values (1-5)
    const ratings = { overall_rating, technical_skills, communication, problem_solving };
    for (const [field, value] of Object.entries(ratings)) {
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return handleValidationError(req, res, [
          `${field} must be an integer between 1 and 5`
        ]);
      }
    }

    // Create feedback object
    const feedback = {
      overall_rating,
      technical_skills,
      communication,
      problem_solving,
      strengths,
      areas_for_improvement,
      recommendations,
      next_session_suggestions,
      feedback_date: new Date().toISOString(),
      feedback_by: req.user.id
    };

    const { data: mockSession, error } = await supabaseAdmin
      .from('mock_sessions')
      .update({
        feedback,
        overall_rating,
        technical_skills,
        communication,
        problem_solving,
        strengths,
        areas_for_improvement,
        recommendations,
        next_session_suggestions,
        status: 'completed'
      })
      .eq('id', id)
      .select(`
        *,
        registered_users!inner(full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error submitting mock session feedback:', error);
      return handleDatabaseError(req, res, error, 'Failed to submit feedback');
    }

    if (!mockSession) {
      return handleNotFoundError(req, res, 'Mock session');
    }

    // Send feedback email to client
    try {
      const clientEmail = mockSession.registered_users?.email;
      const clientName = mockSession.registered_users?.full_name;

      if (clientEmail) {
        await sendEmail(clientEmail, 'consultation_completed', {
          client_name: clientName,
          session_type: mockSession.session_type,
          overall_rating: overall_rating,
          strengths: strengths.join(', ') || 'None specified',
          areas_for_improvement: areas_for_improvement.join(', ') || 'None specified',
          recommendations: recommendations.join(', ') || 'None specified',
          next_session_suggestions: next_session_suggestions || 'None specified'
        });
      }
    } catch (emailError) {
      console.error('Failed to send feedback email:', emailError);
    }

    res.json(createSuccessResponse(
      feedback,
      'Feedback submitted successfully'
    ));
  } catch (error) {
    console.error('Submit feedback error:', error);
    return handleDatabaseError(req, res, error, 'Failed to submit feedback');
  }
});

// DELETE /api/admin/mock-sessions/:id - Delete mock session (ADMIN ONLY)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('mock_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting mock session:', error);
      return handleDatabaseError(req, res, error, 'Failed to delete mock session');
    }

    res.json(createSuccessResponse(
      null,
      'Mock session deleted successfully'
    ));
  } catch (error) {
    console.error('Delete mock session error:', error);
    return handleDatabaseError(req, res, error, 'Failed to delete mock session');
  }
});

module.exports = router;