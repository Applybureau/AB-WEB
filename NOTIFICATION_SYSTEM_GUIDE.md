# Comprehensive Notification System Guide

## Overview

The notification system provides real-time notifications for all backend actions, allowing the frontend to display notifications in a dropdown interface. Every significant backend action generates appropriate notifications for users and admins.

## Database Schema

### Enhanced Notifications Table

```sql
-- Core notification fields
id (uuid, primary key)
user_id (uuid, references registered_users.id)
title (text, required)
message (text, required)
is_read (boolean, default false)
created_at (timestamp)

-- Enhanced fields
type (text) -- Specific notification type
category (text) -- Grouping category
priority (text) -- Priority level
metadata (jsonb) -- Additional structured data
action_url (text) -- URL for action button
action_text (text) -- Text for action button
```

### Categories and Types

**Categories:**
- `consultation` - Consultation-related notifications
- `application` - Application tracking notifications
- `admin` - Admin actions and messages
- `system` - System announcements
- `file` - File upload/processing notifications
- `meeting` - Meeting-related notifications

**Priority Levels:**
- `low` - General information
- `medium` - Standard notifications
- `high` - Important updates
- `urgent` - Critical notifications

## Backend Implementation

### Notification Helpers

The system includes pre-built helpers for common actions:

```javascript
const { NotificationHelpers } = require('../utils/notifications');

// Consultation notifications
await NotificationHelpers.consultationSubmitted(userId, consultationData);
await NotificationHelpers.consultationUnderReview(userId, consultationData);
await NotificationHelpers.consultationApproved(userId, consultationData);
await NotificationHelpers.consultationRejected(userId, consultationData, reason);

// Admin notifications (sent to all admins)
await NotificationHelpers.newConsultationRequest(consultationData);

// Application tracking
await NotificationHelpers.applicationCreated(userId, applicationData);
await NotificationHelpers.applicationStatusChanged(userId, applicationData, oldStatus, newStatus);

// File operations
await NotificationHelpers.fileUploaded(userId, fileName, fileType);

// Meeting notifications
await NotificationHelpers.meetingScheduled(userId, meetingData);

// System notifications
await NotificationHelpers.systemMaintenance(message, scheduledTime);
```

### Custom Notifications

For custom notifications:

```javascript
const { createNotification } = require('../utils/notifications');

await createNotification({
  userId: 'user-id',
  type: 'custom_action',
  title: 'Custom Notification',
  message: 'This is a custom notification message.',
  category: 'system',
  priority: 'medium',
  metadata: { customData: 'value' },
  actionUrl: '/dashboard/custom',
  actionText: 'View Details'
});
```

## API Endpoints

### Client Endpoints

#### GET /api/notifications
Get user notifications with filtering and pagination.

**Query Parameters:**
- `read` (boolean) - Filter by read status
- `category` (string) - Filter by category
- `priority` (string) - Filter by priority
- `type` (string) - Filter by notification type
- `limit` (number, default: 20) - Number of notifications
- `offset` (number, default: 0) - Pagination offset

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "consultation_approved",
      "title": "Consultation Approved! 🎉",
      "message": "Great news! Your consultation request has been approved.",
      "category": "consultation",
      "priority": "high",
      "is_read": false,
      "created_at": "2024-01-10T10:00:00Z",
      "action_url": "/dashboard/consultations",
      "action_text": "Get Started",
      "metadata": {
        "consultationId": "consultation-uuid"
      }
    }
  ],
  "stats": {
    "total_unread": 5,
    "by_category": {
      "consultation": 2,
      "application": 1,
      "system": 2
    },
    "by_priority": {
      "high": 1,
      "medium": 3,
      "low": 1
    }
  },
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 15
  }
}
```

#### GET /api/notifications/unread-count
Get unread notification count for badge display.

**Response:**
```json
{
  "unread_count": 5
}
```

#### GET /api/notifications/recent
Get recent notifications for real-time updates.

**Query Parameters:**
- `since` (ISO timestamp) - Get notifications since this time

**Response:**
```json
{
  "notifications": [...],
  "timestamp": "2024-01-10T10:00:00Z"
}
```

#### PATCH /api/notifications/:id/read
Mark a specific notification as read.

#### PATCH /api/notifications/read-all
Mark all user notifications as read.

#### DELETE /api/notifications/:id
Delete a specific notification.

### Admin Endpoints

#### GET /api/notifications/admin/stats
Get system-wide notification statistics.

#### POST /api/notifications/test
Create test notifications for debugging.

## Frontend Integration

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications', {
        params: { limit: 10 }
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.stats.total_unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Real-time polling
  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(() => {
      if (!isOpen) {
        // Only poll when dropdown is closed to avoid disrupting user
        fetchNotifications();
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'consultation': return '💼';
      case 'application': return '📋';
      case 'meeting': return '📅';
      case 'file': return '📁';
      case 'admin': return '👨‍💼';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    if (notification.action_url) {
                      window.location.href = notification.action_url;
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">
                      {getCategoryIcon(notification.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                      {notification.action_text && (
                        <span className="text-xs text-blue-600 mt-1 inline-block">
                          {notification.action_text} →
                        </span>
                      )}
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t text-center">
            <a
              href="/dashboard/notifications"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
```

### Integration with Existing Routes

Add notification creation to your existing backend routes:

```javascript
// In consultation routes
const { NotificationHelpers } = require('../utils/notifications');

// When consultation is submitted
await NotificationHelpers.consultationSubmitted(userId, consultationData);
await NotificationHelpers.newConsultationRequest(consultationData);

// When status changes
if (status === 'under_review') {
  await NotificationHelpers.consultationUnderReview(userId, consultation);
}

// In application routes
await NotificationHelpers.applicationCreated(userId, applicationData);
await NotificationHelpers.applicationStatusChanged(userId, applicationData, oldStatus, newStatus);

// In file upload routes
await NotificationHelpers.fileUploaded(userId, fileName, fileType);
```

## Real-time Updates

### Polling Strategy

```javascript
// Simple polling every 30 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const response = await axios.get('/api/notifications/recent', {
        params: { since: lastFetchTime }
      });
      
      if (response.data.notifications.length > 0) {
        // New notifications available
        setNotifications(prev => [...response.data.notifications, ...prev]);
        setUnreadCount(prev => prev + response.data.notifications.length);
      }
      
      setLastFetchTime(response.data.timestamp);
    } catch (error) {
      console.error('Failed to fetch recent notifications:', error);
    }
  }, 30000);

  return () => clearInterval(interval);
}, [lastFetchTime]);
```

### WebSocket Integration (Future Enhancement)

For real-time notifications, consider implementing WebSocket connections:

```javascript
// WebSocket client example
const ws = new WebSocket('ws://localhost:3000/notifications');

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  setNotifications(prev => [notification, ...prev]);
  setUnreadCount(prev => prev + 1);
  
  // Show toast notification
  showToast(notification.title, notification.message);
};
```

## Testing

Run the comprehensive test suite:

```bash
node backend/scripts/test-notification-system.js
```

This will test:
- Database schema
- Notification creation
- Helper functions
- API endpoints
- Data cleanup

## Deployment Checklist

1. **Database Setup:**
   ```sql
   -- Run in Supabase SQL Editor
   \i backend/ENHANCE_NOTIFICATIONS_TABLE.sql
   ```

2. **Environment Variables:**
   - Ensure JWT_SECRET is set
   - Configure email settings

3. **Frontend Integration:**
   - Add NotificationDropdown component
   - Set up API client with authentication
   - Implement real-time polling

4. **Testing:**
   - Run notification test suite
   - Test with real user accounts
   - Verify email notifications work

5. **Monitoring:**
   - Set up notification delivery monitoring
   - Track notification engagement metrics
   - Monitor database performance

## Best Practices

1. **Performance:**
   - Use pagination for large notification lists
   - Implement efficient database indexes
   - Cache unread counts when possible

2. **User Experience:**
   - Group similar notifications
   - Provide clear action buttons
   - Use appropriate priority levels

3. **Privacy:**
   - Only send notifications to authorized users
   - Sanitize notification content
   - Respect user notification preferences

4. **Reliability:**
   - Handle notification failures gracefully
   - Don't fail main operations if notifications fail
   - Implement retry logic for critical notifications

## Future Enhancements

1. **Real-time WebSocket notifications**
2. **Push notifications for mobile**
3. **Email digest notifications**
4. **User notification preferences**
5. **Notification templates system**
6. **Analytics and engagement tracking**