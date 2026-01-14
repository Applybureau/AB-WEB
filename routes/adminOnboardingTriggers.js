const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail, buildUrl } = require('../utils/email');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/admin/onboarding-triggers/:id/send-confirmation - Send onboarding confirmation email (ADMIN TRIGGER)
router.post('/:id/send-confirmation', async (req, res) => {
  try {
    const { id } = req.params;
    const { custom_message } = req.body;

    // Get onboarding record with client details
    const { data: onboarding, error: fetchError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select(`
        *,
        registered_users!inner(id, email, full_name)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !onboarding) {
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    // Check if onboarding is approved
    if (onboarding.execution_status !== 'active') {
      return res.status(400).json({ 
        error: 'Onboarding must be approved before sending confirmation email' 
      });
    }

    // Send onboarding confirmation email to client
    try {
      await sendEmail(onboarding.registered_users.email, 'onboarding_complete_confirmation', {
        client_name: onboarding.registered_users.full_name,
        admin_name: req.user.full_name || 'Apply Bureau Team',
        custom_message: custom_message || null,
        dashboard_url: buildUrl('/dashboard'),
        application_tracker_url: buildUrl('/dashboard/applications'),
        next_steps: 'You can expect activity to begin within 3 business days. No action is required on your end. Updates will appear in your dashboard.',
        expectation_timeline: '3 business days',
        support_message: 'Our team is preparing your application setup.'
      });
    } catch (emailError) {
      console.error('Failed to send onboarding confirmation email:', emailError);
      return res.status(500).json({ error: 'Failed to send confirmation email' });
    }

    // Update onboarding record to track confirmation email sent
    const { error: updateError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .update({
        confirmation_email_sent: true,
        confirmation_email_sent_by: req.user.id,
        confirmation_email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating onboarding confirmation status:', updateError);
    }

    // Create notification for tracking
    try {
      await NotificationHelpers.onboardingConfirmationEmailSent({
        client: onboarding.registered_users,
        admin_user: req.user,
        onboarding_id: id
      });
    } catch (notificationError) {
      console.error('Failed to create confirmation notification:', notificationError);
    }

    res.json({
      message: 'Onboarding confirmation email sent successfully',
      client_name: onboarding.registered_users.full_name,
      client_email: onboarding.registered_users.email,
      sent_by: req.user.full_name || 'Admin',
      sent_at: new Date().toISOString(),
      email_type: 'onboarding_complete_confirmation'
    });
  } catch (error) {
    console.error('Send onboarding confirmation error:', error);
    res.status(500).json({ error: 'Failed to send onboarding confirmation' });
  }
});

// GET /api/admin/onboarding-triggers - List onboarding records ready for confirmation (ADMIN)
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'active',
      confirmation_sent = 'all',
      limit = 50,
      offset = 0 
    } = req.query;

    let query = supabaseAdmin
      .from('client_onboarding_20q')
      .select(`
        id,
        execution_status,
        completed_at,
        approved_at,
        confirmation_email_sent,
        confirmation_email_sent_at,
        registered_users!inner(id, email, full_name)
      `)
      .order('approved_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('execution_status', status);
    }

    if (confirmation_sent === 'sent') {
      query = query.eq('confirmation_email_sent', true);
    } else if (confirmation_sent === 'not_sent') {
      query = query.or('confirmation_email_sent.is.null,confirmation_email_sent.eq.false');
    }

    const { data: onboardingRecords, error } = await query;

    if (error) {
      console.error('Error fetching onboarding records:', error);
      return res.status(500).json({ error: 'Failed to fetch onboarding records' });
    }

    const formattedRecords = onboardingRecords.map(record => ({
      id: record.id,
      client_name: record.registered_users.full_name,
      client_email: record.registered_users.email,
      execution_status: record.execution_status,
      completed_at: record.completed_at,
      approved_at: record.approved_at,
      confirmation_email_sent: record.confirmation_email_sent || false,
      confirmation_email_sent_at: record.confirmation_email_sent_at,
      can_send_confirmation: record.execution_status === 'active' && !record.confirmation_email_sent,
      days_since_approval: record.approved_at ? 
        Math.floor((new Date() - new Date(record.approved_at)) / (1000 * 60 * 60 * 24)) : null
    }));

    res.json({
      onboarding_records: formattedRecords,
      total: onboardingRecords.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
      filters: {
        status,
        confirmation_sent
      }
    });
  } catch (error) {
    console.error('Onboarding triggers list error:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding records' });
  }
});

// POST /api/admin/onboarding-triggers/bulk-send-confirmations - Send confirmation emails to multiple clients (ADMIN)
router.post('/bulk-send-confirmations', async (req, res) => {
  try {
    const { onboarding_ids, custom_message } = req.body;

    if (!onboarding_ids || !Array.isArray(onboarding_ids) || onboarding_ids.length === 0) {
      return res.status(400).json({ error: 'onboarding_ids array is required' });
    }

    if (onboarding_ids.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 onboarding records can be processed at once' });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const onboardingId of onboarding_ids) {
      try {
        // Get onboarding record
        const { data: onboarding, error: fetchError } = await supabaseAdmin
          .from('client_onboarding_20q')
          .select(`
            *,
            registered_users!inner(id, email, full_name)
          `)
          .eq('id', onboardingId)
          .single();

        if (fetchError || !onboarding) {
          results.push({
            onboarding_id: onboardingId,
            success: false,
            error: 'Onboarding record not found'
          });
          failureCount++;
          continue;
        }

        if (onboarding.execution_status !== 'active') {
          results.push({
            onboarding_id: onboardingId,
            success: false,
            error: 'Onboarding not approved'
          });
          failureCount++;
          continue;
        }

        if (onboarding.confirmation_email_sent) {
          results.push({
            onboarding_id: onboardingId,
            success: false,
            error: 'Confirmation email already sent'
          });
          failureCount++;
          continue;
        }

        // Send email
        await sendEmail(onboarding.registered_users.email, 'onboarding_complete_confirmation', {
          client_name: onboarding.registered_users.full_name,
          admin_name: req.user.full_name || 'Apply Bureau Team',
          custom_message: custom_message || null,
          dashboard_url: buildUrl('/dashboard'),
          application_tracker_url: buildUrl('/dashboard/applications'),
          next_steps: 'You can expect activity to begin within 3 business days. No action is required on your end. Updates will appear in your dashboard.',
          expectation_timeline: '3 business days',
          support_message: 'Our team is preparing your application setup.'
        });

        // Update record
        await supabaseAdmin
          .from('client_onboarding_20q')
          .update({
            confirmation_email_sent: true,
            confirmation_email_sent_by: req.user.id,
            confirmation_email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', onboardingId);

        results.push({
          onboarding_id: onboardingId,
          client_name: onboarding.registered_users.full_name,
          client_email: onboarding.registered_users.email,
          success: true
        });
        successCount++;

      } catch (error) {
        console.error(`Error processing onboarding ${onboardingId}:`, error);
        results.push({
          onboarding_id: onboardingId,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    res.json({
      message: `Bulk confirmation emails processed: ${successCount} sent, ${failureCount} failed`,
      total_processed: onboarding_ids.length,
      success_count: successCount,
      failure_count: failureCount,
      results: results,
      sent_by: req.user.full_name || 'Admin',
      sent_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bulk send confirmations error:', error);
    res.status(500).json({ error: 'Failed to send bulk confirmation emails' });
  }
});

module.exports = router;