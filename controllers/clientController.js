const bcrypt = require('bcryptjs');
const { supabase, supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

class ClientController {
  // POST /api/client/complete-onboarding - Complete client onboarding process
  static async completeOnboarding(req, res) {
    try {
      const clientId = req.user.id;
      const {
        career_goals,
        job_search_timeline,
        current_challenges,
        previous_applications_count,
        referral_source,
        target_role,
        target_salary_min,
        target_salary_max,
        preferred_locations,
        current_job_title,
        current_company,
        years_experience,
        linkedin_url
      } = req.body;

      logger.info('Client completing onboarding', { clientId });

      // Update client record with onboarding data
      const { data: client, error } = await supabaseAdmin
        .from('clients')
        .update({
          career_goals,
          job_search_timeline,
          current_challenges,
          previous_applications_count,
          referral_source,
          target_role,
          target_salary_min,
          target_salary_max,
          preferred_locations,
          current_job_title,
          current_company,
          years_experience,
          linkedin_url
        })
        .eq('id', clientId)
        .select('*, assigned_advisor:admins(full_name, email)')
        .single();

      if (error) {
        logger.error('Error updating client onboarding data', error, { clientId });
        return res.status(500).json({ error: 'Failed to update onboarding data' });
      }

      // Check if onboarding can be completed using database function
      const { data: canComplete, error: checkError } = await supabaseAdmin
        .rpc('can_complete_onboarding', { p_client_id: clientId });

      if (checkError) {
        logger.error('Error checking onboarding completion', checkError, { clientId });
        return res.status(500).json({ error: 'Failed to validate onboarding completion' });
      }

      if (!canComplete) {
        return res.status(400).json({ 
          error: 'Onboarding incomplete',
          message: 'Please ensure all required fields are filled and password is changed'
        });
      }

      // Complete onboarding using database function
      const { data: completed, error: completeError } = await supabaseAdmin
        .rpc('complete_client_onboarding', { p_client_id: clientId });

      if (completeError || !completed) {
        logger.error('Error completing onboarding', completeError, { clientId });
        return res.status(500).json({ error: 'Failed to complete onboarding' });
      }

      // Send onboarding completion email
      await sendEmail(client.email, 'onboarding_completion', {
        client_name: client.full_name,
        advisor_name: client.assigned_advisor?.full_name || 'Your Advisor',
        dashboard_link: `${process.env.FRONTEND_URL}/dashboard`
      });

      // Notify assigned advisor
      if (client.assigned_advisor_id) {
        await supabaseAdmin
          .from('messages')
          .insert({
            client_id: clientId,
            admin_id: client.assigned_advisor_id,
            type: 'system_notification',
            subject: 'Client Onboarding Completed',
            content: `${client.full_name} has completed their onboarding process and is ready to begin their job search journey.`
          });
      }

      logger.info('Client onboarding completed successfully', { 
        clientId, 
        advisorId: client.assigned_advisor_id 
      });

      res.json({
        message: 'Onboarding completed successfully',
        client: {
          id: client.id,
          full_name: client.full_name,
          email: client.email,
          status: 'active',
          onboarding_complete: true
        }
      });
    } catch (error) {
      logger.error('Complete onboarding error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  }

  // PATCH /api/client/profile - Update client profile
  static async updateProfile(req, res) {
    try {
      const clientId = req.user.id;
      const {
        full_name,
        phone,
        linkedin_url,
        current_job_title,
        current_company,
        years_experience,
        target_role,
        target_salary_min,
        target_salary_max,
        preferred_locations,
        career_goals
      } = req.body;

      logger.info('Client updating profile', { clientId });

      // Prepare update data (only include provided fields)
      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (phone !== undefined) updateData.phone = phone;
      if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
      if (current_job_title !== undefined) updateData.current_job_title = current_job_title;
      if (current_company !== undefined) updateData.current_company = current_company;
      if (years_experience !== undefined) updateData.years_experience = years_experience;
      if (target_role !== undefined) updateData.target_role = target_role;
      if (target_salary_min !== undefined) updateData.target_salary_min = target_salary_min;
      if (target_salary_max !== undefined) updateData.target_salary_max = target_salary_max;
      if (preferred_locations !== undefined) updateData.preferred_locations = preferred_locations;
      if (career_goals !== undefined) updateData.career_goals = career_goals;

      const { data: client, error } = await supabaseAdmin
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .select('id, full_name, email, phone, linkedin_url, current_job_title, current_company, years_experience, target_role, target_salary_min, target_salary_max, preferred_locations, career_goals')
        .single();

      if (error) {
        logger.error('Error updating client profile', error, { clientId });
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      logger.info('Client profile updated successfully', { clientId });

      res.json({
        message: 'Profile updated successfully',
        client
      });
    } catch (error) {
      logger.error('Update profile error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  // POST /api/client/change-password - Change client password
  static async changePassword(req, res) {
    try {
      const clientId = req.user.id;
      const { current_password, new_password } = req.body;

      logger.info('Client changing password', { clientId });

      // Get current client data
      const { data: client, error: fetchError } = await supabaseAdmin
        .from('clients')
        .select('password, temporary_password')
        .eq('id', clientId)
        .single();

      if (fetchError || !client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Verify current password (unless it's a temporary password)
      if (!client.temporary_password) {
        const validPassword = await bcrypt.compare(current_password, client.password);
        if (!validPassword) {
          logger.security('invalid_password_change_attempt', { clientId });
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 12);

      // Update password
      const { error } = await supabaseAdmin
        .from('clients')
        .update({
          password: hashedPassword,
          temporary_password: false,
          password_changed_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) {
        logger.error('Error changing password', error, { clientId });
        return res.status(500).json({ error: 'Failed to change password' });
      }

      logger.info('Client password changed successfully', { clientId });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to change password' });
    }
  }

  // POST /api/client/messages - Send message to admin
  static async sendMessageToAdmin(req, res) {
    try {
      const clientId = req.user.id;
      const { subject, content, application_id, consultation_id } = req.body;

      logger.info('Client sending message to admin', { clientId, subject });

      // Get client and advisor info
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('full_name, email, assigned_advisor_id, assigned_advisor:admins(full_name, email)')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      if (!client.assigned_advisor_id) {
        return res.status(400).json({ error: 'No advisor assigned to your account' });
      }

      // Create message
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert({
          client_id: clientId,
          admin_id: client.assigned_advisor_id,
          type: 'client_to_admin',
          subject,
          content,
          application_id,
          consultation_id
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating client message', error, { clientId });
        return res.status(500).json({ error: 'Failed to send message' });
      }

      // Send email notification to advisor
      await sendEmail(client.assigned_advisor.email, 'client_message_notification', {
        advisor_name: client.assigned_advisor.full_name,
        client_name: client.full_name,
        message_subject: subject,
        message_content: content,
        dashboard_link: `${process.env.ADMIN_URL || process.env.FRONTEND_URL}/admin/messages`
      });

      logger.info('Client message sent to admin', {
        messageId: message.id,
        clientId,
        adminId: client.assigned_advisor_id,
        subject
      });

      res.status(201).json({
        message: 'Message sent successfully',
        message_data: message
      });
    } catch (error) {
      logger.error('Send message to admin error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // GET /api/client/messages - Get client messages
  static async getMessages(req, res) {
    try {
      const clientId = req.user.id;
      const { limit = 20, offset = 0, type } = req.query;

      let query = supabase
        .from('messages')
        .select(`
          *,
          admin:admins(full_name),
          application:applications(job_title, company),
          consultation:consultations(scheduled_at)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data: messages, error } = await query;

      if (error) {
        logger.error('Error fetching client messages', error, { clientId });
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      // Get unread count
      const { count: unreadCount, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('is_read', false)
        .in('type', ['admin_to_client', 'application_update']);

      res.json({
        messages,
        unread_count: unreadCount || 0,
        total: messages.length,
        offset: parseInt(offset),
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Get client messages error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  // PATCH /api/client/messages/:id/read - Mark message as read
  static async markMessageAsRead(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('client_id', clientId)
        .select()
        .single();

      if (error || !message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json({
        message: 'Message marked as read',
        message_data: message
      });
    } catch (error) {
      logger.error('Mark message as read error', error, { messageId: req.params.id, clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  }

  // GET /api/client/applications - Get client's applications (read-only)
  static async getApplications(req, res) {
    try {
      const clientId = req.user.id;
      const { status, limit = 20, offset = 0, sort = 'date_applied', order = 'desc' } = req.query;

      let query = supabase
        .from('applications')
        .select(`
          *,
          applied_by_admin:admins(full_name)
        `)
        .eq('client_id', clientId)
        .order(sort, { ascending: order === 'asc' })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: applications, error } = await query;

      if (error) {
        logger.error('Error fetching client applications', error, { clientId });
        return res.status(500).json({ error: 'Failed to fetch applications' });
      }

      // Get application statistics
      const { data: allApps, error: statsError } = await supabase
        .from('applications')
        .select('status')
        .eq('client_id', clientId);

      const stats = {
        total: allApps?.length || 0,
        by_status: {
          applied: allApps?.filter(app => app.status === 'applied').length || 0,
          under_review: allApps?.filter(app => app.status === 'under_review').length || 0,
          interview_scheduled: allApps?.filter(app => app.status === 'interview_scheduled').length || 0,
          offer_received: allApps?.filter(app => app.status === 'offer_received').length || 0,
          rejected: allApps?.filter(app => app.status === 'rejected').length || 0
        }
      };

      res.json({
        applications,
        stats,
        total: applications.length,
        offset: parseInt(offset),
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Get client applications error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  }

  // GET /api/client/consultations - Get client's consultations
  static async getConsultations(req, res) {
    try {
      const clientId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;

      let query = supabase
        .from('consultations')
        .select(`
          *,
          admin:admins(full_name, email)
        `)
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: consultations, error } = await query;

      if (error) {
        logger.error('Error fetching client consultations', error, { clientId });
        return res.status(500).json({ error: 'Failed to fetch consultations' });
      }

      // Get upcoming consultations count
      const { count: upcomingCount, error: countError } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString());

      res.json({
        consultations,
        upcoming_count: upcomingCount || 0,
        total: consultations.length,
        offset: parseInt(offset),
        limit: parseInt(limit),
        calendly_url: process.env.CALENDLY_URL || 'https://calendly.com/raewealth1/30min'
      });
    } catch (error) {
      logger.error('Get client consultations error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to fetch consultations' });
    }
  }

  // GET /api/client/dashboard/summary - Get client dashboard summary
  static async getDashboardSummary(req, res) {
    try {
      const clientId = req.user.id;

      // Use the database view for optimized dashboard data
      const { data: summary, error } = await supabase
        .from('client_dashboard_summary')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) {
        logger.error('Error fetching client dashboard summary', error, { clientId });
        return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
      }

      // Get recent notifications
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get next consultation
      const { data: nextConsultation, error: consultError } = await supabase
        .from('consultations')
        .select('*, admin:admins(full_name)')
        .eq('client_id', clientId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .single();

      res.json({
        ...summary,
        recent_notifications: notifications || [],
        next_consultation: nextConsultation || null,
        quick_actions: {
          schedule_consultation: !nextConsultation,
          view_applications: summary.total_applications > 0,
          update_profile: !summary.onboarding_complete,
          check_messages: summary.unread_messages > 0
        }
      });
    } catch (error) {
      logger.error('Get client dashboard summary error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
  }
}

module.exports = ClientController;