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

// Test webhook endpoint
router.post('/test', (req, res) => {
  try {
    console.log('🔍 Test webhook received:', req.body);
    logger.info('Test webhook received', { body: req.body });
    
    res.json({
      success: true,
      message: 'Test webhook received successfully',
      received_data: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({ 
      error: 'Test webhook failed',
      details: error.message 
    });
  }
});

module.exports = router;