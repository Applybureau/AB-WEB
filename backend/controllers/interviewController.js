const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

class InterviewController {
  // GET /api/admin/interviews - Get all interviews
  static async getAllInterviews(req, res) {
    try {
      const {
        status,
        date_from,
        date_to,
        client_id,
        page = 1,
        limit = 50,
        sort = 'scheduled_date',
        order = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build query
      let query = supabaseAdmin
        .from('interviews')
        .select(`
          *,
          client:clients!inner(id, full_name, email, phone),
          application:applications(id, company, job_title)
        `)
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + parseInt(limit) - 1);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (date_from) {
        query = query.gte('scheduled_date', date_from);
      }

      if (date_to) {
        query = query.lte('scheduled_date', date_to);
      }

      if (client_id) {
        query = query.eq('client_id', client_id);
      }

      const { data: interviews, error } = await query;

      if (error) {
        logger.error('Error fetching interviews', error);
        return res.status(500).json({ error: 'Failed to fetch interviews' });
      }

      // Format response
      const formattedInterviews = (interviews || []).map(interview => ({
        id: interview.id,
        client_id: interview.client_id,
        client_name: interview.client?.full_name,
        client_email: interview.client?.email,
        client_phone: interview.client?.phone,
        application_id: interview.application_id,
        company: interview.application?.company || interview.company,
        role: interview.application?.job_title || interview.role,
        interview_type: interview.interview_type,
        scheduled_date: interview.scheduled_date,
        duration_minutes: interview.duration_minutes,
        interviewer_name: interview.interviewer_name,
        interviewer_email: interview.interviewer_email,
        meeting_link: interview.meeting_link,
        status: interview.status,
        preparation_status: interview.preparation_status,
        admin_notes: interview.admin_notes,
        client_notes: interview.client_notes,
        created_at: interview.created_at,
        updated_at: interview.updated_at
      }));

      // Get total count
      let countQuery = supabaseAdmin
        .from('interviews')
        .select('*', { count: 'exact', head: true });

      if (status) countQuery = countQuery.eq('status', status);
      if (date_from) countQuery = countQuery.gte('scheduled_date', date_from);
      if (date_to) countQuery = countQuery.lte('scheduled_date', date_to);
      if (client_id) countQuery = countQuery.eq('client_id', client_id);

      const { count } = await countQuery;

      // Get summary statistics
      const { data: allInterviews } = await supabaseAdmin
        .from('interviews')
        .select('status');

      const summary = {
        scheduled: (allInterviews || []).filter(i => i.status === 'scheduled').length,
        completed: (allInterviews || []).filter(i => i.status === 'completed').length,
        cancelled: (allInterviews || []).filter(i => i.status === 'cancelled').length,
        rescheduled: (allInterviews || []).filter(i => i.status === 'rescheduled').length
      };

      res.json({
        interviews: formattedInterviews,
        total_count: count || 0,
        page: parseInt(page),
        total_pages: Math.ceil((count || 0) / parseInt(limit)),
        summary
      });
    } catch (error) {
      logger.error('Get all interviews error', error);
      res.status(500).json({ error: 'Failed to fetch interviews' });
    }
  }

  // GET /api/admin/interviews/:interviewId - Get interview details
  static async getInterviewDetails(req, res) {
    try {
      const { interviewId } = req.params;

      const { data: interview, error } = await supabaseAdmin
        .from('interviews')
        .select(`
          *,
          client:clients!inner(id, full_name, email, phone),
          application:applications(id, company, job_title, job_description, job_url)
        `)
        .eq('id', interviewId)
        .single();

      if (error || !interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      // Get interview history
      const { data: history } = await supabaseAdmin
        .from('interview_history')
        .select('*')
        .eq('interview_id', interviewId)
        .order('timestamp', { ascending: false });

      res.json({
        interview: {
          id: interview.id,
          client_id: interview.client_id,
          client_name: interview.client.full_name,
          client_email: interview.client.email,
          client_phone: interview.client.phone,
          application_id: interview.application_id,
          company: interview.application?.company || interview.company,
          role: interview.application?.job_title || interview.role,
          job_description: interview.application?.job_description,
          interview_type: interview.interview_type,
          interview_round: interview.interview_round,
          scheduled_date: interview.scheduled_date,
          duration_minutes: interview.duration_minutes,
          timezone: interview.timezone,
          interviewer_name: interview.interviewer_name,
          interviewer_email: interview.interviewer_email,
          interviewer_title: interview.interviewer_title,
          meeting_link: interview.meeting_link,
          meeting_password: interview.meeting_password,
          location: interview.location,
          address: interview.address,
          status: interview.status,
          preparation_status: interview.preparation_status,
          admin_notes: interview.admin_notes,
          client_notes: interview.client_notes,
          feedback: interview.feedback,
          outcome: interview.outcome,
          created_at: interview.created_at,
          updated_at: interview.updated_at,
          history: history || []
        }
      });
    } catch (error) {
      logger.error('Get interview details error', error, { interviewId: req.params.interviewId });
      res.status(500).json({ error: 'Failed to fetch interview details' });
    }
  }

  // POST /api/admin/interviews - Create new interview
  static async createInterview(req, res) {
    try {
      const {
        client_id,
        application_id,
        interview_type,
        scheduled_date,
        duration_minutes = 60,
        interviewer_name,
        interviewer_email,
        meeting_link,
        admin_notes,
        company,
        role
      } = req.body;

      const adminId = req.user.id;

      // Verify client exists
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, full_name, email')
        .eq('id', client_id)
        .single();

      if (clientError || !client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Create interview
      const { data: interview, error } = await supabaseAdmin
        .from('interviews')
        .insert({
          client_id,
          application_id,
          interview_type,
          scheduled_date,
          duration_minutes,
          interviewer_name,
          interviewer_email,
          meeting_link,
          admin_notes,
          company,
          role,
          status: 'scheduled',
          preparation_status: 'not_started',
          created_by: adminId
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating interview', error, { client_id, adminId });
        return res.status(500).json({ error: 'Failed to create interview' });
      }

      // Send notification to client
      try {
        await sendEmail(client.email, 'interview_update_enhanced', {
          client_name: client.full_name,
          company_name: company,
          position_title: role,
          interview_type: interview_type,
          interview_date: new Date(scheduled_date).toLocaleDateString(),
          interview_time: new Date(scheduled_date).toLocaleTimeString(),
          meeting_link: meeting_link || 'Will be provided soon',
          interviewer_name: interviewer_name || 'TBD'
        });
      } catch (emailError) {
        logger.error('Failed to send interview creation email', emailError);
      }

      logger.info('Interview created', {
        interviewId: interview.id,
        clientId: client_id,
        adminId,
        scheduledDate: scheduled_date
      });

      res.status(201).json({
        success: true,
        message: 'Interview created successfully',
        interview: {
          id: interview.id,
          client_id: interview.client_id,
          scheduled_date: interview.scheduled_date,
          status: interview.status
        }
      });
    } catch (error) {
      logger.error('Create interview error', error);
      res.status(500).json({ error: 'Failed to create interview' });
    }
  }

  // PUT /api/admin/interviews/:interviewId - Update interview
  static async updateInterview(req, res) {
    try {
      const { interviewId } = req.params;
      const {
        scheduled_date,
        status,
        admin_notes,
        meeting_link,
        interviewer_name,
        interviewer_email,
        preparation_status
      } = req.body;

      const adminId = req.user.id;

      // Get current interview
      const { data: currentInterview, error: fetchError } = await supabaseAdmin
        .from('interviews')
        .select('*, client:clients(full_name, email)')
        .eq('id', interviewId)
        .single();

      if (fetchError || !currentInterview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      // Prepare update data
      const updateData = { updated_at: new Date().toISOString() };
      if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
      if (status !== undefined) updateData.status = status;
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
      if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
      if (interviewer_name !== undefined) updateData.interviewer_name = interviewer_name;
      if (interviewer_email !== undefined) updateData.interviewer_email = interviewer_email;
      if (preparation_status !== undefined) updateData.preparation_status = preparation_status;

      // Update interview
      const { data: interview, error } = await supabaseAdmin
        .from('interviews')
        .update(updateData)
        .eq('id', interviewId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating interview', error, { interviewId, adminId });
        return res.status(500).json({ error: 'Failed to update interview' });
      }

      // Log history
      try {
        await supabaseAdmin
          .from('interview_history')
          .insert({
            interview_id: interviewId,
            action: 'updated',
            by: req.user.email,
            changes: JSON.stringify(updateData),
            timestamp: new Date().toISOString()
          });
      } catch (historyError) {
        logger.error('Failed to log interview history', historyError);
      }

      // Send notification if status changed or rescheduled
      if (status === 'rescheduled' || scheduled_date) {
        try {
          await sendEmail(currentInterview.client.email, 'interview_update_enhanced', {
            client_name: currentInterview.client.full_name,
            company_name: currentInterview.company,
            position_title: currentInterview.role,
            interview_type: currentInterview.interview_type,
            interview_date: new Date(interview.scheduled_date).toLocaleDateString(),
            interview_time: new Date(interview.scheduled_date).toLocaleTimeString(),
            meeting_link: interview.meeting_link || 'Will be provided soon',
            interviewer_name: interview.interviewer_name || 'TBD'
          });
        } catch (emailError) {
          logger.error('Failed to send interview update email', emailError);
        }
      }

      logger.info('Interview updated', {
        interviewId,
        adminId,
        changes: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Interview updated successfully',
        interview: {
          id: interview.id,
          scheduled_date: interview.scheduled_date,
          status: interview.status
        }
      });
    } catch (error) {
      logger.error('Update interview error', error, { interviewId: req.params.interviewId });
      res.status(500).json({ error: 'Failed to update interview' });
    }
  }

  // POST /api/admin/interviews/:interviewId/feedback - Add interview feedback
  static async addInterviewFeedback(req, res) {
    try {
      const { interviewId } = req.params;
      const { outcome, feedback, next_steps, admin_notes } = req.body;
      const adminId = req.user.id;

      // Get interview
      const { data: interview, error: fetchError } = await supabaseAdmin
        .from('interviews')
        .select('*, client:clients(full_name, email)')
        .eq('id', interviewId)
        .single();

      if (fetchError || !interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      // Update interview with feedback
      const { error } = await supabaseAdmin
        .from('interviews')
        .update({
          outcome,
          feedback,
          next_steps,
          admin_notes,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId);

      if (error) {
        logger.error('Error adding interview feedback', error, { interviewId, adminId });
        return res.status(500).json({ error: 'Failed to add feedback' });
      }

      // Update application status if outcome is known
      if (interview.application_id && outcome) {
        let applicationStatus = 'interviewing';
        if (outcome === 'passed') applicationStatus = 'interview_passed';
        else if (outcome === 'failed') applicationStatus = 'rejected';

        await supabaseAdmin
          .from('applications')
          .update({ status: applicationStatus })
          .eq('id', interview.application_id);
      }

      logger.info('Interview feedback added', {
        interviewId,
        adminId,
        outcome
      });

      res.json({
        success: true,
        message: 'Feedback added successfully'
      });
    } catch (error) {
      logger.error('Add interview feedback error', error, { interviewId: req.params.interviewId });
      res.status(500).json({ error: 'Failed to add feedback' });
    }
  }
}

module.exports = InterviewController;
