const { supabaseAdmin } = require('../utils/supabase');
const logger = require('../utils/logger');
const ClientProfileController = require('./clientProfileController');

class ClientDashboardController {
  // GET /api/client/dashboard - Get client dashboard overview
  static async getDashboardOverview(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;

      // Get client profile and completion status
      const { data: client } = await supabaseAdmin
        .from('registered_users')
        .select('*')
        .eq('id', clientId)
        .single();

      const { data: consultation } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .eq('user_id', clientId)
        .single();

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const profileData = {
        ...client,
        consultation_data: consultation || {}
      };

      const completionStatus = ClientProfileController.calculateProfileCompletion(profileData);

      // Get application statistics (placeholder for now)
      const applicationStats = {
        total_applications: 0,
        active_applications: 0,
        interviews_scheduled: 0,
        offers_received: 0,
        weekly_target: this.getWeeklyTarget(consultation?.package_interest),
        applications_this_week: 0
      };

      // Get recent activity (placeholder for now)
      const recentActivity = [];

      // Get upcoming events (placeholder for now)
      const upcomingEvents = [];

      res.json({
        client: {
          id: client.id,
          full_name: client.full_name,
          email: client.email,
          created_at: client.created_at,
          tier: consultation?.package_interest || 'Tier 1'
        },
        profile_completion: completionStatus,
        application_stats: applicationStats,
        recent_activity: recentActivity,
        upcoming_events: upcomingEvents,
        quick_actions: this.getQuickActions(completionStatus)
      });
    } catch (error) {
      logger.error('Get dashboard overview error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get dashboard overview' });
    }
  }

  // GET /api/client/dashboard/progress - Get detailed progress tracking
  static async getProgressTracking(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;

      // Get consultation data for tier information
      const { data: consultation } = await supabaseAdmin
        .from('consultation_requests')
        .select('package_interest, created_at, registered_at')
        .eq('user_id', clientId)
        .single();

      const tier = consultation?.package_interest || 'Tier 1';
      const weeklyTarget = this.getWeeklyTarget(tier);

      // Calculate days since registration
      const registrationDate = new Date(consultation?.registered_at || consultation?.created_at);
      const daysSinceRegistration = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24));

      // Get application progress (placeholder data for now)
      const progressData = {
        tier: tier,
        weekly_target: weeklyTarget,
        days_active: daysSinceRegistration,
        current_week: {
          applications_submitted: 0,
          target: weeklyTarget,
          percentage: 0
        },
        monthly_summary: {
          total_applications: 0,
          interviews: 0,
          offers: 0,
          response_rate: 0
        },
        milestones: [
          {
            title: 'Profile Setup Complete',
            completed: false,
            date: null
          },
          {
            title: 'First Application Submitted',
            completed: false,
            date: null
          },
          {
            title: 'First Interview Scheduled',
            completed: false,
            date: null
          },
          {
            title: 'First Offer Received',
            completed: false,
            date: null
          }
        ]
      };

      res.json(progressData);
    } catch (error) {
      logger.error('Get progress tracking error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get progress tracking' });
    }
  }

  // GET /api/client/dashboard/notifications - Get client notifications
  static async getNotifications(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;
      const { limit = 10, offset = 0, unread_only = false } = req.query;

      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', clientId)
        .eq('user_type', 'client')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unread_only === 'true') {
        query = query.eq('is_read', false);
      }

      const { data: notifications, error } = await query;

      if (error) {
        logger.error('Get notifications error', error, { userId: clientId });
        return res.status(500).json({ error: 'Failed to get notifications' });
      }

      res.json({
        notifications: notifications || [],
        total: notifications?.length || 0
      });
    } catch (error) {
      logger.error('Get notifications error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  // PATCH /api/client/dashboard/notifications/:id/read - Mark notification as read
  static async markNotificationRead(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;
      const { id } = req.params;

      const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', clientId)
        .eq('user_type', 'client')
        .select()
        .single();

      if (error || !notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      logger.error('Mark notification read error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
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

  // Helper method to get quick actions based on profile completion
  static getQuickActions(completionStatus) {
    const actions = [];

    if (completionStatus.percentage < 100) {
      actions.push({
        title: 'Complete Your Profile',
        description: `${completionStatus.percentage}% complete`,
        action: 'complete_profile',
        priority: 'high',
        url: '/client/profile'
      });
    }

    if (!completionStatus.features_unlocked.application_tracking) {
      actions.push({
        title: 'Unlock Application Tracking',
        description: 'Complete 40% of your profile',
        action: 'unlock_features',
        priority: 'medium',
        url: '/client/profile'
      });
    }

    if (completionStatus.is_complete) {
      actions.push({
        title: 'Submit Your First Application',
        description: 'Start your job search journey',
        action: 'first_application',
        priority: 'high',
        url: '/client/applications/new'
      });

      actions.push({
        title: 'Schedule Strategy Session',
        description: 'Book a call with your advisor',
        action: 'schedule_session',
        priority: 'medium',
        url: '/client/meetings'
      });
    }

    return actions;
  }
}

module.exports = ClientDashboardController;