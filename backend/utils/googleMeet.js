const { google } = require('googleapis');
const logger = require('./logger');

class GoogleMeetManager {
  constructor() {
    this.calendar = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize Google Calendar API
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY, // Path to service account key
        scopes: ['https://www.googleapis.com/auth/calendar']
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      this.initialized = true;
      logger.info('Google Meet integration initialized');
    } catch (error) {
      logger.warn('Google Meet integration not available', error.message);
      // Continue without Google Meet integration
    }
  }

  async createMeetingForConsultation(consultation, adminEmail = 'israelloko65@gmail.com') {
    if (!this.initialized) {
      // Return a generic meeting link if Google integration is not available
      return this.createGenericMeetingLink(consultation);
    }

    try {
      const startTime = new Date(consultation.scheduled_at);
      const endTime = new Date(startTime.getTime() + (consultation.duration_minutes || 60) * 60000);

      const event = {
        summary: `Apply Bureau Consultation - ${consultation.prospect_name || 'Client'}`,
        description: `
Career consultation session.

Consultation Details:
- Type: ${consultation.consultation_type || 'Initial Consultation'}
- Duration: ${consultation.duration_minutes || 60} minutes
- Reason: ${consultation.client_reason || 'Career guidance'}

Admin Notes: ${consultation.admin_notes || 'N/A'}

This meeting was automatically created by Apply Bureau.
        `.trim(),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Toronto' // Adjust based on your timezone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Toronto'
        },
        attendees: [
          { email: adminEmail },
          { email: consultation.prospect_email || consultation.client?.email }
        ].filter(attendee => attendee.email),
        conferenceData: {
          createRequest: {
            requestId: `consultation-${consultation.id}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'email', minutes: 60 },      // 1 hour before
            { method: 'popup', minutes: 15 }       // 15 minutes before
          ]
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all' // Send invites to all attendees
      });

      const meetingLink = response.data.conferenceData?.entryPoints?.find(
        entry => entry.entryPointType === 'video'
      )?.uri;

      logger.info('Google Meet created for consultation', {
        consultationId: consultation.id,
        eventId: response.data.id,
        meetingLink
      });

      return {
        google_meet_link: meetingLink,
        google_meet_id: response.data.id,
        calendar_event_id: response.data.id,
        meeting_created_at: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to create Google Meet', error);
      // Fallback to generic meeting link
      return this.createGenericMeetingLink(consultation);
    }
  }

  createGenericMeetingLink(consultation) {
    // Create a generic meeting room link (you can use Zoom, Teams, or any other service)
    const meetingId = `consultation-${consultation.id.substring(0, 8)}`;
    
    return {
      google_meet_link: `https://meet.google.com/${meetingId}`, // Generic link format
      google_meet_id: meetingId,
      calendar_event_id: null,
      meeting_created_at: new Date().toISOString(),
      note: 'Generic meeting link - Google Calendar integration not configured'
    };
  }

  async updateConsultationWithMeeting(consultationId, meetingData) {
    try {
      const { supabaseAdmin } = require('./supabase');
      
      const { error } = await supabaseAdmin
        .from('consultations')
        .update({
          google_meet_link: meetingData.google_meet_link,
          google_meet_id: meetingData.google_meet_id,
          meeting_created_at: meetingData.meeting_created_at
        })
        .eq('id', consultationId);

      if (error) {
        logger.error('Failed to update consultation with meeting data', error);
        return false;
      }

      logger.info('Consultation updated with meeting data', { consultationId });
      return true;
    } catch (error) {
      logger.error('Failed to update consultation with meeting data', error);
      return false;
    }
  }

  async sendMeetingLinkToParticipants(consultation) {
    try {
      const { sendEmail } = require('./email');
      
      // Send to prospect/client
      const recipientEmail = consultation.prospect_email || consultation.client?.email;
      if (recipientEmail) {
        await sendEmail(recipientEmail, 'meeting_link_notification', {
          client_name: consultation.prospect_name || consultation.client?.full_name,
          consultation_date: new Date(consultation.scheduled_at).toLocaleDateString(),
          consultation_time: new Date(consultation.scheduled_at).toLocaleTimeString(),
          meeting_link: consultation.google_meet_link,
          consultation_type: consultation.consultation_type || 'Initial Consultation'
        });
      }

      // Send to admin
      const { data: admin } = await require('./supabase').supabaseAdmin
        .from('admins')
        .select('email, full_name')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (admin) {
        await sendEmail(admin.email, 'admin_meeting_link_notification', {
          admin_name: admin.full_name,
          client_name: consultation.prospect_name || consultation.client?.full_name,
          consultation_date: new Date(consultation.scheduled_at).toLocaleDateString(),
          consultation_time: new Date(consultation.scheduled_at).toLocaleTimeString(),
          meeting_link: consultation.google_meet_link,
          consultation_id: consultation.id
        });
      }

      logger.info('Meeting link notifications sent', { consultationId: consultation.id });
      return true;
    } catch (error) {
      logger.error('Failed to send meeting link notifications', error);
      return false;
    }
  }

  async cancelMeeting(googleMeetId) {
    if (!this.initialized || !googleMeetId) {
      return true; // Nothing to cancel
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: googleMeetId,
        sendUpdates: 'all'
      });

      logger.info('Google Meet cancelled', { googleMeetId });
      return true;
    } catch (error) {
      logger.error('Failed to cancel Google Meet', error);
      return false;
    }
  }
}

const googleMeetManager = new GoogleMeetManager();

// Initialize on startup
googleMeetManager.initialize();

module.exports = googleMeetManager;