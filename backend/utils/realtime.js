const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./supabase');
const logger = require('./logger');

class RealtimeManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket info
    this.adminSockets = new Set();
    this.clientSockets = new Set();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL,
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupSocketHandlers();
    logger.info('Real-time WebSocket server initialized');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('New socket connection', { socketId: socket.id });

      // Authenticate user
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Get user details
          const { data: user, error } = await supabaseAdmin
            .from(decoded.role === 'admin' ? 'admins' : 'clients')
            .select('id, full_name, email, role')
            .eq('id', decoded.id)
            .single();

          if (error || !user) {
            socket.emit('auth_error', { error: 'Invalid user' });
            return;
          }

          // Store user connection
          socket.userId = user.id;
          socket.userRole = user.role;
          socket.userName = user.full_name;

          this.connectedUsers.set(user.id, {
            socket,
            user,
            connectedAt: new Date()
          });

          if (user.role === 'admin') {
            this.adminSockets.add(socket);
            socket.join('admins');
          } else {
            this.clientSockets.add(socket);
            socket.join('clients');
            socket.join(`client_${user.id}`);
          }

          socket.emit('authenticated', { user });
          logger.info('User authenticated', { userId: user.id, role: user.role });

          // Send initial data
          await this.sendInitialData(socket, user);

        } catch (error) {
          logger.error('Socket authentication failed', error);
          socket.emit('auth_error', { error: 'Authentication failed' });
        }
      });

      // Handle real-time messaging
      socket.on('send_message', async (data) => {
        if (!socket.userId) {
          socket.emit('error', { error: 'Not authenticated' });
          return;
        }

        try {
          const { recipientId, recipientType, message, consultationId, applicationType } = data;

          // Save message to database
          const { data: newMessage, error } = await supabaseAdmin
            .from('messages')
            .insert({
              sender_id: socket.userId,
              sender_type: socket.userRole,
              recipient_id: recipientId,
              recipient_type: recipientType,
              message_text: message,
              consultation_id: consultationId || null,
              application_id: applicationType || null
            })
            .select(`
              *,
              sender:sender_id(full_name, email),
              recipient:recipient_id(full_name, email)
            `)
            .single();

          if (error) {
            socket.emit('message_error', { error: 'Failed to send message' });
            return;
          }

          // Send to recipient if online
          const recipientConnection = this.connectedUsers.get(recipientId);
          if (recipientConnection) {
            recipientConnection.socket.emit('new_message', newMessage);
          }

          // Confirm to sender
          socket.emit('message_sent', newMessage);

          logger.info('Real-time message sent', {
            from: socket.userId,
            to: recipientId,
            messageId: newMessage.id
          });

        } catch (error) {
          logger.error('Failed to send real-time message', error);
          socket.emit('message_error', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { recipientId } = data;
        const recipientConnection = this.connectedUsers.get(recipientId);
        if (recipientConnection) {
          recipientConnection.socket.emit('user_typing', {
            userId: socket.userId,
            userName: socket.userName
          });
        }
      });

      socket.on('typing_stop', (data) => {
        const { recipientId } = data;
        const recipientConnection = this.connectedUsers.get(recipientId);
        if (recipientConnection) {
          recipientConnection.socket.emit('user_stopped_typing', {
            userId: socket.userId
          });
        }
      });

      // Handle notification read status
      socket.on('mark_notification_read', async (data) => {
        try {
          const { notificationId } = data;
          
          await supabaseAdmin
            .from('notifications')
            .update({ 
              is_read: true, 
              read_at: new Date().toISOString() 
            })
            .eq('id', notificationId)
            .eq('user_id', socket.userId);

          socket.emit('notification_read', { notificationId });

        } catch (error) {
          logger.error('Failed to mark notification as read', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.adminSockets.delete(socket);
          this.clientSockets.delete(socket);
          
          logger.info('User disconnected', { 
            userId: socket.userId, 
            role: socket.userRole 
          });
        }
      });
    });
  }

  async sendInitialData(socket, user) {
    try {
      // Send unread notifications
      const { data: notifications } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('user_type', user.role)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      socket.emit('initial_notifications', notifications || []);

      // Send recent messages for the user
      let messagesQuery = supabaseAdmin
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name, email),
          recipient:recipient_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (user.role === 'client') {
        messagesQuery = messagesQuery.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
      }

      const { data: messages } = await messagesQuery;
      socket.emit('initial_messages', messages || []);

      // Send dashboard stats
      if (user.role === 'admin') {
        const stats = await this.getAdminDashboardStats();
        socket.emit('dashboard_stats', stats);
      } else {
        const stats = await this.getClientDashboardStats(user.id);
        socket.emit('dashboard_stats', stats);
      }

    } catch (error) {
      logger.error('Failed to send initial data', error);
    }
  }

  // Broadcast notification to specific user
  async broadcastNotification(userId, userType, notification) {
    const connection = this.connectedUsers.get(userId);
    if (connection) {
      connection.socket.emit('new_notification', notification);
    }
  }

  // Broadcast to all admins
  async broadcastToAdmins(event, data) {
    this.io.to('admins').emit(event, data);
  }

  // Broadcast to specific client
  async broadcastToClient(clientId, event, data) {
    this.io.to(`client_${clientId}`).emit(event, data);
  }

  // Broadcast dashboard update
  async broadcastDashboardUpdate(userType, data) {
    if (userType === 'admin') {
      this.io.to('admins').emit('dashboard_update', data);
    } else {
      this.io.to('clients').emit('dashboard_update', data);
    }
  }

  async getAdminDashboardStats() {
    try {
      const [
        { count: totalClients },
        { count: totalConsultations },
        { count: pendingConsultations },
        { count: unreadMessages }
      ] = await Promise.all([
        supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('consultations').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('consultations').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false).eq('recipient_type', 'admin')
      ]);

      return {
        totalClients,
        totalConsultations,
        pendingConsultations,
        unreadMessages,
        onlineUsers: this.connectedUsers.size
      };
    } catch (error) {
      logger.error('Failed to get admin dashboard stats', error);
      return {};
    }
  }

  async getClientDashboardStats(clientId) {
    try {
      const [
        { count: totalConsultations },
        { count: unreadMessages },
        { count: totalApplications }
      ] = await Promise.all([
        supabaseAdmin.from('consultations').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
        supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }).eq('recipient_id', clientId).eq('is_read', false),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('client_id', clientId)
      ]);

      return {
        totalConsultations,
        unreadMessages,
        totalApplications
      };
    } catch (error) {
      logger.error('Failed to get client dashboard stats', error);
      return {};
    }
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values()).map(conn => ({
      userId: conn.user.id,
      userName: conn.user.full_name,
      role: conn.user.role,
      connectedAt: conn.connectedAt
    }));
  }
}

const realtimeManager = new RealtimeManager();

module.exports = realtimeManager;