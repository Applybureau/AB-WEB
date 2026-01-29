const { supabaseAdmin } = require('./supabase');
const { sendEmail } = require('./email');
const logger = require('./logger');

class ApplyBureauHelpers {
  /**
   * Complete Apply Bureau workflow: Create client invitation after consultation
   * This implements the core "human decision point" from the project overview
   */
  static async createClientFromConsultation(consultationData) {
    try {
      const { 
        prospect_name, 
        prospect_email, 
        consultation_notes, 
        admin_id, 
        onboarding_decision = true,
        onboarding_reason 
      } = consultationData;

      if (!onboarding_decision) {
        logger.info('Consultation completed - client not approved for onboarding', {
          prospectEmail: prospect_email,
          adminId: admin_id,
          reason: onboarding_reason
        });
        return { success: false, reason: 'Client not approved for onboarding' };
      }

      // Use database function to create client invitation
      const { data: inviteResult, error: inviteError } = await supabaseAdmin
        .rpc('create_client_invitation', {
          p_full_name: prospect_name,
          p_email: prospect_email,
          p_admin_id: admin_id
        });

      if (inviteError) {
        throw inviteError;
      }

      const { client_id, invite_token, temp_password } = inviteResult[0];

      // Create consultation record
      await supabaseAdmin
        .from('consultations')
        .insert({
          client_id,
          admin_id,
          scheduled_at: new Date().toISOString(),
          status: 'completed',
          client_reason: 'Initial consultation',
          admin_notes: consultation_notes,
          onboarding_decision: true,
          onboarding_reason
        });

      // Send invitation email
      const inviteLink = `${process.env.FRONTEND_URL}/complete-registration?token=${invite_token}`;
      
      await sendEmail(prospect_email, 'signup_invite', {
        client_name: prospect_name,
        registration_link: inviteLink,
        temp_password: temp_password
      });

      logger.info('Client created from consultation successfully', {
        clientId: client_id,
        prospectEmail: prospect_email,
        adminId: admin_id
      });

      return {
        success: true,
        client_id,
        invite_token,
        invite_link: inviteLink
      };
    } catch (error) {
      logger.error('Error creating client from consultation', error, consultationData);
      throw error;
    }
  }

  /**
   * Get client onboarding status and requirements
   */
  static async getClientOnboardingStatus(clientId) {
    try {
      const { data: client, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error || !client) {
        throw new Error('Client not found');
      }

      // Check onboarding completion using database function
      const { data: canComplete, error: checkError } = await supabaseAdmin
        .rpc('can_complete_onboarding', { p_client_id: clientId });

      if (checkError) {
        throw checkError;
      }

      // Get required fields from settings
      const { data: settings } = await supabaseAdmin
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'onboarding_required_fields')
        .single();

      const requiredFields = settings ? JSON.parse(settings.setting_value) : [];

      // Check which fields are missing
      const missingFields = [];
      if (requiredFields.includes('resume') && !client.resume_url) {
        missingFields.push('resume');
      }
      if (requiredFields.includes('career_goals') && !client.career_goals) {
        missingFields.push('career_goals');
      }
      if (requiredFields.includes('target_role') && !client.target_role) {
        missingFields.push('target_role');
      }
      if (client.temporary_password) {
        missingFields.push('password_change');
      }

      return {
        client_id: clientId,
        onboarding_complete: client.onboarding_complete,
        can_complete: canComplete,
        missing_fields: missingFields,
        status: client.status,
        progress_percentage: Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100)
      };
    } catch (error) {
      logger.error('Error getting client onboarding status', error, { clientId });
      throw error;
    }
  }

  /**
   * Generate application status update message for client
   */
  static generateStatusUpdateMessage(application, oldStatus, newStatus) {
    const statusMessages = {
      applied: {
        title: 'Application Submitted',
        message: `Your application for ${application.job_title} at ${application.company} has been successfully submitted.`,
        next_steps: 'We\'ll monitor the progress and keep you updated on any developments.'
      },
      under_review: {
        title: 'Application Under Review',
        message: `Great news! ${application.company} is reviewing your application for ${application.job_title}.`,
        next_steps: 'The hiring team is evaluating your qualifications. We\'ll update you as soon as we hear back.'
      },
      interview_scheduled: {
        title: 'Interview Scheduled!',
        message: `Excellent! You have an interview scheduled for ${application.job_title} at ${application.company}.`,
        next_steps: 'Prepare well and showcase your skills. We\'re here to help with interview preparation if needed.'
      },
      interview_completed: {
        title: 'Interview Completed',
        message: `Your interview for ${application.job_title} at ${application.company} has been completed.`,
        next_steps: 'We\'re awaiting feedback from the hiring team. Stay positive!'
      },
      second_round: {
        title: 'Second Round Interview',
        message: `Congratulations! You\'ve been invited to a second round interview for ${application.job_title} at ${application.company}.`,
        next_steps: 'This is a great sign! Prepare for the next stage and continue to impress.'
      },
      offer_received: {
        title: 'Job Offer Received!',
        message: `Congratulations! You\'ve received a job offer for ${application.job_title} at ${application.company}.`,
        next_steps: 'Review the offer details carefully. We\'re here to help with negotiations if needed.'
      },
      offer_accepted: {
        title: 'Offer Accepted - Congratulations!',
        message: `Fantastic! You\'ve accepted the offer for ${application.job_title} at ${application.company}.`,
        next_steps: 'Prepare for your new role. We\'re so proud of your success!'
      },
      offer_declined: {
        title: 'Offer Declined',
        message: `You\'ve declined the offer for ${application.job_title} at ${application.company}.`,
        next_steps: 'No worries! We\'ll continue working on finding the perfect opportunity for you.'
      },
      rejected: {
        title: 'Application Update',
        message: `Unfortunately, ${application.company} has decided not to move forward with your application for ${application.job_title}.`,
        next_steps: 'Don\'t get discouraged! Every rejection brings you closer to the right opportunity. We\'ll keep applying on your behalf.'
      },
      withdrawn: {
        title: 'Application Withdrawn',
        message: `Your application for ${application.job_title} at ${application.company} has been withdrawn.`,
        next_steps: 'We\'ll focus on your other active applications and continue finding new opportunities.'
      },
      closed: {
        title: 'Application Closed',
        message: `The application process for ${application.job_title} at ${application.company} has been closed.`,
        next_steps: 'We\'ll continue working on your other opportunities.'
      }
    };

    return statusMessages[newStatus] || {
      title: 'Application Status Updated',
      message: `Your application status has been updated to: ${newStatus.replace('_', ' ')}`,
      next_steps: 'We\'ll keep you informed of any further developments.'
    };
  }

  /**
   * Get client dashboard insights and recommendations
   */
  static async getClientInsights(clientId) {
    try {
      // Get client applications
      const { data: applications, error } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const insights = {
        application_frequency: this.calculateApplicationFrequency(applications),
        success_rate: this.calculateSuccessRate(applications),
        response_rate: this.calculateResponseRate(applications),
        top_companies: this.getTopCompanies(applications),
        recommendations: this.generateRecommendations(applications)
      };

      return insights;
    } catch (error) {
      logger.error('Error getting client insights', error, { clientId });
      throw error;
    }
  }

  // Helper methods for insights
  static calculateApplicationFrequency(applications) {
    if (applications.length === 0) return 0;
    
    const firstApp = new Date(applications[applications.length - 1].created_at);
    const lastApp = new Date(applications[0].created_at);
    const daysDiff = Math.ceil((lastApp - firstApp) / (1000 * 60 * 60 * 24)) || 1;
    
    return Math.round((applications.length / daysDiff) * 7 * 10) / 10; // Apps per week
  }

  static calculateSuccessRate(applications) {
    if (applications.length === 0) return 0;
    const offers = applications.filter(app => app.status === 'offer_received' || app.status === 'offer_accepted').length;
    return Math.round((offers / applications.length) * 100 * 10) / 10;
  }

  static calculateResponseRate(applications) {
    if (applications.length === 0) return 0;
    const responses = applications.filter(app => 
      ['interview_scheduled', 'interview_completed', 'second_round', 'offer_received', 'rejected'].includes(app.status)
    ).length;
    return Math.round((responses / applications.length) * 100 * 10) / 10;
  }

  static getTopCompanies(applications) {
    const companyCount = {};
    applications.forEach(app => {
      companyCount[app.company] = (companyCount[app.company] || 0) + 1;
    });
    
    return Object.entries(companyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));
  }

  static generateRecommendations(applications) {
    const recommendations = [];
    
    // Application frequency recommendation
    const frequency = this.calculateApplicationFrequency(applications);
    if (frequency < 3) {
      recommendations.push({
        type: 'frequency',
        priority: 'medium',
        title: 'Increase Application Frequency',
        description: 'Consider applying to more positions. Aim for 3-5 applications per week for better results.'
      });
    }

    // Success rate recommendation
    const successRate = this.calculateSuccessRate(applications);
    if (successRate < 5 && applications.length > 10) {
      recommendations.push({
        type: 'success_rate',
        priority: 'high',
        title: 'Improve Application Quality',
        description: 'Your success rate could be improved. Let\'s work on tailoring applications more specifically to each role.'
      });
    }

    // Response rate recommendation
    const responseRate = this.calculateResponseRate(applications);
    if (responseRate < 20 && applications.length > 5) {
      recommendations.push({
        type: 'response_rate',
        priority: 'medium',
        title: 'Optimize Your Profile',
        description: 'Low response rate detected. Consider updating your resume or targeting different types of roles.'
      });
    }

    return recommendations;
  }

  /**
   * Send scheduled reminders (to be called by cron job)
   */
  static async sendScheduledReminders() {
    try {
      // Get upcoming consultations (24 hours before)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const { data: upcomingConsultations, error } = await supabaseAdmin
        .from('consultations')
        .select(`
          *,
          clients(full_name, email),
          admins(full_name)
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_at', tomorrow.toISOString())
        .lt('scheduled_at', dayAfter.toISOString());

      if (error) {
        throw error;
      }

      // Send reminder emails
      for (const consultation of upcomingConsultations || []) {
        await sendEmail(consultation.clients.email, 'consultation_reminder', {
          client_name: consultation.clients.full_name,
          consultation_date: new Date(consultation.scheduled_at).toLocaleDateString(),
          consultation_time: new Date(consultation.scheduled_at).toLocaleTimeString(),
          advisor_name: consultation.admins.full_name,
          meeting_url: consultation.calendly_meeting_url
        });

        logger.info('Consultation reminder sent', {
          consultationId: consultation.id,
          clientEmail: consultation.clients.email
        });
      }

      // Get clients with incomplete onboarding (older than 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: incompleteClients, error: incompleteError } = await supabaseAdmin
        .from('clients')
        .select('id, full_name, email, created_at')
        .eq('onboarding_complete', false)
        .lt('created_at', threeDaysAgo.toISOString());

      if (incompleteError) {
        throw incompleteError;
      }

      // Send onboarding reminders
      for (const client of incompleteClients || []) {
        await sendEmail(client.email, 'onboarding_reminder', {
          client_name: client.full_name,
          dashboard_link: `${process.env.FRONTEND_URL}/dashboard`
        });

        logger.info('Onboarding reminder sent', {
          clientId: client.id,
          clientEmail: client.email
        });
      }

      return {
        consultation_reminders: upcomingConsultations?.length || 0,
        onboarding_reminders: incompleteClients?.length || 0
      };
    } catch (error) {
      logger.error('Error sending scheduled reminders', error);
      throw error;
    }
  }
}

module.exports = ApplyBureauHelpers;