const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');
const securityManager = require('../utils/security');

class AdminController {
  // POST /api/admin/clients/invite - Create and invite new client (Core Apply Bureau Flow)
  static async inviteClient(req, res) {
    try {
      const { email, full_name, phone, consultation_notes } = req.body;
      const adminId = req.user.id;

      logger.info('Admin creating client invitation', { adminId, email, full_name });

      // Check if client already exists
      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id, status')
        .eq('email', email)
        .single();

      if (existingClient) {
        logger.warn('Attempt to invite existing client', { email, adminId, existingStatus: existingClient.status });
        return res.status(400).json({ 
          error: 'Client already exists',
          existing_status: existingClient.status
        });
      }

      // Use the database function to create client invitation
      const { data: inviteResult, error: inviteError } = await supabaseAdmin
        .rpc('create_client_invitation', {
          p_full_name: full_name,
          p_email: email,
          p_admin_id: adminId
        });

      if (inviteError) {
        logger.error('Failed to create client invitation', inviteError, { email, adminId });
        return res.status(500).json({ error: 'Failed to create client invitation' });
      }

      const { client_id, invite_token, temp_password } = inviteResult[0];

      // Update client with additional info if provided
      const updateData = { assigned_advisor_id: adminId };
      if (phone) updateData.phone = phone;

      await supabaseAdmin
        .from('clients')
        .update(updateData)
        .eq('id', client_id);

      // Create consultation record if notes provided
      if (consultation_notes) {
        await supabaseAdmin
          .from('consultations')
          .insert({
            client_id,
            admin_id: adminId,
            scheduled_at: new Date().toISOString(), // Placeholder - will be updated when actual consultation is scheduled
            status: 'completed', // This represents the initial consultation that led to onboarding
            client_reason: 'Initial consultation',
            admin_notes: consultation_notes,
            onboarding_decision: true,
            onboarding_reason: 'Client approved for onboarding after consultation'
          });
      }

      // Send invitation email
      const inviteLink = `${process.env.FRONTEND_URL}/complete-registration?token=${invite_token}`;
      
      await sendEmail(email, 'signup_invite', {
        client_name: full_name,
        registration_link: inviteLink,
        temp_password: temp_password,
        advisor_name: req.user.full_name || 'Your Advisor'
      });

      logger.info('Client invitation sent successfully', { 
        clientId: client_id, 
        email, 
        adminId,
        inviteToken: invite_token
      });

      res.status(201).json({
        message: 'Client invitation sent successfully',
        client_id,
        invite_token,
        invite_link: inviteLink
      });
    } catch (error) {
      logger.error('Invite client error', error, { 
        email: req.body.email, 
        adminId: req.user?.id 
      });
      res.status(500).json({ error: 'Failed to send client invitation' });
    }
  }

  // GET /api/admin/clients - Get all clients for admin dashboard
  static async getAllClients(req, res) {
    try {
      const { status, search, limit = 50, offset = 0, sort = 'created_at', order = 'desc' } = req.query;

      // Query clients table directly instead of non-existent view
      let query = supabaseAdmin
        .from('clients')
        .select('id, email, full_name, phone, status, role, created_at, last_login_at, profile_picture_url, current_job_title, current_company')
        .order(sort, { ascending: order === 'asc' })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Search by name or email if provided
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: clients, error } = await query;

      if (error) {
        logger.error('Error fetching clients for admin', error);
        return res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
      }

      // Get total count for pagination
      let countQuery = supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact', head: true });

      if (status) {
        countQuery = countQuery.eq('status', status);
      }

      if (search) {
        countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        logger.error('Error counting clients', countError);
      }

      res.json({
        clients: clients || [],
        total: count || 0,
        offset: parseInt(offset),
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Get all clients error', error);
      res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
    }
  }

  // GET /api/admin/clients/:id - Get specific client details
  static async getClientDetails(req, res) {
    try {
      const { id } = req.params;

      // Get client with all related data
      const [clientResult, applicationsResult, consultationsResult, messagesResult] = await Promise.all([
        supabaseAdmin
          .from('clients')
          .select(`
            *,
            assigned_advisor:admins(id, full_name, email)
          `)
          .eq('id', id)
          .single(),
        
        supabaseAdmin
          .from('applications')
          .select('*')
          .eq('client_id', id)
          .order('created_at', { ascending: false }),
        
        supabaseAdmin
          .from('consultations')
          .select('*')
          .eq('client_id', id)
          .order('scheduled_at', { ascending: false }),
        
        supabaseAdmin
          .from('messages')
          .select('*')
          .eq('client_id', id)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      if (clientResult.error || !clientResult.data) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const client = clientResult.data;
      const applications = applicationsResult.data || [];
      const consultations = consultationsResult.data || [];
      const messages = messagesResult.data || [];

      // Calculate client statistics
      const stats = {
        total_applications: applications.length,
        applications_by_status: {
          applied: applications.filter(app => app.status === 'applied').length,
          under_review: applications.filter(app => app.status === 'under_review').length,
          interview_scheduled: applications.filter(app => app.status === 'interview_scheduled').length,
          offer_received: applications.filter(app => app.status === 'offer_received').length,
          rejected: applications.filter(app => app.status === 'rejected').length
        },
        total_consultations: consultations.length,
        unread_messages: messages.filter(msg => msg.type === 'client_to_admin' && !msg.is_read).length,
        last_activity: applications.length > 0 ? applications[0].created_at : client.created_at
      };

      res.json({
        client,
        applications,
        consultations,
        messages,
        stats
      });
    } catch (error) {
      logger.error('Get client details error', error, { clientId: req.params.id });
      res.status(500).json({ error: 'Failed to fetch client details' });
    }
  }

  // POST /api/admin/applications - Create application for client
  static async createApplication(req, res) {
    try {
      const {
        client_id,
        job_title,
        company,
        job_description,
        job_url,
        salary_range,
        location,
        job_type = 'full-time',
        application_method,
        application_strategy,
        admin_notes
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

      // Create application
      const { data: application, error } = await supabaseAdmin
        .from('applications')
        .insert({
          client_id,
          applied_by_admin_id: adminId,
          job_title,
          company,
          job_description,
          job_url,
          salary_range,
          location,
          job_type,
          application_method,
          application_strategy,
          admin_notes,
          status: 'applied',
          date_applied: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating application', error, { client_id, adminId });
        return res.status(500).json({ error: 'Failed to create application' });
      }

      logger.info('Application created by admin', {
        applicationId: application.id,
        clientId: client_id,
        adminId,
        company,
        jobTitle: job_title
      });

      res.status(201).json({
        message: 'Application created successfully',
        application
      });
    } catch (error) {
      logger.error('Create application error', error, { adminId: req.user?.id });
      res.status(500).json({ error: 'Failed to create application' });
    }
  }

  // PATCH /api/admin/applications/:id/status - Update application status
  static async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, status_update_reason, interview_scheduled_at, interview_type, interview_notes, offer_salary, offer_benefits, offer_deadline } = req.body;

      const adminId = req.user.id;

      // Get current application
      const { data: currentApp, error: fetchError } = await supabaseAdmin
        .from('applications')
        .select('*, clients(full_name, email)')
        .eq('id', id)
        .single();

      if (fetchError || !currentApp) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Prepare update data
      const updateData = { status };
      if (status_update_reason) updateData.status_update_reason = status_update_reason;
      if (interview_scheduled_at) updateData.interview_scheduled_at = interview_scheduled_at;
      if (interview_type) updateData.interview_type = interview_type;
      if (interview_notes) updateData.interview_notes = interview_notes;
      if (offer_salary) updateData.offer_salary = offer_salary;
      if (offer_benefits) updateData.offer_benefits = offer_benefits;
      if (offer_deadline) updateData.offer_deadline = offer_deadline;

      // Update application (triggers will handle notifications)
      const { data: application, error } = await supabaseAdmin
        .from('applications')
        .update(updateData)
        .eq('id', id)
        .select('*, clients(full_name, email)')
        .single();

      if (error) {
        logger.error('Error updating application status', error, { applicationId: id, adminId });
        return res.status(500).json({ error: 'Failed to update application status' });
      }

      logger.info('Application status updated', {
        applicationId: id,
        oldStatus: currentApp.status,
        newStatus: status,
        adminId,
        clientId: application.client_id
      });

      res.json({
        message: 'Application status updated successfully',
        application
      });
    } catch (error) {
      logger.error('Update application status error', error, { applicationId: req.params.id, adminId: req.user?.id });
      res.status(500).json({ error: 'Failed to update application status' });
    }
  }

  // POST /api/admin/messages - Send message to client
  static async sendMessageToClient(req, res) {
    try {
      const { client_id, subject, content, application_id, consultation_id } = req.body;
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

      // Create message
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert({
          client_id,
          admin_id: adminId,
          type: 'admin_to_client',
          subject,
          content,
          application_id,
          consultation_id
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating message', error, { client_id, adminId });
        return res.status(500).json({ error: 'Failed to send message' });
      }

      // Send email notification
      await sendEmail(client.email, 'message_notification', {
        client_name: client.full_name,
        message_subject: subject,
        message_content: content,
        dashboard_link: `${process.env.FRONTEND_URL}/dashboard/messages`
      });

      logger.info('Message sent to client', {
        messageId: message.id,
        clientId: client_id,
        adminId,
        subject
      });

      res.status(201).json({
        message: 'Message sent successfully',
        message_data: message
      });
    } catch (error) {
      logger.error('Send message error', error, { adminId: req.user?.id });
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // GET /api/admin/dashboard/stats - Admin dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      const { period = '30' } = req.query; // days
      const periodDays = parseInt(period);
      const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      // Initialize default stats
      let stats = {
        clients: {
          total: 0,
          active: 0,
          onboarding: 0,
          invited: 0,
          new_this_period: 0
        },
        applications: {
          total: 0,
          applied: 0,
          interview: 0,
          offers: 0,
          rejected: 0,
          new_this_period: 0,
          success_rate: 0
        },
        consultations: {
          total: 0,
          scheduled: 0,
          completed: 0,
          upcoming: 0
        },
        communication: {
          unread_messages: 0,
          pending_responses: 0
        },
        top_companies: [],
        recent_activity: []
      };

      try {
        // Try to get clients data (try multiple table names)
        let clients = [];
        try {
          const { data: clientsData } = await supabaseAdmin
            .from('clients')
            .select('id, status, created_at, onboarding_complete');
          clients = clientsData || [];
        } catch (clientsError) {
          console.log('Clients table not found, trying registered_users');
          try {
            const { data: usersData } = await supabaseAdmin
              .from('registered_users')
              .select('id, role, created_at, onboarding_completed')
              .neq('role', 'admin');
            clients = (usersData || []).map(user => ({
              id: user.id,
              status: user.role === 'client' ? 'active' : 'invited',
              created_at: user.created_at,
              onboarding_complete: user.onboarding_completed
            }));
          } catch (usersError) {
            console.log('No user tables found');
          }
        }

        // Try to get applications data
        let applications = [];
        try {
          const { data: applicationsData } = await supabaseAdmin
            .from('applications')
            .select('id, status, created_at, client_id, company');
          applications = applicationsData || [];
        } catch (applicationsError) {
          console.log('Applications table not found');
        }

        // Try to get consultations data
        let consultations = [];
        try {
          const { data: consultationsData } = await supabaseAdmin
            .from('consultations')
            .select('id, status, scheduled_at, created_at');
          consultations = consultationsData || [];
        } catch (consultationsError) {
          console.log('Consultations table not found, trying consultation_requests');
          try {
            const { data: requestsData } = await supabaseAdmin
              .from('consultation_requests')
              .select('id, admin_status, created_at, confirmed_time');
            consultations = (requestsData || []).map(req => ({
              id: req.id,
              status: req.admin_status || 'pending',
              scheduled_at: req.confirmed_time,
              created_at: req.created_at
            }));
          } catch (requestsError) {
            console.log('No consultation tables found');
          }
        }

        // Try to get messages data
        let unreadMessages = [];
        try {
          const { data: messagesData } = await supabaseAdmin
            .from('messages')
            .select('id, type, is_read, created_at')
            .eq('type', 'client_to_admin')
            .eq('is_read', false);
          unreadMessages = messagesData || [];
        } catch (messagesError) {
          console.log('Messages table not found');
        }

        // Calculate statistics with the data we have
        stats = {
          clients: {
            total: clients.length,
            active: clients.filter(c => c.status === 'active').length,
            onboarding: clients.filter(c => c.status === 'onboarding').length,
            invited: clients.filter(c => c.status === 'invited').length,
            new_this_period: clients.filter(c => new Date(c.created_at) >= periodStart).length
          },
          
          applications: {
            total: applications.length,
            applied: applications.filter(a => a.status === 'applied').length,
            interview: applications.filter(a => a.status === 'interview_scheduled' || a.status === 'interviewing').length,
            offers: applications.filter(a => a.status === 'offer_received' || a.status === 'offer').length,
            rejected: applications.filter(a => a.status === 'rejected').length,
            new_this_period: applications.filter(a => new Date(a.created_at) >= periodStart).length,
            success_rate: applications.length > 0 
              ? ((applications.filter(a => a.status === 'offer_received' || a.status === 'offer').length / applications.length) * 100).toFixed(1)
              : 0
          },
          
          consultations: {
            total: consultations.length,
            scheduled: consultations.filter(c => c.status === 'scheduled' || c.status === 'confirmed').length,
            completed: consultations.filter(c => c.status === 'completed').length,
            upcoming: consultations.filter(c => 
              (c.status === 'scheduled' || c.status === 'confirmed') && 
              c.scheduled_at && 
              new Date(c.scheduled_at) > new Date()
            ).length
          },
          
          communication: {
            unread_messages: unreadMessages.length,
            pending_responses: unreadMessages.filter(m => 
              new Date(m.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length
          },
          
          top_companies: AdminController.getTopCompanies(applications),
          recent_activity: AdminController.getRecentActivity(applications, consultations, clients, 10)
        };

      } catch (dataError) {
        console.error('Error fetching dashboard data:', dataError);
        // Return default stats if data fetching fails
      }

      res.json(stats);
    } catch (error) {
      logger.error('Get admin dashboard stats error', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  }

  // Helper methods
  static getTopCompanies(applications) {
    const companyCount = {};
    applications.forEach(app => {
      companyCount[app.company] = (companyCount[app.company] || 0) + 1;
    });
    
    return Object.entries(companyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([company, count]) => ({ company, count }));
  }

  static getRecentActivity(applications, consultations, clients, limit) {
    const activities = [];
    
    // Add recent applications
    applications.slice(0, limit).forEach(app => {
      activities.push({
        type: 'application',
        description: `New application: ${app.company}`,
        timestamp: app.created_at,
        client_id: app.client_id
      });
    });
    
    // Add recent consultations
    consultations.slice(0, limit).forEach(consultation => {
      activities.push({
        type: 'consultation',
        description: `Consultation ${consultation.status}`,
        timestamp: consultation.created_at
      });
    });
    
    // Add new clients
    clients.slice(0, limit).forEach(client => {
      activities.push({
        type: 'client',
        description: `New client registered`,
        timestamp: client.created_at,
        client_id: client.id
      });
    });
    
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // POST /api/admin/consultations/schedule - Schedule consultation for client
  static async scheduleConsultation(req, res) {
    try {
      const { client_id, scheduled_at, consultation_type = 'follow_up', admin_notes } = req.body;
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

      // Create consultation
      const { data: consultation, error } = await supabaseAdmin
        .from('consultations')
        .insert({
          client_id,
          admin_id: adminId,
          scheduled_at,
          consultation_type,
          admin_notes,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error scheduling consultation', error, { client_id, adminId });
        return res.status(500).json({ error: 'Failed to schedule consultation' });
      }

      logger.info('Consultation scheduled', {
        consultationId: consultation.id,
        clientId: client_id,
        adminId,
        scheduledAt: scheduled_at
      });

      res.status(201).json({
        message: 'Consultation scheduled successfully',
        consultation
      });
    } catch (error) {
      logger.error('Schedule consultation error', error, { adminId: req.user?.id });
      res.status(500).json({ error: 'Failed to schedule consultation' });
    }
  }

  // GET /api/admin/profile - Get admin profile
  static async getAdminProfile(req, res) {
    try {
      const adminId = req.user.id;

      // Try to get admin from admins table first
      let admin = null;
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('id, email, full_name, role, profile_picture_url, phone, permissions, is_active, created_at, last_login_at')
        .eq('id', adminId)
        .single();

      if (adminData) {
        admin = adminData;
      } else {
        // Fallback to clients table
        const { data: clientData, error: clientError } = await supabaseAdmin
          .from('clients')
          .select('id, email, full_name, role, profile_picture_url, phone, created_at, last_login_at')
          .eq('id', adminId)
          .eq('role', 'admin')
          .single();

        if (clientData) {
          admin = {
            ...clientData,
            permissions: {
              can_create_admins: true,
              can_delete_admins: true,
              can_manage_clients: true,
              can_schedule_consultations: true,
              can_view_reports: true,
              can_manage_system: true
            },
            is_active: true
          };
        }
      }

      if (!admin) {
        return res.status(404).json({ error: 'Admin profile not found' });
      }

      res.json({
        admin,
        dashboard_type: 'admin'
      });
    } catch (error) {
      logger.error('Get admin profile error', error, { adminId: req.user?.id });
      res.status(500).json({ error: 'Failed to fetch admin profile' });
    }
  }
}

module.exports = AdminController;