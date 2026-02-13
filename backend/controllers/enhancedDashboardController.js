const { supabaseAdmin } = require('../utils/supabase');
const logger = require('../utils/logger');
const realtimeManager = require('../utils/realtime');

// GET /api/dashboard/admin/stats - Enhanced admin dashboard stats
const getAdminDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get comprehensive stats
    const [
      clientsResult,
      consultationsResult,
      applicationsResult,
      messagesResult,
      recentActivities
    ] = await Promise.all([
      // Clients stats
      supabaseAdmin
        .from('clients')
        .select('id, full_name, status, created_at, last_active_at')
        .order('created_at', { ascending: false }),
      
      // Consultations stats
      supabaseAdmin
        .from('consultations')
        .select(`
          id, scheduled_at, status, consultation_type, prospect_name, prospect_email,
          client:client_id(id, full_name, email)
        `)
        .order('scheduled_at', { ascending: false }),
      
      // Applications stats
      supabaseAdmin
        .from('applications')
        .select('id, status, created_at, client_id')
        .order('created_at', { ascending: false }),
      
      // Messages stats
      supabaseAdmin
        .from('messages')
        .select('id, is_read, created_at, sender_type, recipient_type')
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Recent activities
      supabaseAdmin
        .from('dashboard_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const clients = clientsResult.data || [];
    const consultations = consultationsResult.data || [];
    const applications = applicationsResult.data || [];
    const messages = messagesResult.data || [];

    // Calculate stats
    const stats = {
      clients: {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        new_this_week: clients.filter(c => 
          new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        online: realtimeManager.getConnectedUsers().filter(u => u.role === 'client').length
      },
      consultations: {
        total: consultations.length,
        scheduled: consultations.filter(c => c.status === 'scheduled').length,
        completed: consultations.filter(c => c.status === 'completed').length,
        upcoming: consultations.filter(c => 
          c.status === 'scheduled' && new Date(c.scheduled_at) > new Date()
        ).length,
        today: consultations.filter(c => {
          const today = new Date();
          const consultationDate = new Date(c.scheduled_at);
          return consultationDate.toDateString() === today.toDateString();
        }).length
      },
      applications: {
        total: applications.length,
        this_month: applications.filter(a => 
          new Date(a.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        by_status: applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {})
      },
      messages: {
        total: messages.length,
        unread_from_clients: messages.filter(m => 
          m.recipient_type === 'admin' && !m.is_read
        ).length,
        sent_today: messages.filter(m => {
          const today = new Date();
          const messageDate = new Date(m.created_at);
          return messageDate.toDateString() === today.toDateString();
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

    // Try to get notifications with error handling
    let notifications = [];
    try {
      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (unread_only === 'true') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Notifications query error:', error);
        // Return empty notifications instead of failing
        notifications = [];
      } else {
        notifications = data || [];
      }
    } catch (dbError) {
      console.error('Database error in notifications:', dbError);
      notifications = [];
    }

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: notifications.length === parseInt(limit)
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
        id, content, sender_type, recipient_type, is_read, created_at,
        sender_id, recipient_id, consultation_id, application_id,
        attachments, subject, priority
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