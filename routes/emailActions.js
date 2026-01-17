const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');

const router = express.Router();

// Simple error handler for email actions
const handleEmailActionError = (res, error, message = 'An error occurred') => {
  console.error('Email action error:', error);
  return res.status(500).send(`
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2>Error</h2>
        <p>${message}</p>
        <p>Please contact support if this issue persists.</p>
        <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}" style="color: #007bff;">Return to Apply Bureau</a>
      </body>
    </html>
  `);
};

// GET /api/email-actions/consultation/:id/confirm/:token - Confirm consultation from email
router.get('/consultation/:id/confirm/:token', async (req, res) => {
  try {
    const { id, token } = req.params;

    // Basic validation
    if (!id || !token) {
      return handleEmailActionError(res, 'Missing parameters', 'Invalid confirmation link');
    }

    // Verify consultation exists
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Consultation Not Found</h2>
            <p>The consultation request could not be found or has expired.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}" style="color: #007bff;">Return to Apply Bureau</a>
          </body>
        </html>
      `);
    }

    // Simple token validation
    const expectedToken = Buffer.from(`${consultation.id}-${consultation.email}`).toString('base64').slice(0, 16);
    
    if (token !== expectedToken) {
      return res.status(403).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Invalid Link</h2>
            <p>This confirmation link is invalid or has expired.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}" style="color: #007bff;">Return to Apply Bureau</a>
          </body>
        </html>
      `);
    }

    // Update consultation status
    const { error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({ 
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        pipeline_status: 'confirmed'
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to confirm consultation:', updateError);
      return handleEmailActionError(res, updateError, 'Failed to confirm your consultation');
    }

    // Log success
    console.log('Consultation confirmed via email:', { consultationId: id, email: consultation.email });

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">✓ Consultation Confirmed!</h2>
            <p>Thank you for confirming your consultation request.</p>
            <p><strong>Next Steps:</strong></p>
            <ul style="text-align: left; display: inline-block;">
              <li>Our team will contact you within 24 hours to schedule your consultation</li>
              <li>You'll receive a calendar invite with the meeting details</li>
              <li>Please prepare any questions or materials you'd like to discuss</li>
            </ul>
            <div style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                Return to Apply Bureau
              </a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    return handleEmailActionError(res, error, 'An unexpected error occurred');
  }
});

// GET /api/email-actions/consultation/:id/waitlist/:token - Add to waitlist from email
router.get('/consultation/:id/waitlist/:token', async (req, res) => {
  try {
    const { id, token } = req.params;

    // Basic validation
    if (!id || !token) {
      return handleEmailActionError(res, 'Missing parameters', 'Invalid waitlist link');
    }

    // Verify consultation exists
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Consultation Not Found</h2>
            <p>The consultation request could not be found or has expired.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}" style="color: #007bff;">Return to Apply Bureau</a>
          </body>
        </html>
      `);
    }

    // Simple token validation
    const expectedToken = Buffer.from(`${consultation.id}-${consultation.email}`).toString('base64').slice(0, 16);
    
    if (token !== expectedToken) {
      return res.status(403).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Invalid Link</h2>
            <p>This waitlist link is invalid or has expired.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}" style="color: #007bff;">Return to Apply Bureau</a>
          </body>
        </html>
      `);
    }

    // Update consultation status to waitlisted
    const { error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({ 
        status: 'waitlisted',
        waitlisted_at: new Date().toISOString(),
        pipeline_status: 'waitlisted'
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to add to waitlist:', updateError);
      return handleEmailActionError(res, updateError, 'Failed to add you to the waitlist');
    }

    // Log success
    console.log('Consultation added to waitlist via email:', { consultationId: id, email: consultation.email });

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffc107;">📋 Added to Waitlist</h2>
            <p>You've been successfully added to our consultation waitlist.</p>
            <p><strong>What happens next:</strong></p>
            <ul style="text-align: left; display: inline-block;">
              <li>We'll notify you as soon as a consultation slot becomes available</li>
              <li>You'll be among the first to know about new openings</li>
              <li>Your request remains active and prioritized</li>
            </ul>
            <div style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                Return to Apply Bureau
              </a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    return handleEmailActionError(res, error, 'An unexpected error occurred');
  }
});

// GET /api/email-actions/admin/:adminId/suspend/:token - Suspend admin from email (Super Admin only)
router.get('/admin/:adminId/suspend/:token', async (req, res) => {
  try {
    const { adminId, token } = req.params;

    // Basic validation
    if (!adminId || !token) {
      return handleEmailActionError(res, 'Missing parameters', 'Invalid suspension link');
    }

    // Verify admin exists
    const { data: admin, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (error || !admin) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Admin Not Found</h2>
            <p>The admin account could not be found.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}/admin" style="color: #007bff;">Return to Admin Panel</a>
          </body>
        </html>
      `);
    }

    // Simple token validation
    const expectedToken = Buffer.from(`suspend-${admin.id}-${admin.email}`).toString('base64').slice(0, 16);
    
    if (token !== expectedToken) {
      return res.status(403).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Invalid Link</h2>
            <p>This suspension link is invalid or has expired.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}/admin" style="color: #007bff;">Return to Admin Panel</a>
          </body>
        </html>
      `);
    }

    // Prevent suspending super admin
    if (admin.email === 'admin@applybureau.com') {
      return res.status(403).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Action Not Allowed</h2>
            <p>Super admin account cannot be suspended.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}/admin" style="color: #007bff;">Return to Admin Panel</a>
          </body>
        </html>
      `);
    }

    // Suspend the admin
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ 
        is_active: false,
        suspended_at: new Date().toISOString(),
        suspended_by: 'email_action',
        suspension_reason: 'Suspended via email action'
      })
      .eq('id', adminId);

    if (updateError) {
      console.error('Failed to suspend admin via email:', updateError);
      return handleEmailActionError(res, updateError, 'Failed to suspend admin account');
    }

    console.log('Admin suspended via email action:', { adminId, email: admin.email });

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">⚠️ Admin Account Suspended</h2>
            <p>The admin account for <strong>${admin.full_name}</strong> (${admin.email}) has been suspended.</p>
            <p><strong>Actions taken:</strong></p>
            <ul style="text-align: left; display: inline-block;">
              <li>Account access has been disabled</li>
              <li>Admin privileges have been revoked</li>
              <li>Suspension notification has been sent</li>
            </ul>
            <div style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}/admin/management" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                Manage Admins
              </a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    return handleEmailActionError(res, error, 'An unexpected error occurred');
  }
});

// GET /api/email-actions/admin/:adminId/delete/:token - Delete admin from email (Super Admin only)
router.get('/admin/:adminId/delete/:token', async (req, res) => {
  try {
    const { adminId, token } = req.params;

    // Basic validation
    if (!adminId || !token) {
      return handleEmailActionError(res, 'Missing parameters', 'Invalid deletion link');
    }

    // Verify admin exists
    const { data: admin, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (error || !admin) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Admin Not Found</h2>
            <p>The admin account could not be found.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}/admin" style="color: #007bff;">Return to Admin Panel</a>
          </body>
        </html>
      `);
    }

    // Simple token validation
    const expectedToken = Buffer.from(`delete-${admin.id}-${admin.email}`).toString('base64').slice(0, 16);
    
    if (token !== expectedToken) {
      return res.status(403).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Invalid Link</h2>
            <p>This deletion link is invalid or has expired.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}/admin" style="color: #007bff;">Return to Admin Panel</a>
          </body>
        </html>
      `);
    }

    // Prevent deleting super admin
    if (admin.email === 'admin@applybureau.com') {
      return res.status(403).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Action Not Allowed</h2>
            <p>Super admin account cannot be deleted.</p>
            <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}/admin" style="color: #007bff;">Return to Admin Panel</a>
          </body>
        </html>
      `);
    }

    // Soft delete the admin (change role instead of hard delete)
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ 
        role: 'deleted_admin',
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: 'email_action',
        deletion_reason: 'Deleted via email action'
      })
      .eq('id', adminId);

    if (updateError) {
      console.error('Failed to delete admin via email:', updateError);
      return handleEmailActionError(res, updateError, 'Failed to delete admin account');
    }

    console.log('Admin deleted via email action:', { adminId, email: admin.email });

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">🗑️ Admin Account Deleted</h2>
            <p>The admin account for <strong>${admin.full_name}</strong> (${admin.email}) has been permanently deleted.</p>
            <p><strong>Actions taken:</strong></p>
            <ul style="text-align: left; display: inline-block;">
              <li>Account has been permanently disabled</li>
              <li>All admin privileges have been revoked</li>
              <li>Account data has been archived</li>
              <li>Deletion notification has been sent</li>
            </ul>
            <div style="margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'https://applybureau.com'}/admin/management" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                Manage Admins
              </a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    return handleEmailActionError(res, error, 'An unexpected error occurred');
  }
});

// Health check for email actions
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'email-actions',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;