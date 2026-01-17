const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// GET /api/notifications - Get client notifications with enhanced filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId || req.user.id;
    if (!clientId) {
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }
    
    const { 
      read, 
      category, 
      priority, 
      type,
      limit = 20, 
      offset = 0 
    } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (read !== undefined) {
      query = query.eq('is_read', read === 'true');
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Get unread count by category
    const { data: unreadStats, error: statsError } = await supabaseAdmin
      .from('notifications')
      .select('category, priority')
      .eq('user_id', clientId)
      .eq('is_read', false);

    if (statsError) {
      console.error('Error fetching notification stats:', statsError);
    }

    // Calculate stats
    const stats = {
      total_unread: unreadStats?.length || 0,
      by_category: {},
      by_priority: {}
    };

    if (unreadStats) {
      unreadStats.forEach(notification => {
        stats.by_category[notification.category] = (stats.by_category[notification.category] || 0) + 1;
        stats.by_priority[notification.priority] = (stats.by_priority[notification.priority] || 0) + 1;
      });
    }

    res.json({
      notifications: notifications || [],
      stats,
      pagination: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        total: notifications?.length || 0
      }
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId || req.user.id;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', clientId)
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
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId || req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', clientId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ error: 'Failed to mark notifications as read' });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.userId || req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', clientId);

    if (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId || req.user.id;

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', clientId)
      .eq('is_read', false);

    if (error) {
      console.error('Error counting unread notifications:', error);
      return res.status(500).json({ error: 'Failed to count unread notifications' });
    }

    res.json({ unread_count: count || 0 });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// GET /api/notifications/recent - Get recent notifications for real-time updates
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId || req.user.id;
    const { since } = req.query; // ISO timestamp

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (since) {
      query = query.gt('created_at', since);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching recent notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch recent notifications' });
    }

    res.json({
      notifications: notifications || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recent notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch recent notifications' });
  }
});

// POST /api/notifications/test - Create test notification (ADMIN ONLY)
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      userId, 
      type = 'system_test',
      title = 'Test Notification',
      message = 'This is a test notification from the admin panel.',
      category = 'system',
      priority = 'low'
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for test notification' });
    }

    const { createNotification } = require('../utils/notifications');
    
    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      category,
      priority,
      metadata: { test: true, created_by: req.user.userId || req.user.id }
    });

    res.json({
      message: 'Test notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

// GET /api/notifications/admin/stats - Get notification statistics (ADMIN ONLY)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: allNotifications, error } = await supabaseAdmin
      .from('notifications')
      .select('type, category, priority, is_read, created_at');

    if (error) {
      console.error('Error fetching notification stats:', error);
      return res.status(500).json({ error: 'Failed to fetch notification statistics' });
    }

    const stats = {
      total: allNotifications?.length || 0,
      unread: allNotifications?.filter(n => !n.is_read).length || 0,
      by_category: {},
      by_priority: {},
      by_type: {},
      recent_activity: {}
    };

    if (allNotifications) {
      allNotifications.forEach(notification => {
        // Category stats
        stats.by_category[notification.category] = (stats.by_category[notification.category] || 0) + 1;
        
        // Priority stats
        stats.by_priority[notification.priority] = (stats.by_priority[notification.priority] || 0) + 1;
        
        // Type stats
        stats.by_type[notification.type] = (stats.by_type[notification.type] || 0) + 1;
        
        // Recent activity (last 7 days)
        const createdDate = new Date(notification.created_at);
        const dayKey = createdDate.toISOString().split('T')[0];
        stats.recent_activity[dayKey] = (stats.recent_activity[dayKey] || 0) + 1;
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Notification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

module.exports = router;