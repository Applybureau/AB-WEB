const express = require('express');
const { supabase, supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// GET /api/notifications - Get client notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { read, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (read !== undefined) {
      query = query.eq('read', read === 'true');
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('read', false);

    if (countError) {
      console.error('Error counting unread notifications:', countError);
    }

    res.json({
      notifications,
      unread_count: unreadCount || 0,
      total: notifications.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
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
    const clientId = req.user.id;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('client_id', clientId)
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
    const clientId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('client_id', clientId)
      .eq('read', false);

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
    const clientId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

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
    const clientId = req.user.id;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('read', false);

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

module.exports = router;