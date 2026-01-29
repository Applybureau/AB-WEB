const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');
const { cache } = require('../utils/cache');

class DashboardController {
  // GET /api/dashboard - Returns client's dashboard info
  static async getDashboard(req, res) {
    try {
      const clientId = req.user.id;
      const startTime = Date.now();

      logger.info('Dashboard request', { clientId });

      // Check cache first
      const cacheKey = `dashboard:${clientId}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Dashboard served from cache', { clientId });
        return res.json(cachedData);
      }

      // Get client info
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, full_name, email, onboarding_complete, resume_url, created_at')
        .eq('id', clientId)
        .single();

      if (clientError) {
        logger.error('Error fetching client for dashboard', clientError, { clientId });
        return res.status(500).json({ error: 'Failed to fetch client data' });
      }

      // Get recent applications with parallel queries for better performance
      const [applicationsResult, consultationsResult, notificationsResult] = await Promise.all([
        supabase
          .from('applications')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('consultations')
          .select('*')
          .eq('client_id', clientId)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(5),
        
        supabase
          .from('notifications')
          .select('*')
          .eq('client_id', clientId)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const applications = applicationsResult.data || [];
      const consultations = consultationsResult.data || [];
      const notifications = notificationsResult.data || [];

      // Log any errors but don't fail the request
      if (applicationsResult.error) {
        logger.error('Error fetching applications', applicationsResult.error, { clientId });
      }
      if (consultationsResult.error) {
        logger.error('Error fetching consultations', consultationsResult.error, { clientId });
      }
      if (notificationsResult.error) {
        logger.error('Error fetching notifications', notificationsResult.error, { clientId });
      }

      // Calculate comprehensive statistics
      const stats = {
        total_applications: applications.length,
        pending_applications: applications.filter(app => app.status === 'applied').length,
        interviews_scheduled: applications.filter(app => app.status === 'interview').length,
        offers_received: applications.filter(app => app.status === 'offer').length,
        rejected_applications: applications.filter(app => app.status === 'rejected').length,
        upcoming_consultations: consultations.length,
        unread_notifications: notifications.length,
        
        // Additional metrics
        success_rate: applications.length > 0 
          ? ((applications.filter(app => app.status === 'offer').length / applications.length) * 100).toFixed(1)
          : 0,
        
        recent_activity: {
          last_7_days: applications.filter(app => {
            const appDate = new Date(app.created_at);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return appDate >= sevenDaysAgo;
          }).length,
          
          last_30_days: applications.filter(app => {
            const appDate = new Date(app.created_at);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return appDate >= thirtyDaysAgo;
          }).length
        }
      };

      // Prepare dashboard data
      const dashboardData = {
        client: {
          id: client.id,
          full_name: client.full_name,
          email: client.email,
          onboarding_complete: client.onboarding_complete,
          resume_url: client.resume_url,
          member_since: client.created_at
        },
        stats,
        recent_applications: applications,
        upcoming_consultations: consultations,
        unread_notifications: notifications,
        
        // Additional dashboard sections
        quick_actions: [
          { action: 'upload_resume', enabled: !client.resume_url },
          { action: 'schedule_consultation', enabled: consultations.length === 0 },
          { action: 'view_applications', enabled: applications.length > 0 }
        ],
        
        insights: {
          most_active_day: this.getMostActiveDay(applications),
          average_response_time: this.getAverageResponseTime(applications),
          top_companies: this.getTopCompanies(applications)
        }
      };

      // Cache the dashboard data for 5 minutes
      cache.set(cacheKey, dashboardData, 300);

      const responseTime = Date.now() - startTime;
      logger.performance('dashboard_load', responseTime, { clientId, cacheHit: false });

      res.json(dashboardData);
    } catch (error) {
      logger.error('Dashboard error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // GET /api/dashboard/stats - Get detailed statistics
  static async getDetailedStats(req, res) {
    try {
      const clientId = req.user.id;
      const { period = '30' } = req.query; // days

      logger.info('Detailed stats request', { clientId, period });

      // Get all applications for detailed stats
      const { data: applications, error } = await supabase
        .from('applications')
        .select('status, created_at, date_applied, company, job_title')
        .eq('client_id', clientId);

      if (error) {
        logger.error('Error fetching application stats', error, { clientId });
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }

      // Calculate time-based statistics
      const now = new Date();
      const periodDays = parseInt(period);
      const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const periodApplications = applications.filter(app => 
        new Date(app.created_at) >= periodStart
      );

      // Detailed statistics
      const stats = {
        overview: {
          total_applications: applications.length,
          period_applications: periodApplications.length,
          success_rate: applications.length > 0 
            ? ((applications.filter(app => app.status === 'offer').length / applications.length) * 100).toFixed(1)
            : 0,
          response_rate: applications.length > 0
            ? (((applications.filter(app => ['interview', 'offer', 'rejected'].includes(app.status)).length) / applications.length) * 100).toFixed(1)
            : 0
        },
        
        applications_by_status: {
          applied: applications.filter(app => app.status === 'applied').length,
          interview: applications.filter(app => app.status === 'interview').length,
          offer: applications.filter(app => app.status === 'offer').length,
          rejected: applications.filter(app => app.status === 'rejected').length,
          withdrawn: applications.filter(app => app.status === 'withdrawn').length
        },
        
        timeline: this.getTimelineStats(applications, periodDays),
        
        companies: this.getCompanyStats(applications),
        
        trends: {
          applications_per_week: this.getApplicationsPerWeek(applications),
          success_trend: this.getSuccessTrend(applications),
          response_time_trend: this.getResponseTimeTrend(applications)
        },
        
        recommendations: this.generateRecommendations(applications)
      };

      logger.debug('Detailed stats calculated', { clientId, totalApps: applications.length });

      res.json(stats);
    } catch (error) {
      logger.error('Detailed stats error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to calculate statistics' });
    }
  }

  // GET /api/dashboard/activity - Get recent activity feed
  static async getActivityFeed(req, res) {
    try {
      const clientId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      logger.info('Activity feed request', { clientId, limit, offset });

      // Get recent activities from multiple sources
      const [applicationsResult, consultationsResult, notificationsResult] = await Promise.all([
        supabase
          .from('applications')
          .select('id, job_title, company, status, created_at, updated_at')
          .eq('client_id', clientId)
          .order('updated_at', { ascending: false })
          .limit(parseInt(limit)),
        
        supabase
          .from('consultations')
          .select('id, scheduled_at, status, created_at, updated_at')
          .eq('client_id', clientId)
          .order('updated_at', { ascending: false })
          .limit(parseInt(limit)),
        
        supabase
          .from('notifications')
          .select('id, title, message, type, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(parseInt(limit))
      ]);

      // Combine and format activities
      const activities = [];

      // Add application activities
      if (applicationsResult.data) {
        applicationsResult.data.forEach(app => {
          activities.push({
            id: `app_${app.id}`,
            type: 'application',
            title: `Application: ${app.job_title}`,
            description: `${app.company} - Status: ${app.status}`,
            timestamp: app.updated_at,
            metadata: {
              application_id: app.id,
              status: app.status,
              company: app.company
            }
          });
        });
      }

      // Add consultation activities
      if (consultationsResult.data) {
        consultationsResult.data.forEach(consultation => {
          activities.push({
            id: `consultation_${consultation.id}`,
            type: 'consultation',
            title: 'Consultation',
            description: `Scheduled for ${new Date(consultation.scheduled_at).toLocaleDateString()}`,
            timestamp: consultation.updated_at,
            metadata: {
              consultation_id: consultation.id,
              status: consultation.status,
              scheduled_at: consultation.scheduled_at
            }
          });
        });
      }

      // Add notification activities
      if (notificationsResult.data) {
        notificationsResult.data.forEach(notification => {
          activities.push({
            id: `notification_${notification.id}`,
            type: 'notification',
            title: notification.title,
            description: notification.message,
            timestamp: notification.created_at,
            metadata: {
              notification_id: notification.id,
              notification_type: notification.type
            }
          });
        });
      }

      // Sort by timestamp and apply pagination
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const paginatedActivities = activities.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      res.json({
        activities: paginatedActivities,
        total: activities.length,
        offset: parseInt(offset),
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Activity feed error', error, { clientId: req.user?.id });
      res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
  }

  // Helper methods for statistics calculation
  static getMostActiveDay(applications) {
    const dayCount = {};
    applications.forEach(app => {
      const day = new Date(app.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    return Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b, 'Monday');
  }

  static getAverageResponseTime(applications) {
    const responseTimes = applications
      .filter(app => ['interview', 'offer', 'rejected'].includes(app.status))
      .map(app => {
        const applied = new Date(app.date_applied);
        const updated = new Date(app.updated_at);
        return Math.ceil((updated - applied) / (1000 * 60 * 60 * 24)); // days
      });

    return responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
  }

  static getTopCompanies(applications) {
    const companyCount = {};
    applications.forEach(app => {
      companyCount[app.company] = (companyCount[app.company] || 0) + 1;
    });
    
    return Object.entries(companyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));
  }

  static getTimelineStats(applications, days) {
    const timeline = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = applications.filter(app => 
        app.created_at.startsWith(dateStr)
      ).length;
      
      timeline.push({ date: dateStr, applications: count });
    }
    return timeline;
  }

  static getCompanyStats(applications) {
    const companies = {};
    applications.forEach(app => {
      if (!companies[app.company]) {
        companies[app.company] = {
          total: 0,
          statuses: { applied: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 }
        };
      }
      companies[app.company].total++;
      companies[app.company].statuses[app.status]++;
    });

    return Object.entries(companies)
      .map(([company, stats]) => ({
        company,
        ...stats,
        success_rate: stats.total > 0 ? ((stats.statuses.offer / stats.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }

  static getApplicationsPerWeek(applications) {
    const weeks = {};
    applications.forEach(app => {
      const date = new Date(app.created_at);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeks[weekKey] = (weeks[weekKey] || 0) + 1;
    });

    return Object.entries(weeks)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => new Date(a.week) - new Date(b.week));
  }

  static getSuccessTrend(applications) {
    // Calculate success rate over time (monthly)
    const months = {};
    applications.forEach(app => {
      const monthKey = app.created_at.substring(0, 7); // YYYY-MM
      if (!months[monthKey]) {
        months[monthKey] = { total: 0, offers: 0 };
      }
      months[monthKey].total++;
      if (app.status === 'offer') {
        months[monthKey].offers++;
      }
    });

    return Object.entries(months)
      .map(([month, stats]) => ({
        month,
        success_rate: stats.total > 0 ? ((stats.offers / stats.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  static getResponseTimeTrend(applications) {
    // Calculate average response time by month
    const months = {};
    applications
      .filter(app => ['interview', 'offer', 'rejected'].includes(app.status))
      .forEach(app => {
        const monthKey = app.created_at.substring(0, 7);
        const responseTime = Math.ceil(
          (new Date(app.updated_at) - new Date(app.date_applied)) / (1000 * 60 * 60 * 24)
        );
        
        if (!months[monthKey]) {
          months[monthKey] = { times: [], total: 0 };
        }
        months[monthKey].times.push(responseTime);
        months[monthKey].total++;
      });

    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        avg_response_time: data.times.length > 0 
          ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length)
          : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  static generateRecommendations(applications) {
    const recommendations = [];
    
    // Application frequency recommendation
    const recentApps = applications.filter(app => {
      const appDate = new Date(app.created_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return appDate >= sevenDaysAgo;
    }).length;

    if (recentApps < 3) {
      recommendations.push({
        type: 'frequency',
        priority: 'medium',
        title: 'Increase Application Frequency',
        description: 'Consider applying to more positions. Aim for 3-5 applications per week.'
      });
    }

    // Success rate recommendation
    const successRate = applications.length > 0 
      ? (applications.filter(app => app.status === 'offer').length / applications.length) * 100
      : 0;

    if (successRate < 5 && applications.length > 10) {
      recommendations.push({
        type: 'success_rate',
        priority: 'high',
        title: 'Improve Application Quality',
        description: 'Your success rate is below average. Consider tailoring your resume and cover letters more specifically to each role.'
      });
    }

    // Response rate recommendation
    const responseRate = applications.length > 0
      ? (applications.filter(app => ['interview', 'offer', 'rejected'].includes(app.status)).length / applications.length) * 100
      : 0;

    if (responseRate < 20 && applications.length > 5) {
      recommendations.push({
        type: 'response_rate',
        priority: 'medium',
        title: 'Optimize Your Profile',
        description: 'Low response rate detected. Consider updating your resume or targeting different types of roles.'
      });
    }

    return recommendations;
  }
}

module.exports = DashboardController;