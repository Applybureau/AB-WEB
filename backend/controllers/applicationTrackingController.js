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
        .eq('client_id', clientId) // Use client_id instead of user_id
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
        client_id: client_id, // Use client_id as primary field
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
            user_id: application.client_id, // Use client_id instead of user_id
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

  // GET /api/applications/stats - Get application statistics (FINAL FIX)
  static async getApplicationStats(req, res) {
    try {
      const userId = req.user.userId || req.user.id;
      const userRole = req.user.role;
      
      console.log('Getting application stats for user:', userId, 'role:', userRole);

      // For admin users, return overall stats from all applications
      if (userRole === 'admin') {
        try {
          // Get all applications for admin overview
          const { data: allApplications, error: adminError } = await supabaseAdmin
            .from('applications')
            .select('*');

          if (adminError) {
            console.log('Admin applications query error:', adminError.message);
            // Return fallback admin stats
            return res.json({
              user_type: 'admin',
              total_applications: 0,
              total_clients: 0,
              status_breakdown: {
                applied: 0,
                interviewing: 0,
                offer: 0,
                rejected: 0,
                withdrawn: 0
              },
              overall_response_rate: 0,
              overall_offer_rate: 0,
              error_fallback: true
            });
          }

          const applications = allApplications || [];
          
          // Calculate admin stats
          const uniqueClients = new Set(applications.map(app => app.client_id || app.user_id));
          
          const statusCounts = applications.reduce((acc, app) => {
            let status = app.status || 'applied';
            
            // Normalize status names
            if (status.includes('interview')) status = 'interviewing';
            if (status === 'pending') status = 'applied';
            if (status === 'hired' || status === 'accepted') status = 'offer';
            
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});

          const totalApps = applications.length;
          const interviewingCount = statusCounts.interviewing || 0;
          const offerCount = statusCounts.offer || 0;
          const responseCount = interviewingCount + offerCount;

          const adminStats = {
            user_type: 'admin',
            total_applications: totalApps,
            total_clients: uniqueClients.size,
            status_breakdown: {
              applied: statusCounts.applied || 0,
              interviewing: interviewingCount,
              offer: offerCount,
              rejected: statusCounts.rejected || 0,
              withdrawn: statusCounts.withdrawn || 0
            },
            overall_response_rate: totalApps > 0 ? Math.round((responseCount / totalApps) * 100) : 0,
            overall_offer_rate: totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0
          };

          console.log('Returning admin stats:', adminStats);
          return res.json(adminStats);
        } catch (adminStatsError) {
          console.log('Admin stats calculation error:', adminStatsError.message);
          return res.json({
            user_type: 'admin',
            total_applications: 0,
            total_clients: 0,
            status_breakdown: { applied: 0, interviewing: 0, offer: 0, rejected: 0, withdrawn: 0 },
            overall_response_rate: 0,
            overall_offer_rate: 0,
            error_fallback: true
          });
        }
      }

      // For client users, calculate their personal stats
      let applications = [];
      
      try {
        // Try client_id first (new schema)
        const { data: clientApps, error: clientError } = await supabaseAdmin
          .from('applications')
          .select('*')
          .eq('client_id', userId);

        if (clientError && clientError.code === '42703') {
          // client_id column doesn't exist, try user_id
          const { data: userApps, error: userError } = await supabaseAdmin
            .from('applications')
            .select('*')
            .eq('user_id', userId);

          if (userError) {
            console.log('Both client_id and user_id queries failed:', userError.message);
            applications = [];
          } else {
            applications = userApps || [];
          }
        } else if (clientError) {
          console.log('Client applications query error:', clientError.message);
          applications = [];
        } else {
          applications = clientApps || [];
        }
      } catch (dbError) {
        console.log('Database query error:', dbError.message);
        applications = [];
      }

      // Calculate client stats
      const stats = await ApplicationTrackingController.calculateApplicationStats(userId, applications);
      
      console.log('Returning client stats for user:', userId, stats);
      res.json(stats);
      
    } catch (error) {
      console.error('Get application stats error:', error);
      
      // Return safe fallback stats
      const fallbackStats = {
        tier: 'Tier 1',
        weekly_target: 17,
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
        offer_rate: 0,
        user_type: req.user?.role || 'client',
        error_fallback: true
      };
      
      console.log('Returning fallback stats due to error:', error.message);
      res.json(fallbackStats);
    }
  }

  // Helper method to calculate overall statistics for admin (FIXED VERSION)
  static async calculateOverallStats() {
    try {
      // Get all applications
      const { data: applications, error } = await supabaseAdmin
        .from('applications')
        .select('*');

      if (error && error.code === '42P01') {
        // Table doesn't exist
        return {
          user_type: 'admin',
          total_applications: 0,
          total_clients: 0,
          status_breakdown: {
            applied: 0,
            interviewing: 0,
            offer: 0,
            rejected: 0,
            withdrawn: 0
          },
          overall_response_rate: 0,
          overall_offer_rate: 0
        };
      }

      if (error) {
        console.error('Calculate overall stats error:', error.message);
        return this.getDefaultAdminStats();
      }

      const allApplications = applications || [];
      
      // Get unique client count
      const uniqueClients = new Set(allApplications.map(app => app.client_id || app.user_id));
      
      // Calculate status counts with normalization
      const statusCounts = allApplications.reduce((acc, app) => {
        let status = app.status || 'applied';
        
        // Normalize status names
        if (status.includes('interview')) status = 'interviewing';
        if (status === 'pending') status = 'applied';
        if (status === 'hired' || status === 'accepted') status = 'offer';
        
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const totalApps = allApplications.length;
      const interviewingCount = statusCounts.interviewing || 0;
      const offerCount = statusCounts.offer || 0;
      const responseCount = interviewingCount + offerCount;

      return {
        user_type: 'admin',
        total_applications: totalApps,
        total_clients: uniqueClients.size,
        status_breakdown: {
          applied: statusCounts.applied || 0,
          interviewing: interviewingCount,
          offer: offerCount,
          rejected: statusCounts.rejected || 0,
          withdrawn: statusCounts.withdrawn || 0
        },
        overall_response_rate: totalApps > 0 
          ? Math.round((responseCount / totalApps) * 100)
          : 0,
        overall_offer_rate: totalApps > 0
          ? Math.round((offerCount / totalApps) * 100)
          : 0
      };
    } catch (error) {
      console.error('Calculate overall stats error:', error.message);
      return this.getDefaultAdminStats();
    }
  }

  // Helper method to calculate application statistics (FIXED VERSION)
  static async calculateApplicationStats(clientId, applications = null) {
    try {
      // Get consultation data for tier information (with fallback for missing table)
      let tier = 'Tier 1';
      let weeklyTarget = this.getWeeklyTarget(tier);

      // If applications not provided, fetch them
      if (!applications) {
        try {
          // Try client_id first, then user_id as fallback
          let { data: apps, error } = await supabaseAdmin
            .from('applications')
            .select('*')
            .eq('client_id', clientId);

          if (error && error.code === '42703') {
            // client_id column doesn't exist, try user_id
            const { data: userApps, error: userError } = await supabaseAdmin
              .from('applications')
              .select('*')
              .eq('user_id', clientId);
            
            if (userError) {
              console.log('Both client_id and user_id failed, using empty array');
              apps = [];
            } else {
              apps = userApps;
            }
          } else if (error && error.code === '42P01') {
            // Table doesn't exist
            console.log('Applications table does not exist');
            apps = [];
          } else if (error) {
            console.log('Database error:', error.message);
            apps = [];
          }

          applications = apps || [];
        } catch (fetchError) {
          console.log('Error fetching applications:', fetchError.message);
          applications = [];
        }
      }

      const allApplications = applications || [];
      
      // Calculate current week applications
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const thisWeekApplications = allApplications.filter(app => {
        const appDate = app.date_applied || app.application_date || app.created_at;
        return appDate && new Date(appDate) >= startOfWeek;
      });

      // Calculate status counts with flexible status mapping
      const statusCounts = allApplications.reduce((acc, app) => {
        let status = app.status || 'applied';
        
        // Normalize status names
        if (status.includes('interview')) status = 'interviewing';
        if (status === 'pending') status = 'applied';
        if (status === 'hired' || status === 'accepted') status = 'offer';
        
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Calculate rates
      const totalApps = allApplications.length;
      const interviewingCount = statusCounts.interviewing || 0;
      const offerCount = statusCounts.offer || 0;
      const responseCount = interviewingCount + offerCount;

      const responseRate = totalApps > 0 ? Math.round((responseCount / totalApps) * 100) : 0;
      const offerRate = totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0;
      const weeklyProgress = Math.round((thisWeekApplications.length / weeklyTarget) * 100);

      return {
        tier,
        weekly_target: weeklyTarget,
        total_applications: totalApps,
        applications_this_week: thisWeekApplications.length,
        weekly_progress: Math.min(weeklyProgress, 100), // Cap at 100%
        status_breakdown: {
          applied: statusCounts.applied || 0,
          interviewing: interviewingCount,
          offer: offerCount,
          rejected: statusCounts.rejected || 0,
          withdrawn: statusCounts.withdrawn || 0
        },
        response_rate: responseRate,
        offer_rate: offerRate,
        user_type: 'client'
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

  // Helper method to get default admin stats
  static getDefaultAdminStats() {
    return {
      user_type: 'admin',
      total_applications: 0,
      total_clients: 0,
      status_breakdown: {
        applied: 0,
        interviewing: 0,
        offer: 0,
        rejected: 0,
        withdrawn: 0
      },
      overall_response_rate: 0,
      overall_offer_rate: 0
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