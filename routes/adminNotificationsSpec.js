const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// GET /api/admin/notifications - Get admin notifications (PROTECTED)
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      category,
      is_read,
      limit = 50, 
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('id, title, message, category, priority, is_read, created_at, action_url, action_text, metadata')
      .eq('recipient_type', 'admin')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch notifications',
        code: 'DATABASE_ERROR'
      });
    }

    // Format notifications according to spec
    const formattedNotifications = (notifications || []).map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      priority: notification.priority || 'medium',
      is_read: notification.is_read,
      created_at: notification.created_at,
      action_url: notification.action_url,
      action_text: notification.action_text
    }));

    res.json({
      success: true,
      notifications: formattedNotifications,
      total: notifications?.length || 0,
      unread_count: formattedNotifications.filter(n => !n.is_read).length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch notifications',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/admin/notifications/:id - Mark notification as read (PROTECTED)
router.patch('/notifications/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;

    if (is_read === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'is_read field is required',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    // Update notification
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: is_read,
        read_at: is_read ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('recipient_type', 'admin')
      .select()
      .single();

    if (error || !notification) {
      return res.status(404).json({ 
        success: false,
        error: 'Notification not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: `Notification marked as ${is_read ? 'read' : 'unread'}`,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        priority: notification.priority,
        is_read: notification.is_read,
        created_at: notification.created_at,
        action_url: notification.action_url,
        action_text: notification.action_text
      }
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update notification',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/admin/notifications/mark-all-read - Mark all notifications as read (PROTECTED)
router.post('/notifications/mark-all-read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('recipient_type', 'admin')
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to mark all notifications as read',
        code: 'UPDATE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to mark all notifications as read',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/notifications/unread-count - Get unread notification count (PROTECTED)
router.get('/notifications/unread-count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('recipient_type', 'admin')
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch unread count',
        code: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      unread_count: data?.length || 0
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch unread count',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;