const express = require('express');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const { upload, uploadToSupabase } = require('../utils/upload');
const { generateToken } = require('../utils/auth');

const router = express.Router();

// GET /api/admin-management/admins - Get all admins (PROTECTED)
router.get('/admins', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: admins, error } = await supabaseAdmin
      .from('registered_users')
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        status,
        is_main_admin,
        profile_picture,
        created_at,
        updated_at,
        last_login,
        can_create_admins,
        can_delete_admins,
        can_suspend_admins,
        can_manage_clients,
        can_schedule_consultations,
        can_view_reports,
        can_reset_passwords
      `)
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch admins',
        code: 'DATABASE_ERROR'
      });
    }

    // Format response to match exact specification
    const formattedAdmins = admins?.map(admin => ({
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      status: admin.status || 'active',
      is_main_admin: admin.is_main_admin || false,
      profile_picture: admin.profile_picture,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      last_login: admin.last_login,
      permissions: {
        can_create_admins: admin.can_create_admins || false,
        can_delete_admins: admin.can_delete_admins || false,
        can_suspend_admins: admin.can_suspend_admins || false,
        can_manage_clients: admin.can_manage_clients !== false,
        can_schedule_consultations: admin.can_schedule_consultations !== false,
        can_view_reports: admin.can_view_reports !== false,
        can_reset_passwords: admin.can_reset_passwords || false
      }
    })) || [];

    res.json({
      success: true,
      data: formattedAdmins
    });
  } catch (error) {
    console.error('Fetch admins error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch admins',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/admin-management/admins - Create new admin (PROTECTED)
router.post('/admins', authenticateToken, requireAdmin, upload.single('profile_picture'), async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      role = 'admin'
    } = req.body;

    // Check if current user has permission to create admins
    const { data: currentAdmin } = await supabaseAdmin
      .from('registered_users')
      .select('can_create_admins, is_main_admin')
      .eq('id', req.user.id)
      .single();

    if (!currentAdmin?.can_create_admins && !currentAdmin?.is_main_admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to create admins',
        code: 'PERMISSION_DENIED'
      });
    }

    // Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: full_name, email, password',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return res.status(400).json({ 
        success: false,
        error: 'Admin with this email already exists',
        code: 'DUPLICATE_EMAIL'
      });
    }

    // Handle profile picture upload
    let profilePictureUrl = null;
    if (req.file) {
      try {
        const fileName = `admin_${Date.now()}_${email.replace('@', '_')}.${req.file.originalname.split('.').pop()}`;
        const uploadResult = await uploadToSupabase(req.file, 'profile-pictures', fileName);
        profilePictureUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Profile picture upload error:', uploadError);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to upload profile picture',
          code: 'UPLOAD_ERROR'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin record
    const { data: admin, error } = await supabaseAdmin
      .from('registered_users')
      .insert({
        full_name,
        email,
        password: hashedPassword,
        phone,
        role,
        status: 'active',
        profile_picture: profilePictureUrl,
        created_by: req.user.id,
        can_manage_clients: true,
        can_schedule_consultations: true,
        can_view_reports: true
      })
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        status,
        is_main_admin,
        profile_picture,
        created_at,
        updated_at,
        can_create_admins,
        can_delete_admins,
        can_suspend_admins,
        can_manage_clients,
        can_schedule_consultations,
        can_view_reports,
        can_reset_passwords
      `)
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create admin',
        code: 'DATABASE_ERROR'
      });
    }

    // Send welcome email
    try {
      await sendEmail(email, 'admin_welcome', {
        admin_name: full_name,
        email: email,
        temporary_password: password,
        login_url: process.env.FRONTEND_URL + '/admin/login'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Format response
    const formattedAdmin = {
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
      is_main_admin: admin.is_main_admin || false,
      profile_picture: admin.profile_picture,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      last_login: null,
      permissions: {
        can_create_admins: admin.can_create_admins || false,
        can_delete_admins: admin.can_delete_admins || false,
        can_suspend_admins: admin.can_suspend_admins || false,
        can_manage_clients: admin.can_manage_clients !== false,
        can_schedule_consultations: admin.can_schedule_consultations !== false,
        can_view_reports: admin.can_view_reports !== false,
        can_reset_passwords: admin.can_reset_passwords || false
      }
    };

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: formattedAdmin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create admin',
      code: 'SERVER_ERROR'
    });
  }
});

// PUT /api/admin-management/admins/:id/suspend - Suspend admin (PROTECTED)
router.put('/admins/:id/suspend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check permissions
    const { data: currentAdmin } = await supabaseAdmin
      .from('registered_users')
      .select('can_suspend_admins, is_main_admin')
      .eq('id', req.user.id)
      .single();

    if (!currentAdmin?.can_suspend_admins && !currentAdmin?.is_main_admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to suspend admins',
        code: 'PERMISSION_DENIED'
      });
    }

    // Update admin status
    const { data: admin, error } = await supabaseAdmin
      .from('registered_users')
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_by: req.user.id,
        suspension_reason: reason
      })
      .eq('id', id)
      .eq('role', 'admin')
      .select('full_name, email')
      .single();

    if (error) {
      console.error('Error suspending admin:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to suspend admin',
        code: 'DATABASE_ERROR'
      });
    }

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin not found',
        code: 'NOT_FOUND'
      });
    }

    // Send suspension notification email
    try {
      await sendEmail(admin.email, 'admin_account_suspended', {
        admin_name: admin.full_name,
        reason: reason || 'Administrative action',
        contact_email: 'admin@applybureau.com'
      });
    } catch (emailError) {
      console.error('Failed to send suspension email:', emailError);
    }

    res.json({
      success: true,
      message: 'Admin suspended successfully'
    });
  } catch (error) {
    console.error('Suspend admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to suspend admin',
      code: 'SERVER_ERROR'
    });
  }
});

// PUT /api/admin-management/admins/:id/reactivate - Reactivate admin (PROTECTED)
router.put('/admins/:id/reactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reactivation_notes } = req.body;

    // Check permissions
    const { data: currentAdmin } = await supabaseAdmin
      .from('registered_users')
      .select('can_suspend_admins, is_main_admin')
      .eq('id', req.user.id)
      .single();

    if (!currentAdmin?.can_suspend_admins && !currentAdmin?.is_main_admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to reactivate admins',
        code: 'PERMISSION_DENIED'
      });
    }

    // Update admin status
    const { data: admin, error } = await supabaseAdmin
      .from('registered_users')
      .update({
        status: 'active',
        reactivated_at: new Date().toISOString(),
        reactivated_by: req.user.id,
        reactivation_notes: reactivation_notes,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null
      })
      .eq('id', id)
      .eq('role', 'admin')
      .select('full_name, email')
      .single();

    if (error) {
      console.error('Error reactivating admin:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to reactivate admin',
        code: 'DATABASE_ERROR'
      });
    }

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin not found',
        code: 'NOT_FOUND'
      });
    }

    // Send reactivation notification email
    try {
      await sendEmail(admin.email, 'admin_account_reactivated', {
        admin_name: admin.full_name,
        reactivation_notes: reactivation_notes || 'Your account has been reactivated',
        login_url: process.env.FRONTEND_URL + '/admin/login'
      });
    } catch (emailError) {
      console.error('Failed to send reactivation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Admin reactivated successfully'
    });
  } catch (error) {
    console.error('Reactivate admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reactivate admin',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/admin-management/admins/:id/reset-password - Reset admin password (PROTECTED)
router.post('/admins/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { send_email = true, temporary_password } = req.body;

    // Check permissions
    const { data: currentAdmin } = await supabaseAdmin
      .from('registered_users')
      .select('can_reset_passwords, is_main_admin')
      .eq('id', req.user.id)
      .single();

    if (!currentAdmin?.can_reset_passwords && !currentAdmin?.is_main_admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to reset passwords',
        code: 'PERMISSION_DENIED'
      });
    }

    // Generate temporary password if not provided
    const newPassword = temporary_password || Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update admin password
    const { data: admin, error } = await supabaseAdmin
      .from('registered_users')
      .update({
        password: hashedPassword,
        password_reset_at: new Date().toISOString(),
        password_reset_by: req.user.id,
        must_change_password: true
      })
      .eq('id', id)
      .eq('role', 'admin')
      .select('full_name, email')
      .single();

    if (error) {
      console.error('Error resetting admin password:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to reset admin password',
        code: 'DATABASE_ERROR'
      });
    }

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin not found',
        code: 'NOT_FOUND'
      });
    }

    // Send password reset email
    if (send_email) {
      try {
        await sendEmail(admin.email, 'admin_password_reset', {
          admin_name: admin.full_name,
          temporary_password: newPassword,
          login_url: process.env.FRONTEND_URL + '/admin/login'
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Admin password reset successfully',
      data: {
        temporary_password: send_email ? undefined : newPassword
      }
    });
  } catch (error) {
    console.error('Reset admin password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reset admin password',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE /api/admin-management/admins/:id - Delete admin (PROTECTED)
router.delete('/admins/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation, reason } = req.body;

    // Validate confirmation
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ 
        success: false,
        error: 'Confirmation must be "DELETE"',
        code: 'INVALID_CONFIRMATION'
      });
    }

    // Check permissions
    const { data: currentAdmin } = await supabaseAdmin
      .from('registered_users')
      .select('can_delete_admins, is_main_admin')
      .eq('id', req.user.id)
      .single();

    if (!currentAdmin?.can_delete_admins && !currentAdmin?.is_main_admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to delete admins',
        code: 'PERMISSION_DENIED'
      });
    }

    // Get admin details before deletion
    const { data: admin } = await supabaseAdmin
      .from('registered_users')
      .select('full_name, email, is_main_admin')
      .eq('id', id)
      .eq('role', 'admin')
      .single();

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin not found',
        code: 'NOT_FOUND'
      });
    }

    // Prevent deletion of main admin
    if (admin.is_main_admin) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete main admin',
        code: 'CANNOT_DELETE_MAIN_ADMIN'
      });
    }

    // Delete admin
    const { error } = await supabaseAdmin
      .from('registered_users')
      .delete()
      .eq('id', id)
      .eq('role', 'admin');

    if (error) {
      console.error('Error deleting admin:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete admin',
        code: 'DATABASE_ERROR'
      });
    }

    // Send deletion notification email
    try {
      await sendEmail(admin.email, 'admin_account_deleted', {
        admin_name: admin.full_name,
        reason: reason || 'Administrative action',
        contact_email: 'admin@applybureau.com'
      });
    } catch (emailError) {
      console.error('Failed to send deletion email:', emailError);
    }

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete admin',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;