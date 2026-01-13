const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/client/mock-sessions - Schedule mock session (PROTECTED - CLIENT)
router.post('/mock-sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      session_type,
      preferred_date,
      focus_areas,
      preparation_level = 'intermediate',
      specific_company,
      notes
    } = req.body;

    // Validate required fields
    if (!session_type || !preferred_date || !focus_areas) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: session_type, preferred_date, focus_areas',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role, full_name, email')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate focus areas
    if (!Array.isArray(focus_areas) || focus_areas.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'focus_areas must be a non-empty array',
        code: 'INVALID_FOCUS_AREAS'
      });
    }

    // Validate session type
    const validSessionTypes = ['Technical Interview', 'Behavioral Interview', 'System Design', 'Coding Challenge', 'Mock Presentation', 'Salary Negotiation'];
    if (!validSessionTypes.includes(session_type)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid session_type. Must be one of: ${validSessionTypes.join(', ')}`,
        code: 'INVALID_SESSION_TYPE'
      });
    }

    // Assign coach based on session type (simplified logic)
    let assignedCoach = {
      name: "Alex Rodriguez",
      title: "Senior Engineering Manager",
      experience: "10+ years in tech leadership",
      specialties: ["System Design", "Technical Leadership", "Salary Negotiation"]
    };

    if (session_type === 'Behavioral Interview') {
      assignedCoach = {
        name: "Sarah Chen",
        title: "HR Director & Career Coach",
        experience: "8+ years in talent acquisition",
        specialties: ["Behavioral Interviews", "Career Development", "Communication Skills"]
      };
    }

    // Generate meeting link (placeholder)
    const meetingLink = `https://meet.google.com/mock-session-${Date.now()}`;

    // Create mock session
    const { data: mockSession, error: createError } = await supabaseAdmin
      .from('mock_sessions')
      .insert({
        user_id: userId,
        session_type,
        scheduled_date: preferred_date,
        coach_name: assignedCoach.name,
        coach_title: assignedCoach.title,
        coach_experience: assignedCoach.experience,
        coach_specialties: assignedCoach.specialties,
        status: 'scheduled',
        meeting_link: meetingLink,
        focus_areas,
        preparation_level,
        specific_company,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating mock session:', createError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to schedule mock session',
        code: 'DATABASE_ERROR'
      });
    }

    // Send confirmation email to client
    try {
      await sendEmail(user.email, 'mock_session_scheduled', {
        client_name: user.full_name,
        session_type: session_type,
        scheduled_date: new Date(preferred_date).toLocaleDateString(),
        scheduled_time: new Date(preferred_date).toLocaleTimeString(),
        coach_name: assignedCoach.name,
        coach_title: assignedCoach.title,
        meeting_link: meetingLink,
        focus_areas: focus_areas.join(', '),
        preparation_notes: 'Please review the preparation materials that will be sent separately.'
      });
    } catch (emailError) {
      console.error('Failed to send mock session confirmation email:', emailError);
    }

    // Format response according to spec
    const sessionData = {
      id: mockSession.id,
      session_type: mockSession.session_type,
      scheduled_date: mockSession.scheduled_date,
      coach: {
        name: mockSession.coach_name,
        title: mockSession.coach_title,
        experience: mockSession.coach_experience,
        specialties: mockSession.coach_specialties
      },
      status: mockSession.status,
      meeting_link: mockSession.meeting_link,
      focus_areas: mockSession.focus_areas,
      preparation_materials: [], // Will be populated later
      feedback: null,
      created_at: mockSession.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Mock session scheduled successfully',
      session: sessionData
    });
  } catch (error) {
    console.error('Schedule mock session error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to schedule mock session',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/client/mock-sessions - Get client mock sessions (PROTECTED - CLIENT)
router.get('/mock-sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      status,
      session_type,
      limit = 50, 
      offset = 0,
      sort_by = 'scheduled_date',
      sort_order = 'desc'
    } = req.query;

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    let query = supabaseAdmin
      .from('mock_sessions')
      .select('*')
      .eq('user_id', userId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (session_type && session_type !== 'all') {
      query = query.eq('session_type', session_type);
    }

    const { data: mockSessions, error } = await query;

    if (error) {
      console.error('Error fetching mock sessions:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch mock sessions',
        code: 'DATABASE_ERROR'
      });
    }

    // Format mock sessions according to spec
    const formattedSessions = (mockSessions || []).map(session => ({
      id: session.id,
      session_type: session.session_type,
      scheduled_date: session.scheduled_date,
      coach: {
        name: session.coach_name,
        title: session.coach_title,
        experience: session.coach_experience,
        specialties: session.coach_specialties
      },
      status: session.status,
      meeting_link: session.meeting_link,
      focus_areas: session.focus_areas,
      preparation_materials: session.preparation_materials || [],
      feedback: session.feedback,
      created_at: session.created_at
    }));

    res.json({
      success: true,
      sessions: formattedSessions,
      total: mockSessions?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch mock sessions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch mock sessions',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/mock-sessions/:id/feedback - Submit session feedback (PROTECTED - COACH/ADMIN)
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      overall_rating,
      technical_skills,
      communication,
      problem_solving,
      strengths,
      areas_for_improvement,
      recommendations,
      next_session_suggestions
    } = req.body;

    // Validate required fields
    if (!overall_rating || !strengths || !areas_for_improvement) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: overall_rating, strengths, areas_for_improvement',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate ratings (1-5 scale)
    const ratings = { overall_rating, technical_skills, communication, problem_solving };
    for (const [field, rating] of Object.entries(ratings)) {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        return res.status(400).json({ 
          success: false,
          error: `${field} must be between 1 and 5`,
          code: 'INVALID_RATING'
        });
      }
    }

    // Get mock session
    const { data: mockSession, error: fetchError } = await supabaseAdmin
      .from('mock_sessions')
      .select('*, registered_users!inner(full_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !mockSession) {
      return res.status(404).json({ 
        success: false,
        error: 'Mock session not found',
        code: 'NOT_FOUND'
      });
    }

    // Create feedback object
    const feedback = {
      overall_rating,
      technical_skills,
      communication,
      problem_solving,
      strengths: Array.isArray(strengths) ? strengths : [strengths],
      areas_for_improvement: Array.isArray(areas_for_improvement) ? areas_for_improvement : [areas_for_improvement],
      recommendations: Array.isArray(recommendations) ? recommendations : [recommendations],
      next_session_suggestions,
      feedback_date: new Date().toISOString(),
      feedback_by: req.user.full_name || 'Coach'
    };

    // Update mock session with feedback
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('mock_sessions')
      .update({
        feedback,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating mock session feedback:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to submit feedback',
        code: 'UPDATE_ERROR'
      });
    }

    // Send feedback email to client
    try {
      await sendEmail(mockSession.registered_users.email, 'mock_session_feedback', {
        client_name: mockSession.registered_users.full_name,
        session_type: mockSession.session_type,
        coach_name: mockSession.coach_name,
        overall_rating,
        strengths: feedback.strengths.join(', '),
        areas_for_improvement: feedback.areas_for_improvement.join(', '),
        recommendations: feedback.recommendations.join(', '),
        next_session_suggestions: next_session_suggestions || 'Continue practicing based on the recommendations provided.',
        dashboard_url: process.env.FRONTEND_URL + '/client/dashboard'
      });
    } catch (emailError) {
      console.error('Failed to send feedback email:', emailError);
    }

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit feedback',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/mock-sessions/:id - Update mock session (PROTECTED - CLIENT/ADMIN)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_date, status, notes } = req.body;
    const userId = req.user.userId || req.user.id;

    // Get current mock session
    const { data: currentSession, error: fetchError } = await supabaseAdmin
      .from('mock_sessions')
      .select('*, registered_users!inner(full_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !currentSession) {
      return res.status(404).json({ 
        success: false,
        error: 'Mock session not found',
        code: 'NOT_FOUND'
      });
    }

    // Check permissions (client can only update their own sessions)
    if (req.user.role !== 'admin' && currentSession.user_id !== userId) {
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

    if (scheduled_date) {
      updateData.scheduled_date = scheduled_date;
    }

    if (status) {
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        });
      }
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update mock session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('mock_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating mock session:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update mock session',
        code: 'UPDATE_ERROR'
      });
    }

    // Send update notification email if rescheduled
    if (status === 'rescheduled' && scheduled_date) {
      try {
        await sendEmail(currentSession.registered_users.email, 'mock_session_rescheduled', {
          client_name: currentSession.registered_users.full_name,
          session_type: currentSession.session_type,
          new_date: new Date(scheduled_date).toLocaleDateString(),
          new_time: new Date(scheduled_date).toLocaleTimeString(),
          coach_name: currentSession.coach_name,
          meeting_link: currentSession.meeting_link
        });
      } catch (emailError) {
        console.error('Failed to send reschedule email:', emailError);
      }
    }

    // Format response
    const sessionData = {
      id: updatedSession.id,
      session_type: updatedSession.session_type,
      scheduled_date: updatedSession.scheduled_date,
      coach: {
        name: updatedSession.coach_name,
        title: updatedSession.coach_title,
        experience: updatedSession.coach_experience,
        specialties: updatedSession.coach_specialties
      },
      status: updatedSession.status,
      meeting_link: updatedSession.meeting_link,
      focus_areas: updatedSession.focus_areas,
      preparation_materials: updatedSession.preparation_materials || [],
      feedback: updatedSession.feedback,
      created_at: updatedSession.created_at,
      updated_at: updatedSession.updated_at
    };

    res.json({
      success: true,
      message: 'Mock session updated successfully',
      session: sessionData
    });
  } catch (error) {
    console.error('Update mock session error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update mock session',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;