const { supabaseAdmin } = require('./supabase');

/**
 * Notification Types and Categories
 */
const NOTIFICATION_TYPES = {
  // Consultation related
  CONSULTATION_SUBMITTED: 'consultation_submitted',
  CONSULTATION_UNDER_REVIEW: 'consultation_under_review',
  CONSULTATION_APPROVED: 'consultation_approved',
  CONSULTATION_REJECTED: 'consultation_rejected',
  CONSULTATION_SCHEDULED: 'consultation_scheduled',
  
  // Application related
  APPLICATION_CREATED: 'application_created',
  APPLICATION_UPDATED: 'application_updated',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',
  
  // Admin actions
  ADMIN_MESSAGE: 'admin_message',
  ACCOUNT_UPDATED: 'account_updated',
  PROFILE_APPROVED: 'profile_approved',
  
  // System notifications
  SYSTEM_MAINTENANCE: 'system_maintenance',
  FEATURE_ANNOUNCEMENT: 'feature_announcement',
  
  // File related
  FILE_UPLOADED: 'file_uploaded',
  FILE_PROCESSED: 'file_processed',
  
  // Meeting related
  MEETING_SCHEDULED: 'meeting_scheduled',
  MEETING_REMINDER: 'meeting_reminder',
  MEETING_CANCELLED: 'meeting_cancelled'
};

const NOTIFICATION_CATEGORIES = {
  CONSULTATION: 'consultation',
  APPLICATION: 'application',
  ADMIN: 'admin',
  SYSTEM: 'system',
  FILE: 'file',
  MEETING: 'meeting'
};

const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Create a notification for a user
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - Target user ID
 * @param {string} params.type - Notification type from NOTIFICATION_TYPES
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.category - Notification category from NOTIFICATION_CATEGORIES
 * @param {string} params.priority - Notification priority from NOTIFICATION_PRIORITIES
 * @param {Object} params.metadata - Additional metadata (optional)
 * @param {string} params.actionUrl - URL for action button (optional)
 * @param {string} params.actionText - Text for action button (optional)
 */
async function createNotification({
  userId,
  type,
  title,
  message,
  category = NOTIFICATION_CATEGORIES.SYSTEM,
  priority = NOTIFICATION_PRIORITIES.MEDIUM,
  metadata = {},
  actionUrl = null,
  actionText = null
}) {
  try {
    const notification = {
      user_id: userId,
      type,
      title,
      message,
      category,
      priority,
      metadata,
      action_url: actionUrl,
      action_text: actionText,
      is_read: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    console.log(`📢 Notification created for user ${userId}: ${title}`);
    return data;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
async function createBulkNotifications(notifications) {
  try {
    const notificationData = notifications.map(notification => ({
      ...notification,
      is_read: false,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData)
      .select();

    if (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }

    console.log(`📢 ${data.length} bulk notifications created`);
    return data;
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    throw error;
  }
}

/**
 * Create admin notification (for all admin users)
 */
async function createAdminNotification({
  type,
  title,
  message,
  category = NOTIFICATION_CATEGORIES.ADMIN,
  priority = NOTIFICATION_PRIORITIES.MEDIUM,
  metadata = {},
  actionUrl = null,
  actionText = null
}) {
  try {
    // Get all admin users
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }

    if (!admins || admins.length === 0) {
      console.log('No admin users found for notification');
      return [];
    }

    // Create notifications for all admins
    const notifications = admins.map(admin => ({
      user_id: admin.id,
      type,
      title,
      message,
      category,
      priority,
      metadata,
      action_url: actionUrl,
      action_text: actionText
    }));

    return await createBulkNotifications(notifications);
  } catch (error) {
    console.error('Failed to create admin notification:', error);
    throw error;
  }
}

/**
 * Notification helpers for common actions
 */
const NotificationHelpers = {
  // Consultation notifications
  consultationSubmitted: (userId, consultationData) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.CONSULTATION_SUBMITTED,
    title: 'Consultation Request Submitted',
    message: `Your consultation request for "${consultationData.role_targets}" has been submitted successfully.`,
    category: NOTIFICATION_CATEGORIES.CONSULTATION,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { consultationId: consultationData.id },
    actionUrl: '/dashboard/consultations',
    actionText: 'View Details'
  }),

  consultationUnderReview: (userId, consultationData) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.CONSULTATION_UNDER_REVIEW,
    title: 'Consultation Under Review',
    message: 'Your consultation request is now under review by our team.',
    category: NOTIFICATION_CATEGORIES.CONSULTATION,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { consultationId: consultationData.id },
    actionUrl: '/dashboard/consultations',
    actionText: 'View Status'
  }),

  consultationApproved: (userId, consultationData) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.CONSULTATION_APPROVED,
    title: 'Consultation Approved! 🎉',
    message: 'Great news! Your consultation request has been approved. Check your email for next steps.',
    category: NOTIFICATION_CATEGORIES.CONSULTATION,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { consultationId: consultationData.id },
    actionUrl: '/dashboard/consultations',
    actionText: 'Get Started'
  }),

  consultationRejected: (userId, consultationData, reason) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.CONSULTATION_REJECTED,
    title: 'Consultation Request Update',
    message: `Your consultation request has been reviewed. ${reason || 'Please check your email for more details.'}`,
    category: NOTIFICATION_CATEGORIES.CONSULTATION,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { consultationId: consultationData.id, reason },
    actionUrl: '/dashboard/consultations',
    actionText: 'View Details'
  }),

  // Admin notifications
  newConsultationRequest: (consultationData) => createAdminNotification({
    type: NOTIFICATION_TYPES.CONSULTATION_SUBMITTED,
    title: 'New Consultation Request',
    message: `New consultation request from ${consultationData.full_name} for "${consultationData.role_targets}".`,
    category: NOTIFICATION_CATEGORIES.CONSULTATION,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      consultationId: consultationData.id,
      clientName: consultationData.full_name,
      clientEmail: consultationData.email,
      country: consultationData.current_country
    },
    actionUrl: '/admin/consultations',
    actionText: 'Review Request'
  }),

  // Application notifications
  applicationCreated: (userId, applicationData) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.APPLICATION_CREATED,
    title: 'Application Tracked',
    message: `Your application to ${applicationData.company} for ${applicationData.position} has been added to your tracker.`,
    category: NOTIFICATION_CATEGORIES.APPLICATION,
    priority: NOTIFICATION_PRIORITIES.LOW,
    metadata: { applicationId: applicationData.id },
    actionUrl: '/dashboard/applications',
    actionText: 'View Application'
  }),

  applicationStatusChanged: (userId, applicationData, oldStatus, newStatus) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.APPLICATION_STATUS_CHANGED,
    title: 'Application Status Updated',
    message: `Your application to ${applicationData.company} status changed from "${oldStatus}" to "${newStatus}".`,
    category: NOTIFICATION_CATEGORIES.APPLICATION,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      applicationId: applicationData.id,
      oldStatus,
      newStatus
    },
    actionUrl: '/dashboard/applications',
    actionText: 'View Details'
  }),

  // File notifications
  fileUploaded: (userId, fileName, fileType) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.FILE_UPLOADED,
    title: 'File Uploaded Successfully',
    message: `Your ${fileType} "${fileName}" has been uploaded successfully.`,
    category: NOTIFICATION_CATEGORIES.FILE,
    priority: NOTIFICATION_PRIORITIES.LOW,
    metadata: { fileName, fileType },
    actionUrl: '/dashboard/files',
    actionText: 'View Files'
  }),

  // Meeting notifications
  meetingScheduled: (userId, meetingData) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.MEETING_SCHEDULED,
    title: 'Meeting Scheduled',
    message: `Your consultation meeting has been scheduled for ${new Date(meetingData.scheduled_at).toLocaleDateString()}.`,
    category: NOTIFICATION_CATEGORIES.MEETING,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { meetingId: meetingData.id },
    actionUrl: '/dashboard/meetings',
    actionText: 'View Meeting'
  }),

  // System notifications
  systemMaintenance: (message, scheduledTime) => createAdminNotification({
    type: NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
    title: 'System Maintenance Scheduled',
    message: `${message} Scheduled for: ${scheduledTime}`,
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    priority: NOTIFICATION_PRIORITIES.URGENT,
    metadata: { scheduledTime },
    actionUrl: '/admin/system',
    actionText: 'View Details'
  })
};

module.exports = {
  createNotification,
  createBulkNotifications,
  createAdminNotification,
  NotificationHelpers,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES
};