const { supabaseAdmin } = require('../utils/supabase');
const logger = require('../utils/logger');

class ApplicationTrackingController {
  // GET /api/applications - Get client applications
  static async getApplications(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;
      const { status, limit = 20, offset = 0, search } = req.query;

      // First check if applications table exists, if not create placeholder data
      let query = supabaseAdmin
        .from('applications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`company_name.ilike.%${search}%,job_title.ilike.%${search}%`);
      }

      const { data: applications, error } = await query;

      // If table doesn't exist yet, return empty array
      if (error && error.code === '42P01') {
        return res.json({
          applications: [],
          total: 0,
          stats: this.getDefaultStats()
        });
      }

      if (error) {
        logger.error('Get applications error', error, { userId: clientId });
        return res.status(500).json({ error: 'Failed to get applications' });
      }

      // Calculate statistics
      const stats = await this.calculateApplicationStats(clientId);

      res.json({
        applications: applications || [],
        total: applications?.length || 0,
        stats
      });
    } catch (error) {
      logger.error('Get applications error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get applications' });
    }
  }

  // POST /api/applications - Create new application (admin only for now)
  static async createApplication(req, res) {
    try {
      const {
        client_id,
        company_name,
        job_title,
        job_url,
        application_date,
        status = 'applied',
        tailored_resume_url,
        cover_letter_url,
        notes
      } = req.body;

      if (!client_id || !company_name || !job_title) {
        return res.status(400).json({ 
          error: 'Client ID, company name, and job title are required' 
        });
      }

      const applicationData = {
        client_id,
        company_name,
        job_title,
        job_url,
        application_date: application_date || new Date().toISOString(),
        status,
        tailored_resume_url,
        cover_letter_url,
        notes,
        admin_notes: `Created by admin: ${req.user.email || req.user.id}`
      };

      const { data: application, error } = await supabaseAdmin
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) {
        logger.error('Create application error', error, { 
          adminId: req.user.id,
          clientId: client_id 
        });
        return res.status(500).json({ error: 'Failed to create application' });
      }

      // Create notification for client
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: client_id,
          user_type: 'client',
          type: 'application_added',
          title: 'New Application Added',
          message: `Application for ${job_title} at ${company_name} has been added to your tracker`,
          is_read: false
        });

      logger.info('Application created', { 
        applicationId: application.id,
        clientId: client_id,
        adminId: req.user.id 
      });

      res.status(201).json({
        message: 'Application created successfully',
        application
      });
    } catch (error) {
      logger.error('Create application error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to create application' });
    }
  }

  // PATCH /api/applications/:id - Update application status
  static async updateApplication(req, res) {
    try {
      const { id } = req.params;
      const {
        status,
        interview_date,
        offer_amount,
        notes,
        admin_notes
      } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (interview_date) updateData.interview_date = interview_date;
      if (offer_amount) updateData.offer_amount = offer_amount;
      if (notes !== undefined) updateData.notes = notes;
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

      const { data: application, error } = await supabaseAdmin
        .from('applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Create notification for status changes
      if (status && status !== application.status) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: application.client_id,
            user_type: 'client',
            type: 'application_status_update',
            title: 'Application Status Updated',
            message: `Your application for ${application.job_title} at ${application.company_name} is now ${status}`,
            is_read: false
          });
      }

      logger.info('Application updated', { 
        applicationId: id,
        status,
        updatedBy: req.user.id 
      });

      res.json({
        message: 'Application updated successfully',
        application
      });
    } catch (error) {
      logger.error('Update application error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to update application' });
    }
  }

  // GET /api/applications/stats - Get application statistics
  static async getApplicationStats(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;
      const stats = await this.calculateApplicationStats(clientId);
      res.json(stats);
    } catch (error) {
      logger.error('Get application stats error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get application statistics' });
    }
  }

  // Helper method to calculate application statistics
  static async calculateApplicationStats(clientId) {
    try {
      // Get consultation data for tier information
      const { data: consultation } = await supabaseAdmin
        .from('consultation_requests')
        .select('package_interest, registered_at')
        .eq('user_id', clientId)
        .single();

      const tier = consultation?.package_interest || 'Tier 1';
      const weeklyTarget = this.getWeeklyTarget(tier);

      // Try to get applications, return default stats if table doesn't exist
      const { data: applications, error } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('client_id', clientId);

      if (error && error.code === '42P01') {
        return this.getDefaultStats(weeklyTarget, tier);
      }

      if (error) {
        logger.error('Calculate stats error', error, { clientId });
        return this.getDefaultStats(weeklyTarget, tier);
      }

      const allApplications = applications || [];
      
      // Calculate current week applications
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const thisWeekApplications = allApplications.filter(app => 
        new Date(app.application_date) >= startOfWeek
      );

      // Calculate status counts
      const statusCounts = allApplications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      return {
        tier,
        weekly_target: weeklyTarget,
        total_applications: allApplications.length,
        applications_this_week: thisWeekApplications.length,
        weekly_progress: Math.round((thisWeekApplications.length / weeklyTarget) * 100),
        status_breakdown: {
          applied: statusCounts.applied || 0,
          interviewing: statusCounts.interviewing || 0,
          offer: statusCounts.offer || 0,
          rejected: statusCounts.rejected || 0,
          withdrawn: statusCounts.withdrawn || 0
        },
        response_rate: allApplications.length > 0 
          ? Math.round(((statusCounts.interviewing || 0) + (statusCounts.offer || 0)) / allApplications.length * 100)
          : 0,
        offer_rate: allApplications.length > 0
          ? Math.round((statusCounts.offer || 0) / allApplications.length * 100)
          : 0
      };
    } catch (error) {
      logger.error('Calculate application stats error', error, { clientId });
      return this.getDefaultStats();
    }
  }

  // Helper method to get default stats
  static getDefaultStats(weeklyTarget = 17, tier = 'Tier 1') {
    return {
      tier,
      weekly_target: weeklyTarget,
      total_applications: 0,
      applications_this_week: 0,
      weekly_progress: 0,
      status_breakdown: {
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0,
        withdrawn: 0
      },
      response_rate: 0,
      offer_rate: 0
    };
  }

  // Helper method to get weekly target based on tier
  static getWeeklyTarget(tier) {
    const targets = {
      'Tier 1': 17,
      'Tier 2': 30,
      'Tier 3': 50
    };
    return targets[tier] || 17;
  }
}

module.exports = ApplicationTrackingController;