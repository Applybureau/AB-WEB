const { supabaseAdmin } = require('../utils/supabase');
const logger = require('../utils/logger');

// GET /api/enhanced-dashboard - Enhanced admin dashboard stats with error handling
const getAdminDashboardStats = async (req, res) => {
  try {
    console.log('🔍 Fetching enhanced dashboard stats');

    // Initialize stats with defaults
    const stats = {
      clients: {
        total: 0,
        active: 0,
        new_this_week: 0,
        online: 0
      },
      consultations: {
        total: 0,
        scheduled: 0,
        completed: 0,
        upcoming: 0,
        today: 0
      },
      applications: {
        total: 0,
        this_month: 0,
        by_status: {}
      },
      messages: {
        total: 0,
        unread_from_clients: 0,
        sent_today: 0
      },
      recent_activities: []
    };

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get clients stats with error handling
    try {
      const { data: clients, error } = await supabaseAdmin
        .from('registered_users')
        .select('id, full_name, is_active, created_at, last_login_at')
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      if (!error && clients) {
        stats.clients.total = clients.length;
        stats.clients.active = clients.filter(c => c.is_active).length;
        stats.clients.new_this_week = clients.filter(c => 
          new Date(c.created_at) > sevenDaysAgo
        ).length;
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }

    // Get consultations stats with error handling
    try {
      const { data: consultations, error } = await supabaseAdmin
        .from('consultation_requests')
        .select('id, admin_status, status, created_at, confirmed_time')
        .order('created_at', { ascending: false });

      if (!error && consultations) {
        stats.consultations.total = consultations.length;
        stats.consultations.scheduled = consultations.filter(c => c.admin_status === 'confirmed').length;
        stats.consultations.completed = consultations.filter(c => c.status === 'completed').length;
        stats.consultations.upcoming = consultations.filter(c => 
          c.admin_status === 'confirmed' && c.confirmed_time && new Date(c.confirmed_time) > new Date()
        ).length;
        stats.consultations.today = consultations.filter(c => {
          if (!c.confirmed_time) return false;
          const consultationDate = new Date(c.confirmed_time);
          return consultationDate.toDateString() === new Date().toDateString();
        }).length;
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }

    // Get applications stats with error handling
    try {
      const { data: applications, error } = await supabaseAdmin
        .from('applications')
        .select('id, status, created_at, client_id')
        .order('created_at', { ascending: false });

      if (!error && applications) {
        stats.applications.total = applications.length;
        stats.applications.this_month = applications.filter(a => 
          new Date(a.created_at) > thirtyDaysAgo
        ).length;
        stats.applications.by_status = applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {});
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }

    // Get notifications/messages stats with error handling
    try {
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .select('id, is_read, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && notifications) {
        stats.messages.total = notifications.length;
        stats.messages.unread_from_clients = notifications.filter(n => !n.is_read).length;
        stats.messages.sent_today = notifications.filter(n => {
          const notificationDate = new Date(n.created_at);
          return notificationDate >= today;
        }).length;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }

    // Get recent activities (simplified)
    try {
      const { data: recentClients } = await supabaseAdmin
        .from('registered_users')
        .select('id, full_name, email, created_at')
        .eq('role', 'client')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentClients) {
        stats.recent_activities = recentClients.map(client => ({
          type: 'new_client',
          description: `New client registered: ${client.full_name}`,
          timestamp: client.created_at,
          user: client
        }));
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }

    console.log('✅ Enhanced dashboard stats fetched successfully');

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
      realtime_enabled: false // Simplified for now
    });
  } catch (error) {
    console.error('❌ Enhanced dashboard error:', error);
    logger.error('Enhanced dashboard error', error);
    res.status(500).json({ 
      error: 'Failed to fetch enhanced dashboard data',
      details: error.message 
    });
  }
};
        }).length
      },
      system: {
        online_users: realtimeManager.getConnectedUsers().length,
        server_uptime: process.uptime(),
        last_updated: new Date().toISOString()
      }
    };

    // Get upcoming consultations with details
    const upcomingConsultations = consultations
      .filter(c => c.status === 'scheduled' && new Date(c.scheduled_at) > new Date())
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        scheduled_at: c.scheduled_at,
        client_name: c.client?.full_name || c.prospect_name,
        client_email: c.client?.email || c.prospect_email,
        type: c.consultation_type,
        is_prospect: !c.client
      }));

    // Get recent client activities
    const recentClientActivities = (recentActivities.data || []).slice(0, 10);

    res.json({
      stats,
      upcoming_consultations: upcomingConsultations,
      recent_activities: recentClientActivities,
      connected_users: realtimeManager.getConnectedUsers()
    });

  } catch (error) {
    logger.error('Failed to get admin dashboard stats', error);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};

// GET /api/dashboard/client/stats - Enhanced client dashboard stats
const getClientDashboardStats = async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get client-specific data
    const [
      consultationsResult,
      applicationsResult,
      messagesResult,
      notificationsResult
    ] = await Promise.all([
      // Client's consultations
      supabaseAdmin
        .from('consultations')
        .select(`
          id, scheduled_at, status, consultation_type, admin_notes, client_summary,
          google_meet_link, duration_minutes
        `)
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: false }),
      
      // Client's applications
      supabaseAdmin
        .from('applications')
        .select(`
          id, job_title, company, status, date_applied, job_url,
          admin_notes, client_notes
        `)
        .eq('client_id', clientId)
        .order('date_applied', { ascending: false }),
      
      // Client's messages
      supabaseAdmin
        .from('messages')
        .select(`
          id, message_text, sender_type, is_read, created_at,
          sender:sender_id(full_name),
          recipient:recipient_id(full_name)
        `)
        .or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // Client's notifications
      supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', clientId)
        .eq('user_type', 'client')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const consultations = consultationsResult.data || [];
    const applications = applicationsResult.data || [];
    const messages = messagesResult.data || [];
    const notifications = notificationsResult.data || [];

    // Calculate client stats
    const stats = {
      consultations: {
        total: consultations.length,
        upcoming: consultations.filter(c => 
          c.status === 'scheduled' && new Date(c.scheduled_at) > new Date()
        ).length,
        completed: consultations.filter(c => c.status === 'completed').length,
        next_consultation: consultations.find(c => 
          c.status === 'scheduled' && new Date(c.scheduled_at) > new Date()
        )
      },
      applications: {
        total: applications.length,
        active: applications.filter(a => ['applied', 'interview'].includes(a.status)).length,
        interviews: applications.filter(a => a.status === 'interview').length,
        by_status: applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {})
      },
      messages: {
        total: messages.length,
        unread: messages.filter(m => 
          m.recipient_id === clientId && !m.is_read
        ).length,
        recent: messages.slice(0, 5)
      },
      notifications: {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        recent: notifications.slice(0, 5)
      }
    };

    res.json({
      stats,
      upcoming_consultations: consultations.filter(c => 
        c.status === 'scheduled' && new Date(c.scheduled_at) > new Date()
      ).slice(0, 3),
      recent_applications: applications.slice(0, 5),
      recent_messages: messages.slice(0, 5),
      unread_notifications: notifications.filter(n => !n.is_read)
    });

  } catch (error) {
    logger.error('Failed to get client dashboard stats', error);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};

// GET /api/dashboard/notifications - Get user notifications with real-time updates
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;
    const { page = 1, limit = 20, unread_only = false } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      notifications: notifications || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: notifications?.length === parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Failed to get notifications', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
};

// POST /api/dashboard/notifications/:id/read - Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Broadcast update to user
    realtimeManager.broadcastNotification(userId, req.user.role, {
      type: 'notification_read',
      notificationId: id
    });

    res.json({ success: true });

  } catch (error) {
    logger.error('Failed to mark notification as read', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// GET /api/dashboard/activities - Get recent dashboard activities (admin only)
const getDashboardActivities = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 50 } = req.query;

    const { data: activities, error } = await supabaseAdmin
      .from('dashboard_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      activities: activities || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: activities?.length === parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Failed to get dashboard activities', error);
    res.status(500).json({ error: 'Failed to load activities' });
  }
};

// GET /api/dashboard/messages - Get messages for real-time chat
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversation_with, page = 1, limit = 50 } = req.query;

    let query = supabaseAdmin
      .from('messages')
      .select(`
        id, message_text, sender_type, recipient_type, is_read, created_at,
        sender_id, recipient_id, consultation_id, application_id,
        attachment_url, attachment_name
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (conversation_with) {
      // Get conversation between current user and specific user
      query = query.or(
        `and(sender_id.eq.${userId},recipient_id.eq.${conversation_with}),and(sender_id.eq.${conversation_with},recipient_id.eq.${userId})`
      );
    } else {
      // Get all messages for current user
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    const { data: messages, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      messages: messages || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: messages?.length === parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Failed to get messages', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

// POST /api/dashboard/messages - Send a new message
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderType = req.user.role;
    const { recipient_id, recipient_type, message_text, consultation_id, application_id } = req.body;

    // Validate input
    if (!recipient_id || !recipient_type || !message_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Save message to database
    const { data: newMessage, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: senderId,
        sender_type: senderType,
        recipient_id,
        recipient_type,
        message_text,
        consultation_id: consultation_id || null,
        application_id: application_id || null
      })
      .select(`
        *,
        sender:sender_id(full_name, email),
        recipient:recipient_id(full_name, email)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Send real-time notification to recipient
    realtimeManager.broadcastNotification(recipient_id, recipient_type, {
      type: 'new_message',
      message: newMessage
    });

    res.status(201).json(newMessage);

  } catch (error) {
    logger.error('Failed to send message', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// GET /api/dashboard/online-users - Get currently online users (admin only)
const getOnlineUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const onlineUsers = realtimeManager.getConnectedUsers();
    
    res.json({
      online_users: onlineUsers,
      total_online: onlineUsers.length,
      admins_online: onlineUsers.filter(u => u.role === 'admin').length,
      clients_online: onlineUsers.filter(u => u.role === 'client').length
    });

  } catch (error) {
    logger.error('Failed to get online users', error);
    res.status(500).json({ error: 'Failed to load online users' });
  }
};

module.exports = {
  getAdminDashboardStats,
  getClientDashboardStats,
  getNotifications,
  markNotificationRead,
  getDashboardActivities,
  getMessages,
  sendMessage,
  getOnlineUsers
};