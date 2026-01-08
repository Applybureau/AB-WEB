const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/contact - Handle contact form submissions (PUBLIC)
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, subject, message' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create contact submission
    const { data: contact, error } = await supabaseAdmin
      .from('contact_submissions')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        subject,
        message,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact submission:', error);
      return res.status(500).json({ error: 'Failed to submit contact form' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(email, 'contact_form_received', {
        client_name: `${firstName} ${lastName}`,
        subject: subject,
        message: message,
        next_steps: 'We will respond to your inquiry within 24 hours.'
      });
    } catch (emailError) {
      console.error('Failed to send contact confirmation email:', emailError);
    }

    // Send notification email to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_contact_submission', {
        client_name: `${firstName} ${lastName}`,
        client_email: email,
        subject: subject,
        message: message,
        phone: phone || 'Not provided'
      });
    } catch (emailError) {
      console.error('Failed to send admin contact notification:', emailError);
    }

    res.status(201).json({
      id: contact.id,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

module.exports = router;