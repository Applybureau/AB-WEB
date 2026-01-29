const { supabaseAdmin } = require('./supabase');
const logger = require('./logger');

class NotificationHelpers {
  // Create a notification in the database
  static async createNotification(userId, type, title, message, metadata = {}) {
    try {
      const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          user_type: 'client', // Default to client, can be overridden in metadata
          type,
          title,
          message,
          metadata,
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return notification;
    } catch (error) {
      logger.error('Failed to create notification', error, { userId, type, title });
      throw error;
    }
  }

  // Consultation notifications
  static async consultationConfirmedByAdmin(consultation, admin) {
    return this.createNotification(
      consultation.client_id,
      'consultation_confirmed',
      'Consultation Confirmed',
      `Your consultation has been confirmed by ${admin.full_name}`,
      { consultation_id: consultation.id, admin_id: admin.id }
    );
  }

  static async consultationRescheduledByAdmin(consultation, admin) {
    return this.createNotification(
      consultation.client_id,
      'consultation_rescheduled',
      'Consultation Rescheduled',
      `Your consultation has been rescheduled by ${admin.full_name}`,
      { consultation_id: consultation.id, admin_id: admin.id }
    );
  }

  static async consultationWaitlistedByAdmin(consultation, admin) {
    return this.createNotification(
      consultation.client_id,
      'consultation_waitlisted',
      'Consultation Waitlisted',
      `Your consultation has been added to the waitlist by ${admin.full_name}`,
      { consultation_id: consultation.id, admin_id: admin.id }
    );
  }

  static async consultationConfirmed(userId, consultation) {
    return this.createNotification(
      userId,
      'consultation_confirmed',
      'Consultation Confirmed',
      'Your consultation request has been confirmed',
      { consultation_id: consultation.id }
    );
  }

  static async newAvailabilityRequested(userId, consultation) {
    return this.createNotification(
      userId,
      'availability_requested',
      'New Availability Requested',
      'Please provide new availability for your consultation',
      { consultation_id: consultation.id }
    );
  }

  static async newConsultationRequestConcierge(consultation) {
    // Notify all admins about new consultation request
    try {
      const { data: admins, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) throw error;

      const notifications = admins.map(admin => 
        this.createNotification(
          admin.id,
          'new_consultation_request',
          'New Consultation Request',
          `New consultation request from ${consultation.name}`,
          { consultation_id: consultation.id }
        )
      );

      await Promise.all(notifications);
    } catch (error) {
      logger.error('Failed to notify admins of new consultation', error);
    }
  }

  // Application notifications
  static async interviewRequestReceived(clientId, application) {
    return this.createNotification(
      clientId,
      'interview_request',
      'Interview Request Received',
      `Interview request received for ${application.job_title} at ${application.company}`,
      { application_id: application.id }
    );
  }

  static async applicationStatusUpdated(clientId, application, oldStatus, newStatus) {
    return this.createNotification(
      clientId,
      'application_status_updated',
      'Application Status Updated',
      `Your application for ${application.job_title} status changed from ${oldStatus} to ${newStatus}`,
      { application_id: application.id, old_status: oldStatus, new_status: newStatus }
    );
  }

  // Onboarding notifications
  static async onboardingConfirmationEmailSent(data) {
    return this.createNotification(
      data.client.id,
      'onboarding_confirmation_sent',
      'Onboarding Confirmation Sent',
      'Your onboarding confirmation email has been sent',
      { admin_id: data.admin_user.id }
    );
  }

  static async clientOnboardingCompleted(userId, onboarding) {
    // Notify admins
    try {
      const { data: admins, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) throw error;

      const notifications = admins.map(admin => 
        this.createNotification(
          admin.id,
          'client_onboarding_completed',
          'Client Onboarding Completed',
          'A client has completed their onboarding',
          { client_id: userId, onboarding_id: onboarding.id }
        )
      );

      await Promise.all(notifications);
    } catch (error) {
      logger.error('Failed to notify admins of completed onboarding', error);
    }
  }

  static async onboardingCompletedForReview(user) {
    // Notify admins for review
    try {
      const { data: admins, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) throw error;

      const notifications = admins.map(admin => 
        this.createNotification(
          admin.id,
          'onboarding_needs_review',
          'Onboarding Needs Review',
          `${user.full_name} has completed onboarding and needs review`,
          { client_id: user.id }
        )
      );

      await Promise.all(notifications);
    } catch (error) {
      logger.error('Failed to notify admins for onboarding review', error);
    }
  }

  static async onboardingCompletedNeedsApproval(userId, onboarding) {
    // Notify admins for approval
    try {
      const { data: admins, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) throw error;

      const notifications = admins.map(admin => 
        this.createNotification(
          admin.id,
          'onboarding_needs_approval',
          'Onboarding Needs Approval',
          'A client has completed their 20-question onboarding and needs approval',
          { client_id: userId, onboarding_id: onboarding.id }
        )
      );

      await Promise.all(notifications);
    } catch (error) {
      logger.error('Failed to notify admins for onboarding approval', error);
    }
  }

  // Profile notifications
  static async profileUnlocked(clientId, admin) {
    return this.createNotification(
      clientId,
      'profile_unlocked',
      'Profile Unlocked',
      `Your profile has been unlocked by ${admin.full_name}`,
      { admin_id: admin.id }
    );
  }

  static async profileUnlockedByAdmin(data) {
    return this.createNotification(
      data.client.id,
      'profile_unlocked',
      'Profile Unlocked',
      `Your profile has been unlocked by ${data.admin_user.full_name}`,
      { admin_id: data.admin_user.id }
    );
  }

  // Payment notifications
  static async paymentConfirmedAndInviteSent(data) {
    return this.createNotification(
      data.client_id,
      'payment_confirmed',
      'Payment Confirmed',
      'Your payment has been confirmed and invitation sent',
      { client_email: data.client_email }
    );
  }

  // File upload notifications
  static async fileUploaded(userId, fileName, fileType) {
    return this.createNotification(
      userId,
      'file_uploaded',
      'File Uploaded',
      `${fileName} has been uploaded successfully`,
      { file_type: fileType }
    );
  }

  // Registration notifications
  static async clientRegistrationComplete(userId, user) {
    return this.createNotification(
      userId,
      'registration_complete',
      'Registration Complete',
      'Your registration has been completed successfully',
      { user_id: userId }
    );
  }

  // Strategy call notifications
  static async newStrategyCallRequest(strategyCall) {
    // Notify admins
    try {
      const { data: admins, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) throw error;

      const notifications = admins.map(admin => 
        this.createNotification(
          admin.id,
          'new_strategy_call_request',
          'New Strategy Call Request',
          `New strategy call request from ${strategyCall.client_name}`,
          { strategy_call_id: strategyCall.id }
        )
      );

      await Promise.all(notifications);
    } catch (error) {
      logger.error('Failed to notify admins of new strategy call', error);
    }
  }

  // Job search notifications
  static async jobSearchEmailProvided(userId, email) {
    return this.createNotification(
      userId,
      'job_search_email_provided',
      'Job Search Email Provided',
      'Your job search email has been recorded',
      { job_search_email: email }
    );
  }

  // Get notifications for a user
  static async getNotifications(userId, limit = 50, offset = 0) {
    try {
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return notifications || [];
    } catch (error) {
      logger.error('Failed to get notifications', error, { userId });
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read', error, { notificationId, userId });
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;
      return notifications || [];
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error, { userId });
      throw error;
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Failed to get unread count', error, { userId });
      throw error;
    }
  }
}

module.exports = { NotificationHelpers };