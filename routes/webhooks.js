const express = require('express');
const WebhookController = require('../controllers/webhookController');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware to verify webhook signatures (implement based on your webhook providers)
const verifyWebhookSignature = (provider) => {
  return (req, res, next) => {
    // For production, implement proper signature verification
    // For now, we'll log and proceed
    logger.info(`${provider} webhook received`, {
      headers: req.headers,
      body: req.body
    });
    next();
  };
};

// Calendly webhook endpoint
router.post('/calendly', verifyWebhookSignature('calendly'), WebhookController.handleCalendlyWebhook);

// Supabase database webhook endpoint
router.post('/supabase', verifyWebhookSignature('supabase'), WebhookController.handleSupabaseWebhook);

// Email status webhook endpoint (Resend)
router.post('/email-status', verifyWebhookSignature('resend'), WebhookController.handleEmailStatusWebhook);

module.exports = router;