const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/meetings - Schedule meeting (PROTECTED - ADMIN)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      lead_id,
      meeting_date,
      meeting_time,
      meeting_link,
      meeting_type = 'consultation',
      duration_minutes = 60,
      notes,
      attendees
    } = req.body;

    // Validate required fields
    if (!lead_id || !meeting_date || !meeting_time || !meeting_link) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: lead_id, meeting_date, meeting_time, meeting_link',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Get lead/consultation request details
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, full_name, email, phone')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ 
        success: false,
        error: 'Lead/consultation request not found',
        code: 'NOT_FOUND'
      });
    }

    // Validate attendees array
    if (attendees && !Array.isArray(attendees)) {
      return res.status(400).json({ 
        success: false,
        error: 'attendees must be an array',
        code: 'INVALID_ATTENDEES'
      });
    }

    // Create meeting datetime
    const meetingDateTime = new Date(`${meeting_date}T${meeting_time}:00`);
    
    // Create meeting
    const { data: meeting, error: createError } = await supabaseAdmin
      .from('meetings')
      .insert({
        lead_id,
        client_name: lead.full_name,
        client_email: lead.email,
        meeting_date: meetingDateTime.toISOString(),
        meeting_link,
        meeting_type,
        duration_minutes,
        status: 'scheduled',
        notes,
        attendees: attendees || [
          {
            name: lead.full_name,
            email: lead.email,
            role: 'client'
          }
        ],
        scheduled_by: req.user.userId || req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating meeting:', createError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to schedule meeting',
        code: 'DATABASE_ERROR'
      });
    }

    // Update consultation request status
    await supabaseAdmin
      .from('consultation_requests')
      .update({
        status: 'scheduled',
        scheduled_datetime: meetingDateTime.toISOString(),
        google_meet_link: meeting_link,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead_id);

    // Send meeting invitation email to client
    try {
      await sendEmail(lead.email, 'meeting_scheduled', {
        client_name: lead.full_name,
        meeting_type: meeting_type,
        meeting_date: meetingDateTime.toLocaleDateString(),
        meeting_time: meetingDateTime.toLocaleTimeString(),
        meeting_link: meeting_link,
        duration_minutes: duration_minutes,
        notes: notes || 'Looking forward to our conversation!',
        admin_name: req.user.full_name || 'Apply Bureau Team'
      });
    } catch (emailError) {
      console.error('Failed to send meeting invitation email:', emailError);
    }

    // Send notification to admin attendees
    if (attendees) {
      for (const attendee of attendees) {
        if (attendee.role === 'consultant' || attendee.role === 'admin') {
          try {
            await sendEmail(attendee.email, 'admin_meeting_scheduled', {
              attendee_name: attendee.name,
              client_name: lead.full_name,
              meeting_type: meeting_type,
              meeting_date: meetingDateTime.toLocaleDateString(),
              meeting_time: meetingDateTime.toLocaleTimeString(),
              meeting_link: meeting_link,
              duration_minutes: duration_minutes,
              notes: notes || 'Meeting scheduled with client'
            });
          } catch (emailError) {
            console.error(`Failed to send meeting notification to ${attendee.email}:`, emailError);
          }
        }
      }
    }

    // Format response according to spec
    const meetingData = {
      id: meeting.id,
      lead_id: meeting.lead_id,
      client_name: meeting.client_name,
      client_email: meeting.client_email,
      meeting_date: meeting.meeting_date,
      meeting_link: meeting.meeting_link,
      meeting_type: meeting.meeting_type,
      duration_minutes: meeting.duration_minutes,
      status: meeting.status,
      notes: meeting.notes,
      attendees: meeting.attendees,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully',
      meeting: meetingData
    });
  } catch (error) {
    console.error('Schedule meeting error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to schedule meeting',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/meetings - Get meetings list (PROTECTED - ADMIN)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status,
      meeting_type,
      date_from,
      date_to,
      limit = 50, 
      offset = 0,
      sort_by = 'meeting_date',
      sort_order = 'asc'
    } = req.query;

    let query = supabaseAdmin
      .from('meetings')
      .select('*')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (meeting_type && meeting_type !== 'all') {
      query = query.eq('meeting_type', meeting_type);
    }

    if (date_from) {
      query = query.gte('meeting_date', date_from);
    }

    if (date_to) {
      query = query.lte('meeting_date', date_to);
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch meetings',
        code: 'DATABASE_ERROR'
      });
    }

    // Format meetings according to spec
    const formattedMeetings = (meetings || []).map(meeting => ({
      id: meeting.id,
      lead_id: meeting.lead_id,
      client_name: meeting.client_name,
      client_email: meeting.client_email,
      meeting_date: meeting.meeting_date,
      meeting_link: meeting.meeting_link,
      meeting_type: meeting.meeting_type,
      duration_minutes: meeting.duration_minutes,
      status: meeting.status,
      notes: meeting.notes,
      attendees: meeting.attendees,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at
    }));

    res.json({
      success: true,
      meetings: formattedMeetings,
      total: meetings?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch meetings error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch meetings',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/meetings/:id - Update meeting (PROTECTED - ADMIN)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      meeting_date,
      meeting_time,
      meeting_link,
      status,
      notes,
      duration_minutes
    } = req.body;

    // Get current meeting
    const { data: currentMeeting, error: fetchError } = await supabaseAdmin
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentMeeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found',
        code: 'NOT_FOUND'
      });
    }

    // Prepare update data
    let updateData = {
      updated_at: new Date().toISOString()
    };

    if (meeting_date && meeting_time) {
      const meetingDateTime = new Date(`${meeting_date}T${meeting_time}:00`);
      updateData.meeting_date = meetingDateTime.toISOString();
    }

    if (meeting_link) {
      updateData.meeting_link = meeting_link;
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

    if (duration_minutes) {
      updateData.duration_minutes = duration_minutes;
    }

    // Update meeting
    const { data: updatedMeeting, error: updateError } = await supabaseAdmin
      .from('meetings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating meeting:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update meeting',
        code: 'UPDATE_ERROR'
      });
    }

    // Send update notification emails
    if (status === 'rescheduled' || (meeting_date && meeting_time)) {
      try {
        await sendEmail(currentMeeting.client_email, 'meeting_updated', {
          client_name: currentMeeting.client_name,
          meeting_type: currentMeeting.meeting_type,
          meeting_date: new Date(updatedMeeting.meeting_date).toLocaleDateString(),
          meeting_time: new Date(updatedMeeting.meeting_date).toLocaleTimeString(),
          meeting_link: updatedMeeting.meeting_link,
          status: updatedMeeting.status,
          notes: updatedMeeting.notes || 'Meeting details have been updated.',
          admin_name: req.user.full_name || 'Apply Bureau Team'
        });
      } catch (emailError) {
        console.error('Failed to send meeting update email:', emailError);
      }
    }

    // Format response
    const meetingData = {
      id: updatedMeeting.id,
      lead_id: updatedMeeting.lead_id,
      client_name: updatedMeeting.client_name,
      client_email: updatedMeeting.client_email,
      meeting_date: updatedMeeting.meeting_date,
      meeting_link: updatedMeeting.meeting_link,
      meeting_type: updatedMeeting.meeting_type,
      duration_minutes: updatedMeeting.duration_minutes,
      status: updatedMeeting.status,
      notes: updatedMeeting.notes,
      attendees: updatedMeeting.attendees,
      created_at: updatedMeeting.created_at,
      updated_at: updatedMeeting.updated_at
    };

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      meeting: meetingData
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update meeting',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/meetings/:id - Cancel meeting (PROTECTED - ADMIN)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // Get current meeting
    const { data: meeting, error: fetchError } = await supabaseAdmin
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found',
        code: 'NOT_FOUND'
      });
    }

    // Update meeting status to cancelled instead of deleting
    const { data: cancelledMeeting, error: updateError } = await supabaseAdmin
      .from('meetings')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellation_reason || 'Meeting cancelled by admin',
        cancelled_by: req.user.userId || req.user.id,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling meeting:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to cancel meeting',
        code: 'UPDATE_ERROR'
      });
    }

    // Send cancellation email to client
    try {
      await sendEmail(meeting.client_email, 'meeting_cancelled', {
        client_name: meeting.client_name,
        meeting_type: meeting.meeting_type,
        meeting_date: new Date(meeting.meeting_date).toLocaleDateString(),
        meeting_time: new Date(meeting.meeting_date).toLocaleTimeString(),
        cancellation_reason: cancellation_reason || 'We apologize for any inconvenience.',
        admin_name: req.user.full_name || 'Apply Bureau Team',
        reschedule_url: process.env.FRONTEND_URL + '/contact'
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Meeting cancelled successfully',
      meeting: {
        id: cancelledMeeting.id,
        status: cancelledMeeting.status,
        cancellation_reason: cancelledMeeting.cancellation_reason,
        cancelled_at: cancelledMeeting.cancelled_at
      }
    });
  } catch (error) {
    console.error('Cancel meeting error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to cancel meeting',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/meetings/:id - Get specific meeting (PROTECTED - ADMIN)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: meeting, error } = await supabaseAdmin
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !meeting) {
      return res.status(404).json({ 
        success: false,
        error: 'Meeting not found',
        code: 'NOT_FOUND'
      });
    }

    // Format response according to spec
    const meetingData = {
      id: meeting.id,
      lead_id: meeting.lead_id,
      client_name: meeting.client_name,
      client_email: meeting.client_email,
      meeting_date: meeting.meeting_date,
      meeting_link: meeting.meeting_link,
      meeting_type: meeting.meeting_type,
      duration_minutes: meeting.duration_minutes,
      status: meeting.status,
      notes: meeting.notes,
      attendees: meeting.attendees,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at
    };

    res.json({
      success: true,
      meeting: meetingData
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch meeting',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;