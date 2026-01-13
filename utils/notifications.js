const { supabaseAdmin } = require('./supabase');

/**
 * Notification Types and Categories (Updated for Concierge Model)
 */
const NOTIFICATION_TYPES = {
  // Consultation related (Concierge Model)
  CONSULTATION_SUBMITTED: 'consultation_submitted',
  CONSULTATION_CONFIRMED_BY_ADMIN: 'consultation_confirmed_by_admin',
  CONSULTATION_RESCHEDULED_BY_ADMIN: 'consultation_rescheduled_by_admin',
  CONSULTATION_WAITLISTED_BY_ADMIN: 'consultation_waitlisted_by_admin',
  
  // Payment and Registration (Concierge Model)
  PAYMENT_CONFIRMED_INVITE_SENT: 'payment_confirmed_invite_sent',
  
  // Onboarding (Concierge Model)
  ONBOARDING_COMPLETED_NEEDS_APPROVAL: 'onboarding_completed_needs_approval',
  PROFILE_UNLOCKED_BY_ADMIN: 'profile_unlocked_by_admin',
  
  // Application related (Enhanced for Concierge)
  APPLICATION_CREATED: 'application_created',
  APPLICATION_UPDATED: 'application_updated',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',
  INTERVIEW_REQUEST_RECEIVED: 'interview_request_received',
  
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
  MEETING: 'meeting',
  CONCIERGE: 'concierge' // New category for concierge actions
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
      user_type: 'client', // Default to client, will be overridden for admin notifications
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
      user_type: notification.user_type || 'client', // Default to client
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
      user_type: 'admin', // Set admin user type
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

  newConsultationRequestWithTimes: (consultationData) => createAdminNotification({
    type: NOTIFICATION_TYPES.CONSULTATION_SUBMITTED,
    title: 'New Consultation Request with Time Slots',
    message: `${consultationData.full_name} requested consultation for "${consultationData.role_targets}" with 3 time options.`,
    category: NOTIFICATION_CATEGORIES.CONSULTATION,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      consultationId: consultationData.id,
      clientName: consultationData.full_name,
      clientEmail: consultationData.email,
      timeSlots: [
        consultationData.preferred_time_1,
        consultationData.preferred_time_2,
        consultationData.preferred_time_3
      ],
      timezone: consultationData.timezone
    },
    actionUrl: '/admin/consultations',
    actionText: 'Confirm Time Slot'
  }),

  consultationConfirmed: (userId, consultationData) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.CONSULTATION_SCHEDULED,
    title: 'Consultation Confirmed! 📅',
    message: `Your consultation has been scheduled for ${new Date(consultationData.confirmed_time).toLocaleDateString()}.`,
    category: NOTIFICATION_CATEGORIES.CONSULTATION,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      consultationId: consultationData.id,
      confirmedTime: consultationData.confirmed_time,
      meetingType: consultationData.meeting_type
    },
    actionUrl: '/client/consultations',
    actionText: 'View Details'
  }),

  newAvailabilityRequested: (userId, consultationData) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.CONSULTATION_UNDER_REVIEW,
    title: 'New Availability Requested',
    message: 'Please provide new preferred times for your consultation.',
    category: NOTIFICATION_CATEGORIES.CONSULTATION,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      consultationId: consultationData.id,
      reason: consultationData.availability_request_reason
    },
    actionUrl: `/consultation/new-times/${consultationData.id}`,
    actionText: 'Provide New Times'
  }),

  clientRegistrationComplete: (userId, consultationData) => createNotification({
    userId,
    type: 'client_registered',
    title: 'Welcome to Apply Bureau! 🎉',
    message: 'Your account has been created successfully. Complete your onboarding to get started.',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      consultationId: consultationData.id,
      tier: consultationData.selected_tier
    },
    actionUrl: '/client/onboarding',
    actionText: 'Start Onboarding'
  }),

  clientOnboardingCompleted: (userId, onboardingData) => createAdminNotification({
    type: 'onboarding_completed',
    title: 'Client Completed Onboarding',
    message: `Client has completed their onboarding questionnaire and is ready for strategy call.`,
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      userId,
      targetRoles: onboardingData.target_roles,
      jobSearchTimeline: onboardingData.job_search_timeline
    },
    actionUrl: '/admin/clients',
    actionText: 'View Client'
  }),

  newStrategyCallRequest: (strategyCallData, userData) => createAdminNotification({
    type: 'strategy_call_requested',
    title: 'New Strategy Call Request',
    message: `${userData.full_name} requested a Strategy & Role Alignment Call with 3 time options.`,
    category: NOTIFICATION_CATEGORIES.MEETING,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      strategyCallId: strategyCallData.id,
      clientName: userData.full_name,
      clientEmail: userData.email,
      tier: userData.tier,
      timeSlots: [
        strategyCallData.preferred_time_1,
        strategyCallData.preferred_time_2,
        strategyCallData.preferred_time_3
      ]
    },
    actionUrl: '/admin/strategy-calls',
    actionText: 'Confirm Time Slot'
  }),

  strategyCallConfirmed: (userId, strategyCallData) => createNotification({
    userId,
    type: 'strategy_call_confirmed',
    title: 'Strategy Call Confirmed! 📞',
    message: `Your Strategy & Role Alignment Call has been scheduled for ${new Date(strategyCallData.confirmed_time).toLocaleDateString()}.`,
    category: NOTIFICATION_CATEGORIES.MEETING,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      strategyCallId: strategyCallData.id,
      confirmedTime: strategyCallData.confirmed_time,
      meetingType: strategyCallData.meeting_type
    },
    actionUrl: '/client/strategy-calls',
    actionText: 'View Details'
  }),

  newStrategyCallAvailabilityRequested: (userId, strategyCallData) => createNotification({
    userId,
    type: 'new_availability_requested',
    title: 'New Availability Requested',
    message: 'Please provide new preferred times for your strategy call.',
    category: NOTIFICATION_CATEGORIES.MEETING,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      strategyCallId: strategyCallData.id,
      reason: strategyCallData.availability_request_reason
    },
    actionUrl: `/client/strategy-call/new-times/${strategyCallData.id}`,
    actionText: 'Provide New Times'
  }),

  jobSearchEmailProvided: (userId, email) => createNotification({
    userId,
    type: 'job_search_email_provided',
    title: 'Job Search Email Saved',
    message: 'Your job search email credentials have been securely saved.',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    priority: NOTIFICATION_PRIORITIES.LOW,
    metadata: { 
      jobSearchEmail: email
    },
    actionUrl: '/client/dashboard',
    actionText: 'View Dashboard'
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
  }),

  // =====================================================
  // CONCIERGE MODEL NOTIFICATION HELPERS
  // =====================================================

  // Concierge consultation notifications
  newConsultationRequestConcierge: (consultationData) => createAdminNotification({
    type: NOTIFICATION_TYPES.CONSULTATION_SUBMITTED,
    title: 'New Consultation Request (Concierge)',
    message: `${consultationData.full_name} submitted a consultation request with 3 time slots. Gatekeeper action required.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      consultationId: consultationData.id,
      clientName: consultationData.full_name,
      clientEmail: consultationData.email,
      clientPhone: consultationData.phone,
      preferredSlots: consultationData.preferred_slots,
      gatekeeperActions: ['confirm', 'reschedule', 'waitlist']
    },
    actionUrl: `/admin/concierge/consultations/${consultationData.id}`,
    actionText: 'Take Action'
  }),

  consultationConfirmedByAdmin: (consultationData, adminUser) => createNotification({
    userId: consultationData.user_id || consultationData.client_id,
    type: NOTIFICATION_TYPES.CONSULTATION_CONFIRMED_BY_ADMIN,
    title: 'Consultation Confirmed! 🎉',
    message: `Your consultation has been confirmed by ${adminUser.full_name}. Check your email for details.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      consultationId: consultationData.id,
      confirmedTime: consultationData.confirmed_time,
      confirmedBy: adminUser.full_name,
      adminId: adminUser.id
    },
    actionUrl: '/dashboard/consultations',
    actionText: 'View Details'
  }),

  consultationRescheduledByAdmin: (consultationData, adminUser) => createNotification({
    userId: consultationData.user_id || consultationData.client_id,
    type: NOTIFICATION_TYPES.CONSULTATION_RESCHEDULED_BY_ADMIN,
    title: 'Consultation Reschedule Requested',
    message: `${adminUser.full_name} has requested to reschedule your consultation. Please provide new availability.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      consultationId: consultationData.id,
      rescheduleReason: consultationData.reschedule_reason,
      rescheduledBy: adminUser.full_name,
      adminId: adminUser.id
    },
    actionUrl: `/consultation/new-times/${consultationData.id}`,
    actionText: 'Provide New Times'
  }),

  consultationWaitlistedByAdmin: (consultationData, adminUser) => createNotification({
    userId: consultationData.user_id || consultationData.client_id,
    type: NOTIFICATION_TYPES.CONSULTATION_WAITLISTED_BY_ADMIN,
    title: 'Consultation Added to Waitlist',
    message: `Your consultation has been added to our waitlist. We'll contact you when availability opens up.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.LOW,
    metadata: { 
      consultationId: consultationData.id,
      waitlistReason: consultationData.waitlist_reason,
      waitlistedBy: adminUser.full_name,
      adminId: adminUser.id
    },
    actionUrl: '/dashboard/consultations',
    actionText: 'View Status'
  }),

  // Payment and registration notifications
  paymentConfirmedAndInviteSent: (paymentData) => createAdminNotification({
    type: NOTIFICATION_TYPES.PAYMENT_CONFIRMED_INVITE_SENT,
    title: 'Payment Confirmed & Invite Sent',
    message: `Payment confirmed for ${paymentData.client_name} ($${paymentData.payment_amount}). Registration invite sent.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      clientEmail: paymentData.client_email,
      clientName: paymentData.client_name,
      paymentAmount: paymentData.payment_amount,
      confirmedBy: paymentData.admin_user.full_name,
      adminId: paymentData.admin_user.id
    },
    actionUrl: '/admin/concierge/payments',
    actionText: 'View Payments'
  }),

  // Onboarding notifications (Concierge Model)
  onboardingCompletedNeedsApproval: (userId, onboardingData) => createAdminNotification({
    type: NOTIFICATION_TYPES.ONBOARDING_COMPLETED_NEEDS_APPROVAL,
    title: 'Onboarding Completed - Approval Required',
    message: `Client completed 20-question onboarding. Admin approval required to unlock Application Tracker.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      onboardingId: onboardingData.id,
      userId: userId,
      executionStatus: onboardingData.execution_status,
      targetRoles: onboardingData.target_job_titles,
      jobSearchTimeline: onboardingData.job_search_timeline
    },
    actionUrl: `/admin/concierge/onboarding/${onboardingData.id}/approve`,
    actionText: 'Review & Approve'
  }),

  profileUnlockedByAdmin: (profileData) => createNotification({
    userId: profileData.client.id,
    type: NOTIFICATION_TYPES.PROFILE_UNLOCKED_BY_ADMIN,
    title: 'Profile Unlocked - Tracker Active! 🚀',
    message: `Your profile has been approved by ${profileData.admin_user.full_name}. Your Application Tracker is now active!`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      approvedBy: profileData.admin_user.full_name,
      adminId: profileData.admin_user.id,
      profileUnlocked: true,
      trackerActive: true
    },
    actionUrl: '/dashboard/applications',
    actionText: 'Access Tracker'
  }),

  // Enhanced application notifications (Concierge Model)
  interviewRequestReceived: (userId, applicationData) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.INTERVIEW_REQUEST_RECEIVED,
    title: 'Interview Request Received! 🎉',
    message: `Great news! An interview request has been received for your application to ${applicationData.company_name}.`,
    category: NOTIFICATION_CATEGORIES.APPLICATION,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      applicationId: applicationData.id,
      companyName: applicationData.company_name,
      jobTitle: applicationData.job_title,
      interviewDate: applicationData.interview_date,
      automaticNotification: true
    },
    actionUrl: '/dashboard/applications',
    actionText: 'View Application'
  }),

  applicationStatusUpdated: (userId, applicationData, oldStatus, newStatus) => createNotification({
    userId,
    type: NOTIFICATION_TYPES.APPLICATION_STATUS_CHANGED,
    title: 'Application Status Updated',
    message: `Your application to ${applicationData.company_name} status changed from "${oldStatus}" to "${newStatus}".`,
    category: NOTIFICATION_CATEGORIES.APPLICATION,
    priority: newStatus === 'interview' ? NOTIFICATION_PRIORITIES.HIGH : NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      applicationId: applicationData.id,
      companyName: applicationData.company_name,
      jobTitle: applicationData.job_title,
      oldStatus,
      newStatus,
      weekNumber: applicationData.week_number
    },
    actionUrl: '/dashboard/applications',
    actionText: 'View Details'
  }),

  // =====================================================
  // NEW WORKFLOW FEATURES NOTIFICATION HELPERS
  // =====================================================

  // Onboarding completion notifications
  onboardingCompletedForReview: (userData) => createAdminNotification({
    type: 'onboarding_completed_review',
    title: 'Onboarding Completed - Review Required',
    message: `${userData.full_name} completed their 20-field onboarding questionnaire. Profile unlock approval needed.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      userId: userData.id,
      clientName: userData.full_name,
      clientEmail: userData.email,
      onboardingCompleted: true,
      profileUnlocked: userData.profile_unlocked,
      targetRoles: userData.onboarding_target_roles,
      targetSalary: userData.onboarding_target_salary,
      careerTimeline: userData.onboarding_career_timeline
    },
    actionUrl: `/admin/clients/${userData.id}`,
    actionText: 'Review Profile'
  }),

  // Profile unlock notifications
  profileUnlocked: (clientId, adminUser) => createNotification({
    userId: clientId,
    type: 'profile_unlocked',
    title: 'Profile Unlocked! 🚀',
    message: `Your profile has been reviewed and approved by ${adminUser.full_name}. You now have full access to the Application Tracker!`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      approvedBy: adminUser.full_name,
      adminId: adminUser.id,
      profileUnlocked: true,
      fullAccess: true,
      unlockDate: new Date().toISOString()
    },
    actionUrl: '/client/dashboard',
    actionText: 'Access Dashboard'
  }),

  // Payment verification notifications
  paymentVerified: (consultationData, adminUser) => createNotification({
    userId: consultationData.user_id,
    type: 'payment_verified',
    title: 'Payment Verified! 💳',
    message: `Your payment has been verified by ${adminUser.full_name}. Check your email for registration instructions.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    metadata: { 
      consultationId: consultationData.id,
      paymentAmount: consultationData.payment_amount,
      paymentMethod: consultationData.payment_method,
      packageTier: consultationData.package_tier,
      verifiedBy: adminUser.full_name,
      adminId: adminUser.id,
      registrationTokenGenerated: true
    },
    actionUrl: '/register',
    actionText: 'Complete Registration'
  }),

  // Weekly application notifications
  weeklyApplicationSummary: (userId, weeklyData) => createNotification({
    userId,
    type: 'weekly_application_summary',
    title: 'Weekly Application Summary 📊',
    message: `This week: ${weeklyData.totalApplications} applications submitted. ${weeklyData.interviews} interviews scheduled.`,
    category: NOTIFICATION_CATEGORIES.APPLICATION,
    priority: NOTIFICATION_PRIORITIES.LOW,
    metadata: { 
      weekStart: weeklyData.weekStart,
      totalApplications: weeklyData.totalApplications,
      interviews: weeklyData.interviews,
      offers: weeklyData.offers,
      rejections: weeklyData.rejections,
      conciergeNote: weeklyData.conciergeNote
    },
    actionUrl: '/client/applications/weekly',
    actionText: 'View Weekly Report'
  }),

  // Concierge note notifications
  conciergeNoteAdded: (userId, weekData, adminUser) => createNotification({
    userId,
    type: 'concierge_note_added',
    title: 'New Note from Your Concierge 💬',
    message: `${adminUser.full_name} added a note about your applications for the week of ${weekData.weekLabel}.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      weekStart: weekData.weekStart,
      weekLabel: weekData.weekLabel,
      conciergeNote: weekData.conciergeNote,
      adminName: adminUser.full_name,
      adminId: adminUser.id,
      applicationsCount: weekData.applicationsCount
    },
    actionUrl: '/client/applications/weekly',
    actionText: 'View Note'
  }),

  // Discovery Mode notifications
  discoveryModeUnlocked: (userId, userData) => createNotification({
    userId,
    type: 'discovery_mode_unlocked',
    title: 'Discovery Mode Unlocked! 🔍',
    message: 'You now have access to Discovery Mode features. Explore your personalized career insights.',
    category: NOTIFICATION_CATEGORIES.SYSTEM,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      onboardingCompleted: userData.onboarding_completed,
      profileUnlocked: userData.profile_unlocked,
      discoveryModeActive: true,
      features: ['weekly_analytics', 'career_insights', 'application_tracker']
    },
    actionUrl: '/client/discovery',
    actionText: 'Explore Discovery Mode'
  }),

  // Admin workflow notifications
  newClientRegistration: (clientData, consultationData) => createAdminNotification({
    type: 'new_client_registration',
    title: 'New Client Registration',
    message: `${clientData.full_name} completed registration for ${consultationData.package_tier}. Onboarding pending.`,
    category: NOTIFICATION_CATEGORIES.CONCIERGE,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    metadata: { 
      clientId: clientData.id,
      clientName: clientData.full_name,
      clientEmail: clientData.email,
      packageTier: consultationData.package_tier,
      consultationId: consultationData.id,
      registrationDate: clientData.created_at,
      onboardingStatus: 'pending'
    },
    actionUrl: `/admin/clients/${clientData.id}`,
    actionText: 'View Client'
  }),

  // Status flow notifications
  consultationStatusChanged: (consultationData, oldStatus, newStatus, adminUser) => {
    const statusMessages = {
      'lead': 'New consultation request received',
      'under_review': 'Consultation request is under review',
      'approved': 'Consultation request approved',
      'payment_verified': 'Payment verified and registration token sent',
      'scheduled': 'Consultation meeting scheduled',
      'client': 'Client account fully activated'
    };

    return createNotification({
      userId: consultationData.user_id,
      type: 'consultation_status_changed',
      title: 'Consultation Status Update',
      message: statusMessages[newStatus] || `Status changed to ${newStatus}`,
      category: NOTIFICATION_CATEGORIES.CONSULTATION,
      priority: ['payment_verified', 'scheduled', 'client'].includes(newStatus) 
        ? NOTIFICATION_PRIORITIES.HIGH 
        : NOTIFICATION_PRIORITIES.MEDIUM,
      metadata: { 
        consultationId: consultationData.id,
        oldStatus,
        newStatus,
        updatedBy: adminUser?.full_name,
        adminId: adminUser?.id,
        statusFlow: 'lead → under_review → approved → payment_verified → scheduled → client'
      },
      actionUrl: '/dashboard/consultations',
      actionText: 'View Details'
    });
  }
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