const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

class WebhookController {
  // POST /api/webhooks/calendly - Handle Calendly webhook for consultation bookings
  static async handleCalendlyWebhook(req, res) {
    try {
      const { event, payload } = req.body;
      
      logger.info('Calendly webhook received', { event, payload });

      if (event === 'invitee.created') {
        const { name, email, questions_and_answers, event_type, scheduled_event } = payload;
        
        // Extract consultation reason from Calendly form
        const consultationReason = questions_and_answers?.find(
          qa => qa.question.toLowerCase().includes('reason') || qa.question.toLowerCase().includes('purpose')
        )?.answer || 'Initial consultation';

        // Check if this is an existing client or new prospect
        const { data: existingClient } = await supabaseAdmin
          .from('clients')
          .select('id, full_name, assigned_advisor_id')
          .eq('email', email)
          .single();

        if (existingClient) {
          // Existing client - create consultation record
          const { data: consultation, error } = await supabaseAdmin
            .from('consultations')
            .insert({
              client_id: existingClient.id,
              admin_id: existingClient.assigned_advisor_id,
              scheduled_at: scheduled_event.start_time,
              calendly_event_id: scheduled_event.uri,
              calendly_meeting_url: scheduled_event.location?.join_url || '',
              status: 'scheduled',
              client_reason: consultationReason,
              consultation_type: 'follow_up'
            })
            .select()
            .single();

          if (!error) {
            logger.info('Consultation created for existing client', {
              clientId: existingClient.id,
              consultationId: consultation.id,
              scheduledAt: scheduled_event.start_time
            });
          }
        } else {
          // New prospect - log for admin review
          logger.info('New prospect consultation booked', {
            name,
            email,
            scheduledAt: scheduled_event.start_time,
            reason: consultationReason
          });

          // Optionally, create a prospect record or send notification to admin
          // This follows the "human decision point" in the project flow
        }

        // Send confirmation email (Calendly handles this, but we can send additional info)
        await sendEmail(email, 'consultation_scheduled', {
          client_name: name,
          consultation_date: new Date(scheduled_event.start_time).toLocaleDateString(),
          consultation_time: new Date(scheduled_event.start_time).toLocaleTimeString(),
          consultation_type: 'Career Advisory Session',
          meeting_url: scheduled_event.location?.join_url || ''
        });
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      logger.error('Calendly webhook error', error, { body: req.body });
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  // POST /api/webhooks/supabase - Handle Supabase database webhooks
  static async handleSupabaseWebhook(req, res) {
    try {
      const { type, table, record, old_record } = req.body;
      
      logger.info('Supabase webhook received', { type, table, recordId: record?.id });

      switch (table) {
        case 'applications':
          if (type === 'UPDATE' && old_record.status !== record.status) {
            // Application status changed - additional processing if needed
            logger.info('Application status changed via webhook', {
              applicationId: record.id,
              oldStatus: old_record.status,
              newStatus: record.status,
              clientId: record.client_id
            });
          }
          break;

        case 'clients':
          if (type === 'UPDATE' && !old_record.onboarding_complete && record.onboarding_complete) {
            // Client completed onboarding - send welcome email
            await sendEmail(record.email, 'onboarding_completion', {
              client_name: record.full_name,
              dashboard_link: `${process.env.FRONTEND_URL}/dashboard`
            });
            
            logger.info('Onboarding completion email sent via webhook', {
              clientId: record.id,
              email: record.email
            });
          }
          break;

        default:
          logger.debug('Unhandled webhook table', { table, type });
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      logger.error('Supabase webhook error', error, { body: req.body });
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  // POST /api/webhooks/email-status - Handle email delivery status webhooks (Resend)
  static async handleEmailStatusWebhook(req, res) {
    try {
      const { type, data } = req.body;
      
      logger.info('Email status webhook received', { type, emailId: data?.email_id });

      switch (type) {
        case 'email.delivered':
          logger.info('Email delivered successfully', {
            emailId: data.email_id,
            to: data.to,
            subject: data.subject
          });
          break;

        case 'email.bounced':
          logger.warn('Email bounced', {
            emailId: data.email_id,
            to: data.to,
            reason: data.bounce_reason
          });
          
          // Update client record if email bounced
          if (data.to) {
            await supabaseAdmin
              .from('clients')
              .update({ email_bounced: true, email_bounce_reason: data.bounce_reason })
              .eq('email', data.to);
          }
          break;

        case 'email.complained':
          logger.warn('Email complaint received', {
            emailId: data.email_id,
            to: data.to
          });
          
          // Mark client as unsubscribed
          if (data.to) {
            await supabaseAdmin
              .from('clients')
              .update({ email_unsubscribed: true })
              .eq('email', data.to);
          }
          break;

        default:
          logger.debug('Unhandled email status', { type });
      }

      res.status(200).json({ message: 'Email status processed successfully' });
    } catch (error) {
      logger.error('Email status webhook error', error, { body: req.body });
      res.status(500).json({ error: 'Failed to process email status' });
    }
  }
}

module.exports = WebhookController;