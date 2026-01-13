const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// GET /api/notifications - Get user notifications (PROTECTED)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 25, offset = 0, is_read, category } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }

    if (category) {
      query = query.eq('category', category);
    }

    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch notifications',
        code: 'DATABASE_ERROR'
      });
    }

    // Get unread count
    const { data: unreadNotifications, error: unreadError } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('is_read', false);

    if (unreadError) {
      console.error('Error fetching unread count:', unreadError);
    }

    // Format notifications to match specification
    const formattedNotifications = notifications?.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
      is_read: notification.is_read,
      created_at: notification.created_at,
      action_url: notification.action_url,
      action_text: notification.action_text,
      data: JSON.parse(notification.data || '{}')
    })) || [];

    res.json({
      success: true,
      notifications: formattedNotifications,
      unread_count: unreadNotifications?.length || 0,
      total: count || 0
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch notifications',
      code: 'SERVER_ERROR'
    });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read (PROTECTED)
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to mark notification as read',
        code: 'DATABASE_ERROR'
      });
    }

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        error: 'Notification not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        id: notification.id,
        is_read: notification.is_read,
        read_at: notification.read_at
      }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to mark notification as read',
      code: 'SERVER_ERROR'
    });
  }
});

// PATCH /api/notifications/mark-all-read - Mark all notifications as read (PROTECTED)
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to mark all notifications as read',
        code: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to mark all notifications as read',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE /api/notifications/:id - Delete notification (PROTECTED)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete notification',
        code: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete notification',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/notifications - Create notification (ADMIN ONLY)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Only allow admins to create notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required',
        code: 'PERMISSION_DENIED'
      });
    }

    const {
      user_id,
      title,
      message,
      category,
      priority = 'medium',
      action_url,
      action_text,
      data = {}
    } = req.body;

    // Validate required fields
    if (!user_id || !title || !message || !category) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: user_id, title, message, category',
        code: 'VALIDATION_ERROR'
      });
    }

    // Create notification
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        category,
        priority,
        action_url,
        action_text,
        data: JSON.stringify(data)
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create notification',
        code: 'DATABASE_ERROR'
      });
    }

    // Format response
    const formattedNotification = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority,
      is_read: notification.is_read,
      created_at: notification.created_at,
      action_url: notification.action_url,
      action_text: notification.action_text,
      data: JSON.parse(notification.data || '{}')
    };

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: formattedNotification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create notification',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/notifications/categories - Get notification categories (PROTECTED)
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { value: 'interview', label: 'Interview Updates', icon: 'calendar' },
      { value: 'application', label: 'Application Status', icon: 'briefcase' },
      { value: 'mock_session', label: 'Mock Sessions', icon: 'video' },
      { value: 'system', label: 'System Notifications', icon: 'bell' },
      { value: 'profile', label: 'Profile Updates', icon: 'user' },
      { value: 'payment', label: 'Payment & Billing', icon: 'credit-card' },
      { value: 'resource', label: 'New Resources', icon: 'book' },
      { value: 'meeting', label: 'Meetings & Calls', icon: 'phone' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get notification categories error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch notification categories',
      code: 'SERVER_ERROR'
    });
  }
});

// Helper function to create notifications (used by other parts of the system)
const createNotification = async (userId, title, message, category, options = {}) => {
  try {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        category,
        priority: options.priority || 'medium',
        action_url: options.action_url,
        action_text: options.action_text,
        data: JSON.stringify(options.data || {})
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return notification;
  } catch (error) {
    console.error('Create notification helper error:', error);
    return null;
  }
};

// Helper function to create bulk notifications
const createBulkNotifications = async (userIds, title, message, category, options = {}) => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      category,
      priority: options.priority || 'medium',
      action_url: options.action_url,
      action_text: options.action_text,
      data: JSON.stringify(options.data || {})
    }));

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      console.error('Error creating bulk notifications:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Create bulk notifications helper error:', error);
    return null;
  }
};

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.createBulkNotifications = createBulkNotifications;