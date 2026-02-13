const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

class MeetingController {
  /**
   * POST /api/meetings - Schedule a meeting (admin only)
   * Triggers meeting scheduled email to client
   */
  static async scheduleMeeting(req, res) {
    try {
      const { lead_id, meeting_date, meeting_time, meeting_link, notes } = req.body;
      const adminId = req.user.id || req.user.userId;

      // Validate required fields
      if (!lead_id || !meeting_date || !meeting_time || !meeting_link) {
        return res.status(400).json({ 
          error: 'Missing required fields: lead_id, meeting_date, meeting_time, meeting_link' 
        });
      }

      // Get lead details for email
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('consultation_requests')
        .select('id, full_name, email')
        .eq('id', lead_id)
        .single();

      if (leadError || !lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Create meeting record
      const { data: meeting, error } = await supabaseAdmin
        .from('client_meetings')
        .insert({
          lead_id,
          admin_id: adminId,
          meeting_date,
          meeting_time,
          meeting_link,
          notes,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating meeting', error);
        return res.status(500).json({ error: 'Failed to schedule meeting' });
      }

      // Format date and time for email
      const formattedDate = new Date(meeting_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Send meeting scheduled email
      try {
        await sendEmail(lead.email, 'meeting_scheduled', {
          client_name: lead.full_name,
          meeting_date: formattedDate,
          meeting_time,
          meeting_link
        });
        logger.info('Meeting scheduled email sent', { 
          meetingId: meeting.id, 
          leadId: lead_id,
          email: lead.email 
        });
      } catch (emailError) {
        logger.error('Failed to send meeting scheduled email', emailError);
      }

      logger.info('Meeting scheduled', {
        meetingId: meeting.id,
        leadId: lead_id,
        adminId,
        date: meeting_date,
        time: meeting_time
      });

      res.status(201).json({
        message: 'Meeting scheduled successfully',
        meeting
      });
    } catch (error) {
      logger.error('Schedule meeting error', error);
      res.status(500).json({ error: 'Failed to schedule meeting' });
    }
  }

  /**
   * GET /api/meetings - Get all meetings (admin only)
   */
  static async getAllMeetings(req, res) {
    try {
      const { 
        lead_id,
        status, 
        page = 1, 
        limit = 50,
        sort = 'meeting_date',
        order = 'asc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = supabaseAdmin
        .from('client_meetings')
        .select('*', { count: 'exact' })
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + parseInt(limit) - 1);

      if (lead_id) {
        query = query.eq('lead_id', lead_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: meetings, error, count } = await query;

      if (error) {
        logger.error('Error fetching meetings', error);
        return res.status(500).json({ error: 'Failed to fetch meetings' });
      }

      res.json({
        data: meetings || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      });
    } catch (error) {
      logger.error('Get all meetings error', error);
      res.status(500).json({ error: 'Failed to fetch meetings' });
    }
  }

  /**
   * PATCH /api/meetings/:id - Update meeting (admin only)
   */
  static async updateMeeting(req, res) {
    try {
      const { id } = req.params;
      const { meeting_date, meeting_time, meeting_link, status, notes } = req.body;

      const updateData = {};
      if (meeting_date) updateData.meeting_date = meeting_date;
      if (meeting_time) updateData.meeting_time = meeting_time;
      if (meeting_link) updateData.meeting_link = meeting_link;
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const { data: meeting, error } = await supabaseAdmin
        .from('client_meetings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      logger.info('Meeting updated', { meetingId: id });

      res.json({
        message: 'Meeting updated successfully',
        meeting
      });
    } catch (error) {
      logger.error('Update meeting error', error);
      res.status(500).json({ error: 'Failed to update meeting' });
    }
  }

  /**
   * DELETE /api/meetings/:id - Cancel meeting (admin only)
   */
  static async cancelMeeting(req, res) {
    try {
      const { id } = req.params;

      // Get meeting with lead details
      const { data: meeting, error: fetchError } = await supabaseAdmin
        .from('client_meetings')
        .select('*, lead:consultation_requests(full_name, email)')
        .eq('id', id)
        .single();

      if (fetchError || !meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      // Update status to cancelled
      const { error } = await supabaseAdmin
        .from('client_meetings')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) {
        logger.error('Error cancelling meeting', error);
        return res.status(500).json({ error: 'Failed to cancel meeting' });
      }

      logger.info('Meeting cancelled', { meetingId: id });

      res.json({
        message: 'Meeting cancelled successfully'
      });
    } catch (error) {
      logger.error('Cancel meeting error', error);
      res.status(500).json({ error: 'Failed to cancel meeting' });
    }
  }
}

module.exports = MeetingController;
