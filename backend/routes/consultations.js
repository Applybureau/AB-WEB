const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// GET /api/consultations - List consultations for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }
    
    const { status, type, limit = 20, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('consultations')
      .select(`
        *,
        profiles!consultations_user_id_fkey(full_name, email),
        admin_users!consultations_admin_id_fkey(full_name, email),
        applications(title, type)
      `)
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    
    if (type) {
      query = query.eq('type', type);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultations:', error);
      return res.status(500).json({ error: 'Failed to fetch consultations' });
    }

    res.json({
      consultations: consultations || [],
      total: consultations?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Consultations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// POST /api/consultations - Admin creates consultation with enhanced features
router.post('/', authenticateToken, requireAdmin, validate(schemas.consultation), async (req, res) => {
  try {
    const { 
      user_id, 
      application_id,
      type = 'initial',
      title,
      description,
      scheduled_at, 
      duration_minutes = 60,
      meeting_link,
      meeting_id,
      meeting_password,
      timezone = 'UTC',
      location,
      attendees = [],
      agenda = [],
      preparation_notes,
      notes,
      consultant_id,
      hourly_rate,
      billable_hours
    } = req.body;
    
    const adminId = req.user.userId || req.user.id;

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate total cost if hourly rate and billable hours provided
    let total_cost = null;
    if (hourly_rate && billable_hours) {
      total_cost = parseFloat(hourly_rate) * parseFloat(billable_hours);
    }

    // Create consultation with all new fields
    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert({
        user_id,
        application_id,
        type,
        title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Consultation with ${user.full_name}`,
        description,
        scheduled_at,
        duration_minutes,
        meeting_link,
        meeting_id,
        meeting_password,
        timezone,
        location,
        attendees: JSON.stringify(attendees),
        agenda: JSON.stringify(agenda),
        preparation_notes,
        notes,
        admin_id: adminId,
        consultant_id: consultant_id || adminId,
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
        billable_hours: billable_hours ? parseFloat(billable_hours) : null,
        total_cost,
        status: 'scheduled'
      })
      .select(`
        *,
        profiles!consultations_user_id_fkey(full_name, email),
        admin_users!consultations_admin_id_fkey(full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating consultation:', error);
      return res.status(500).json({ error: 'Failed to create consultation' });
    }

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        type: 'consultation_scheduled',
        title: 'Consultation Scheduled',
        message: `Your ${type} consultation has been scheduled for ${new Date(scheduled_at).toLocaleString()}`,
        data: JSON.stringify({
          consultation_id: consultation.id,
          type,
          scheduled_at,
          meeting_link
        }),
        priority: 'high'
      });

    // Send email notification with enhanced details
    try {
      const scheduledDate = new Date(scheduled_at);
      await sendEmail(user.email, 'consultation_scheduled', {
        client_name: user.full_name,
        consultation_type: type.charAt(0).toUpperCase() + type.slice(1),
        consultation_title: consultation.title,
        consultation_description: description,
        consultation_date: scheduledDate.toLocaleDateString(),
        consultation_time: scheduledDate.toLocaleTimeString(),
        duration_minutes,
        timezone,
        meeting_link,
        meeting_password,
        location,
        preparation_notes,
        agenda: agenda.length > 0 ? agenda : null
      });
      console.log('✅ Consultation email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Don't fail the consultation creation if email fails
    }

    res.status(201).json({
      message: 'Consultation created successfully',
      consultation
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ error: 'Failed to create consultation' });
  }
});

// GET /api/consultations/:id - Get specific consultation
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    let query = supabaseAdmin
      .from('consultations')
      .select(`
        *,
        profiles!consultations_user_id_fkey(full_name, email, phone, company),
        admin_users!consultations_admin_id_fkey(full_name, email, role),
        admin_users!consultations_consultant_id_fkey(full_name, email, specializations),
        applications(title, type, description)
      `)
      .eq('id', id);

    // Non-admin users can only see their own consultations
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data: consultation, error } = await query.single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Parse JSON fields
    if (consultation.attendees) {
      try {
        consultation.attendees = JSON.parse(consultation.attendees);
      } catch (e) {
        consultation.attendees = [];
      }
    }
    
    if (consultation.agenda) {
      try {
        consultation.agenda = JSON.parse(consultation.agenda);
      } catch (e) {
        consultation.agenda = [];
      }
    }
    
    if (consultation.action_items) {
      try {
        consultation.action_items = JSON.parse(consultation.action_items);
      } catch (e) {
        consultation.action_items = [];
      }
    }

    res.json({ consultation });
  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation' });
  }
});

// PATCH /api/consultations/:id - Update consultation with enhanced fields
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      scheduled_at, 
      duration_minutes,
      actual_duration,
      notes, 
      status,
      meeting_link,
      meeting_password,
      location,
      attendees,
      agenda,
      preparation_notes,
      action_items,
      recording_url,
      recording_password,
      transcript_url,
      follow_up_required,
      follow_up_notes,
      follow_up_scheduled_at,
      satisfaction_rating,
      client_feedback,
      internal_rating,
      internal_notes,
      billable_hours,
      hourly_rate,
      consultant_id
    } = req.body;

    const updateData = {};
    
    // Handle all possible update fields
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (actual_duration !== undefined) updateData.actual_duration = actual_duration;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
    if (meeting_password !== undefined) updateData.meeting_password = meeting_password;
    if (location !== undefined) updateData.location = location;
    if (attendees !== undefined) updateData.attendees = JSON.stringify(attendees);
    if (agenda !== undefined) updateData.agenda = JSON.stringify(agenda);
    if (preparation_notes !== undefined) updateData.preparation_notes = preparation_notes;
    if (action_items !== undefined) updateData.action_items = JSON.stringify(action_items);
    if (recording_url !== undefined) updateData.recording_url = recording_url;
    if (recording_password !== undefined) updateData.recording_password = recording_password;
    if (transcript_url !== undefined) updateData.transcript_url = transcript_url;
    if (follow_up_required !== undefined) updateData.follow_up_required = follow_up_required;
    if (follow_up_notes !== undefined) updateData.follow_up_notes = follow_up_notes;
    if (follow_up_scheduled_at !== undefined) updateData.follow_up_scheduled_at = follow_up_scheduled_at;
    if (satisfaction_rating !== undefined) updateData.satisfaction_rating = satisfaction_rating;
    if (client_feedback !== undefined) updateData.client_feedback = client_feedback;
    if (internal_rating !== undefined) updateData.internal_rating = internal_rating;
    if (internal_notes !== undefined) updateData.internal_notes = internal_notes;
    if (billable_hours !== undefined) updateData.billable_hours = parseFloat(billable_hours);
    if (hourly_rate !== undefined) updateData.hourly_rate = parseFloat(hourly_rate);
    if (consultant_id !== undefined) updateData.consultant_id = consultant_id;
    
    // Calculate total cost if both hourly rate and billable hours are provided
    if (updateData.hourly_rate && updateData.billable_hours) {
      updateData.total_cost = updateData.hourly_rate * updateData.billable_hours;
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        profiles!consultations_user_id_fkey(full_name, email)
      `)
      .single();

    if (error || !consultation) {
      console.error('Update consultation error:', error);
      return res.status(404).json({ error: 'Consultation not found or update failed' });
    }

    // Handle status-specific notifications
    if (status) {
      let notificationTitle = 'Consultation Updated';
      let notificationMessage = `Your consultation has been updated`;
      
      switch (status) {
        case 'confirmed':
          notificationTitle = 'Consultation Confirmed';
          notificationMessage = `Your consultation scheduled for ${new Date(consultation.scheduled_at).toLocaleString()} has been confirmed`;
          break;
        case 'completed':
          notificationTitle = 'Consultation Completed';
          notificationMessage = `Your consultation has been completed. Thank you for your time!`;
          break;
        case 'cancelled':
          notificationTitle = 'Consultation Cancelled';
          notificationMessage = `Your consultation scheduled for ${new Date(consultation.scheduled_at).toLocaleString()} has been cancelled`;
          break;
        case 'rescheduled':
          notificationTitle = 'Consultation Rescheduled';
          notificationMessage = `Your consultation has been rescheduled to ${new Date(consultation.scheduled_at).toLocaleString()}`;
          break;
      }
      
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: consultation.user_id,
          type: `consultation_${status}`,
          title: notificationTitle,
          message: notificationMessage,
          data: JSON.stringify({
            consultation_id: consultation.id,
            status,
            scheduled_at: consultation.scheduled_at
          }),
          priority: status === 'cancelled' ? 'high' : 'medium'
        });
    }

    // If rescheduled, send email notification
    if (scheduled_at && consultation.profiles) {
      try {
        const scheduledDate = new Date(scheduled_at);
        await sendEmail(consultation.profiles.email, 'consultation_scheduled', {
          client_name: consultation.profiles.full_name,
          consultation_type: consultation.type.charAt(0).toUpperCase() + consultation.type.slice(1) + ' (Rescheduled)',
          consultation_title: consultation.title,
          consultation_date: scheduledDate.toLocaleDateString(),
          consultation_time: scheduledDate.toLocaleTimeString(),
          duration_minutes: consultation.duration_minutes,
          meeting_link: consultation.meeting_link,
          preparation_notes: consultation.preparation_notes
        });
      } catch (emailError) {
        console.error('❌ Reschedule email sending failed:', emailError);
      }
    }

    res.json({
      message: 'Consultation updated successfully',
      consultation
    });
  } catch (error) {
    console.error('Update consultation error:', error);
    res.status(500).json({ error: 'Failed to update consultation' });
  }
});

// DELETE /api/consultations/:id - Cancel consultation
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // Get consultation details before cancellation
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select(`
        *,
        profiles!consultations_user_id_fkey(full_name, email)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Update status to cancelled instead of deleting
    const { error } = await supabaseAdmin
      .from('consultations')
      .update({ 
        status: 'cancelled',
        cancellation_reason: cancellation_reason || 'Cancelled by admin'
      })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling consultation:', error);
      return res.status(500).json({ error: 'Failed to cancel consultation' });
    }

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: consultation.user_id,
        type: 'consultation_cancelled',
        title: 'Consultation Cancelled',
        message: `Your ${consultation.type} consultation scheduled for ${new Date(consultation.scheduled_at).toLocaleString()} has been cancelled`,
        data: JSON.stringify({
          consultation_id: consultation.id,
          cancellation_reason: cancellation_reason || 'Cancelled by admin',
          original_scheduled_at: consultation.scheduled_at
        }),
        priority: 'high'
      });

    // Send cancellation email
    if (consultation.profiles) {
      try {
        await sendEmail(consultation.profiles.email, 'consultation_cancelled', {
          client_name: consultation.profiles.full_name,
          consultation_type: consultation.type.charAt(0).toUpperCase() + consultation.type.slice(1),
          consultation_title: consultation.title,
          consultation_date: new Date(consultation.scheduled_at).toLocaleDateString(),
          consultation_time: new Date(consultation.scheduled_at).toLocaleTimeString(),
          cancellation_reason: cancellation_reason || 'Administrative cancellation'
        });
      } catch (emailError) {
        console.error('❌ Cancellation email sending failed:', emailError);
      }
    }

    res.json({ 
      message: 'Consultation cancelled successfully',
      cancellation_reason: cancellation_reason || 'Cancelled by admin'
    });
  } catch (error) {
    console.error('Cancel consultation error:', error);
    res.status(500).json({ error: 'Failed to cancel consultation' });
  }
});

// POST /api/consultations/:id/complete - Mark consultation as completed with feedback
router.post('/:id/complete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      actual_duration,
      notes,
      action_items = [],
      recording_url,
      transcript_url,
      follow_up_required = false,
      follow_up_notes,
      internal_rating,
      internal_notes,
      billable_hours,
      hourly_rate
    } = req.body;

    // Calculate total cost
    let total_cost = null;
    if (hourly_rate && billable_hours) {
      total_cost = parseFloat(hourly_rate) * parseFloat(billable_hours);
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .update({
        status: 'completed',
        actual_duration,
        notes,
        action_items: JSON.stringify(action_items),
        recording_url,
        transcript_url,
        follow_up_required,
        follow_up_notes,
        internal_rating,
        internal_notes,
        billable_hours: billable_hours ? parseFloat(billable_hours) : null,
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
        total_cost
      })
      .eq('id', id)
      .select(`
        *,
        profiles!consultations_user_id_fkey(full_name, email)
      `)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation not found or update failed' });
    }

    // Create completion notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: consultation.user_id,
        type: 'consultation_completed',
        title: 'Consultation Completed',
        message: `Your ${consultation.type} consultation has been completed. ${follow_up_required ? 'A follow-up session may be scheduled.' : ''}`,
        data: JSON.stringify({
          consultation_id: consultation.id,
          has_recording: !!recording_url,
          has_transcript: !!transcript_url,
          follow_up_required,
          action_items_count: action_items.length
        }),
        priority: 'medium'
      });

    res.json({
      message: 'Consultation marked as completed',
      consultation
    });
  } catch (error) {
    console.error('Complete consultation error:', error);
    res.status(500).json({ error: 'Failed to complete consultation' });
  }
});

// POST /api/consultations/:id/feedback - Client provides feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { satisfaction_rating, client_feedback } = req.body;
    const userId = req.user.userId || req.user.id;

    // Validate rating
    if (satisfaction_rating && (satisfaction_rating < 1 || satisfaction_rating > 5)) {
      return res.status(400).json({ error: 'Satisfaction rating must be between 1 and 5' });
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .update({
        satisfaction_rating: satisfaction_rating ? parseInt(satisfaction_rating) : null,
        client_feedback
      })
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own consultation
      .select()
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation not found or access denied' });
    }

    // Notify admin of feedback
    if (consultation.admin_id) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          admin_id: consultation.admin_id,
          type: 'admin_alert',
          title: 'Client Feedback Received',
          message: `Client feedback received for consultation: ${satisfaction_rating}/5 stars`,
          data: JSON.stringify({
            consultation_id: consultation.id,
            satisfaction_rating,
            has_written_feedback: !!client_feedback
          }),
          priority: satisfaction_rating && satisfaction_rating <= 2 ? 'high' : 'medium'
        });
    }

    res.json({
      message: 'Feedback submitted successfully',
      consultation: {
        id: consultation.id,
        satisfaction_rating: consultation.satisfaction_rating,
        client_feedback: consultation.client_feedback
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;