const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { validate, schemas } = require('../utils/validation');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/public/consultation-booking - Handle consultation booking from website
router.post('/consultation-booking', validate(schemas.consultationBooking), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      reason, 
      preferred_date, 
      preferred_time,
      package_interest,
      current_situation,
      timeline 
    } = req.body;

    logger.info('New consultation booking from website', { email, name, package_interest });

    // Create consultation record as "scheduled" (pending admin confirmation)
    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert({
        client_id: null, // No client yet - this is pre-onboarding
        admin_id: null, // Will be assigned by admin
        scheduled_at: new Date(`${preferred_date}T${preferred_time}`).toISOString(),
        consultation_type: 'initial',
        status: 'scheduled',
        client_reason: reason,
        admin_notes: `Website booking - Package interest: ${package_interest}, Timeline: ${timeline}, Situation: ${current_situation}`,
        // Store prospect info in admin notes until client is created
        prospect_name: name,
        prospect_email: email,
        prospect_phone: phone
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating consultation booking', error, { email, name });
      return res.status(500).json({ error: 'Failed to book consultation' });
    }

    // Send confirmation email to prospect
    await sendEmail(email, 'consultation_scheduled', {
      client_name: name,
      consultation_date: new Date(consultation.scheduled_at).toLocaleDateString(),
      consultation_time: new Date(consultation.scheduled_at).toLocaleTimeString(),
      consultation_type: 'Free Initial Consultation',
      calendly_url: process.env.CALENDLY_URL || 'https://calendly.com/raewealth1/30min',
      package_interest: package_interest
    });

    // Send notification to admin about new booking
    // Get first available admin
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, full_name')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (admin) {
      await sendEmail(admin.email, 'new_consultation_booking', {
        admin_name: admin.full_name,
        prospect_name: name,
        prospect_email: email,
        consultation_date: new Date(consultation.scheduled_at).toLocaleDateString(),
        consultation_time: new Date(consultation.scheduled_at).toLocaleTimeString(),
        package_interest: package_interest,
        reason: reason,
        timeline: timeline
      });
    }

    // Create Google Meet link for the consultation
    const googleMeetManager = require('../utils/googleMeet');
    try {
      const meetingData = await googleMeetManager.createMeetingForConsultation(consultation, admin?.email);
      
      // Update consultation with meeting data
      await googleMeetManager.updateConsultationWithMeeting(consultation.id, meetingData);
      
      // Send meeting link notifications
      await googleMeetManager.sendMeetingLinkToParticipants({
        ...consultation,
        google_meet_link: meetingData.google_meet_link
      });
      
      logger.info('Google Meet link created and sent', {
        consultationId: consultation.id,
        meetingLink: meetingData.google_meet_link
      });
    } catch (meetingError) {
      logger.warn('Failed to create Google Meet link', meetingError);
      // Continue without meeting link - not critical for booking
    }

    logger.info('Consultation booking created successfully', {
      consultationId: consultation.id,
      prospectEmail: email,
      prospectName: name
    });

    res.status(201).json({
      message: 'Consultation booked successfully',
      consultation_id: consultation.id,
      next_steps: 'You will receive a confirmation email shortly. We will contact you to confirm the details.'
    });
  } catch (error) {
    logger.error('Consultation booking error', error, { body: req.body });
    res.status(500).json({ error: 'Failed to book consultation' });
  }
});

// GET /api/public/packages - Get available service packages
router.get('/packages', async (req, res) => {
  try {
    // Get packages from system settings or return default packages
    const { data: packagesSettings } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'service_packages')
      .single();

    let packages;
    if (packagesSettings) {
      packages = JSON.parse(packagesSettings.setting_value);
    } else {
      // Default packages based on your client's requirements
      packages = [
        {
          id: 'essential',
          name: 'Essential Package',
          description: 'Perfect for focused job search with professional guidance',
          features: [
            '5 targeted job applications per month',
            'Resume optimization',
            'Monthly strategy consultation',
            'Application tracking and updates',
            'Email support'
          ],
          duration: '1 month',
          cta: 'Start the process'
        },
        {
          id: 'professional',
          name: 'Professional Package',
          description: 'Comprehensive support for serious career advancement',
          features: [
            '10 targeted job applications per month',
            'Resume and LinkedIn optimization',
            'Bi-weekly strategy consultations',
            'Interview preparation sessions',
            'Salary negotiation guidance',
            'Priority email and phone support'
          ],
          duration: '2 months',
          popular: true,
          cta: 'Start the process'
        },
        {
          id: 'executive',
          name: 'Executive Package',
          description: 'Premium service for senior-level career transitions',
          features: [
            '15 targeted job applications per month',
            'Complete personal branding overhaul',
            'Weekly one-on-one consultations',
            'Executive interview coaching',
            'Offer negotiation and career strategy',
            'Direct phone line access',
            'Network introduction facilitation'
          ],
          duration: '3 months',
          cta: 'Start the process'
        }
      ];
    }

    res.json({ packages });
  } catch (error) {
    logger.error('Error fetching packages', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// GET /api/public/consultation-slots - Get available consultation time slots
router.get('/consultation-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    // This would integrate with your calendar system
    // For now, return sample available slots
    const availableSlots = [
      '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
    ];

    res.json({ 
      date,
      available_slots: availableSlots,
      timezone: 'EST',
      note: 'All consultations are conducted via video call and typically last 30 minutes'
    });
  } catch (error) {
    logger.error('Error fetching consultation slots', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

module.exports = router;