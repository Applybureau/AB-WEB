const express = require('express');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const { upload, uploadToSupabase } = require('../utils/upload');

const router = express.Router();

// POST /api/admin-management/admins - Create new admin (PROTECTED - MAIN ADMIN ONLY)
router.post('/admins', authenticateToken, requireAdmin, upload.single('profile_picture'), async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      role = 'admin'
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: full_name, email, password',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if requesting user is main admin
    const requestingUserId = req.user.userId || req.user.id;
    const { data: requestingUser, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('is_main_admin, can_create_admins')
      .eq('id', requestingUserId)
      .single();

    if (userError || (!requestingUser.is_main_admin && !requestingUser.can_create_admins)) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to create admin accounts',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already exists',
        code: 'EMAIL_EXISTS'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Handle profile picture upload
    let profilePictureUrl = null;
    if (req.file) {
      try {
        const fileName = `admin_${Date.now()}_${full_name.replace(/\s+/g, '_')}.jpg`;
        const uploadResult = await uploadToSupabase(req.file, 'admin-profiles', fileName);
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

    // Create admin user
    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        full_name,
        email,
        passcode_hash: hashedPassword,
        phone,
        role,
        profile_picture: profilePictureUrl,
        is_active: true,
        is_main_admin: false,
        can_create_admins: false,
        can_delete_admins: false,
        can_suspend_admins: false,
        can_manage_clients: true,
        can_schedule_consultations: true,
        can_view_reports: true,
        can_reset_passwords: false,
        created_by: requestingUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating admin:', createError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create admin account',
        code: 'DATABASE_ERROR'
      });
    }

    // Send welcome email
    try {
      await sendEmail(email, 'admin_welcome', {
        admin_name: full_name,
        login_url: process.env.FRONTEND_URL + '/admin/login',
        temporary_password: password,
        created_by: req.user.full_name || 'System Administrator'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Format response according to spec
    const adminData = {
      id: newAdmin.id,
      full_name: newAdmin.full_name,
      email: newAdmin.email,
      phone: newAdmin.phone,
      role: newAdmin.role,
      status: 'active',
      is_main_admin: newAdmin.is_main_admin,
      profile_picture: newAdmin.profile_picture,
      created_at: newAdmin.created_at,
      updated_at: newAdmin.updated_at,
      last_login: null,
      permissions: {
        can_create_admins: newAdmin.can_create_admins,
        can_delete_admins: newAdmin.can_delete_admins,
        can_suspend_admins: newAdmin.can_suspend_admins,
        can_manage_clients: newAdmin.can_manage_clients,
        can_schedule_consultations: newAdmin.can_schedule_consultations,
        can_view_reports: newAdmin.can_view_reports,
        can_reset_passwords: newAdmin.can_reset_passwords
      }
    };

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      admin: adminData
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create admin account',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin-management/admins - List all admins (PROTECTED)
router.get('/admins', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status,
      limit = 50, 
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('registered_users')
      .select('id, full_name, email, phone, role, is_active, is_main_admin, profile_picture, created_at, updated_at, last_login, can_create_admins, can_delete_admins, can_suspend_admins, can_manage_clients, can_schedule_consultations, can_view_reports, can_reset_passwords')
      .eq('role', 'admin')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'suspended') {
        query = query.eq('is_active', false);
      }
    }

    const { data: admins, error } = await query;

    if (error) {
      console.error('Error fetching admins:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch admin accounts',
        code: 'DATABASE_ERROR'
      });
    }

    // Format admins according to spec
    const formattedAdmins = (admins || []).map(admin => ({
      id: admin.id,
      full_name: admin.full_name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      status: admin.is_active ? 'active' : 'suspended',
      is_main_admin: admin.is_main_admin,
      profile_picture: admin.profile_picture,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
      last_login: admin.last_login,
      permissions: {
        can_create_admins: admin.can_create_admins,
        can_delete_admins: admin.can_delete_admins,
        can_suspend_admins: admin.can_suspend_admins,
        can_manage_clients: admin.can_manage_clients,
        can_schedule_consultations: admin.can_schedule_consultations,
        can_view_reports: admin.can_view_reports,
        can_reset_passwords: admin.can_reset_passwords
      }
    }));

    res.json({
      success: true,
      admins: formattedAdmins,
      total: admins?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch admins error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch admin accounts',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/admin-management/admins/:id/suspend - Suspend admin (PROTECTED)
router.put('/admins/:id/suspend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false,
        error: 'Suspension reason is required',
        code: 'MISSING_REASON'
      });
    }

    // Check permissions
    const requestingUserId = req.user.userId || req.user.id;
    const { data: requestingUser } = await supabaseAdmin
      .from('registered_users')
      .select('is_main_admin, can_suspend_admins')
      .eq('id', requestingUserId)
      .single();

    if (!requestingUser.is_main_admin && !requestingUser.can_suspend_admins) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to suspend admin accounts',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get target admin
    const { data: targetAdmin, error: fetchError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('id', id)
      .eq('role', 'admin')
      .single();

    if (fetchError || !targetAdmin) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin account not found',
        code: 'NOT_FOUND'
      });
    }

    // Cannot suspend main admin
    if (targetAdmin.is_main_admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Cannot suspend main admin account',
        code: 'CANNOT_SUSPEND_MAIN_ADMIN'
      });
    }

    // Suspend admin
    const { data: suspendedAdmin, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        is_active: false,
        suspended_at: new Date().toISOString(),
        suspended_by: requestingUserId,
        suspension_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error suspending admin:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to suspend admin account',
        code: 'UPDATE_ERROR'
      });
    }

    // Send suspension notification email
    try {
      await sendEmail(suspendedAdmin.email, 'admin_account_suspended', {
        admin_name: suspendedAdmin.full_name,
        suspension_reason: reason,
        suspended_by: req.user.full_name || 'System Administrator',
        contact_email: 'admin@applybureau.com'
      });
    } catch (emailError) {
      console.error('Failed to send suspension email:', emailError);
    }

    res.json({
      success: true,
      message: 'Admin account suspended successfully',
      admin: {
        id: suspendedAdmin.id,
        full_name: suspendedAdmin.full_name,
        email: suspendedAdmin.email,
        status: 'suspended',
        suspended_at: suspendedAdmin.suspended_at,
        suspension_reason: suspendedAdmin.suspension_reason
      }
    });
  } catch (error) {
    console.error('Suspend admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to suspend admin account',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/admin-management/admins/:id/reactivate - Reactivate admin (PROTECTED)
router.put('/admins/:id/reactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reactivation_notes } = req.body;

    // Check permissions
    const requestingUserId = req.user.userId || req.user.id;
    const { data: requestingUser } = await supabaseAdmin
      .from('registered_users')
      .select('is_main_admin, can_suspend_admins')
      .eq('id', requestingUserId)
      .single();

    if (!requestingUser.is_main_admin && !requestingUser.can_suspend_admins) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to reactivate admin accounts',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Reactivate admin
    const { data: reactivatedAdmin, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        is_active: true,
        reactivated_at: new Date().toISOString(),
        reactivated_by: requestingUserId,
        reactivation_notes: reactivation_notes || 'Account reactivated',
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('role', 'admin')
      .select()
      .single();

    if (updateError || !reactivatedAdmin) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin account not found or failed to reactivate',
        code: 'UPDATE_ERROR'
      });
    }

    // Send reactivation notification email
    try {
      await sendEmail(reactivatedAdmin.email, 'admin_account_reactivated', {
        admin_name: reactivatedAdmin.full_name,
        reactivation_notes: reactivation_notes || 'Your account has been reactivated',
        reactivated_by: req.user.full_name || 'System Administrator',
        login_url: process.env.FRONTEND_URL + '/admin/login'
      });
    } catch (emailError) {
      console.error('Failed to send reactivation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Admin account reactivated successfully',
      admin: {
        id: reactivatedAdmin.id,
        full_name: reactivatedAdmin.full_name,
        email: reactivatedAdmin.email,
        status: 'active',
        reactivated_at: reactivatedAdmin.reactivated_at,
        reactivation_notes: reactivatedAdmin.reactivation_notes
      }
    });
  } catch (error) {
    console.error('Reactivate admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reactivate admin account',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/admin-management/admins/:id/reset-password - Reset admin password (PROTECTED)
router.post('/admins/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { send_email = true, temporary_password } = req.body;

    // Check permissions
    const requestingUserId = req.user.userId || req.user.id;
    const { data: requestingUser } = await supabaseAdmin
      .from('registered_users')
      .select('is_main_admin, can_reset_passwords')
      .eq('id', requestingUserId)
      .single();

    if (!requestingUser.is_main_admin && !requestingUser.can_reset_passwords) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to reset passwords',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get target admin
    const { data: targetAdmin, error: fetchError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('id', id)
      .eq('role', 'admin')
      .single();

    if (fetchError || !targetAdmin) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin account not found',
        code: 'NOT_FOUND'
      });
    }

    // Generate temporary password if not provided
    const newPassword = temporary_password || `TempPass${Math.random().toString(36).slice(-8)}!`;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        passcode_hash: hashedPassword,
        password_reset_at: new Date().toISOString(),
        password_reset_by: requestingUserId,
        must_change_password: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error resetting password:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to reset password',
        code: 'UPDATE_ERROR'
      });
    }

    // Send password reset email
    if (send_email) {
      try {
        await sendEmail(targetAdmin.email, 'admin_password_reset', {
          admin_name: targetAdmin.full_name,
          temporary_password: newPassword,
          reset_by: req.user.full_name || 'System Administrator',
          login_url: process.env.FRONTEND_URL + '/admin/login',
          change_password_url: process.env.FRONTEND_URL + '/admin/change-password'
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      temporary_password: send_email ? 'Sent via email' : newPassword,
      must_change_password: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reset password',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/admin-management/admins/:id - Delete admin (PROTECTED)
router.delete('/admins/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation, reason } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({ 
        success: false,
        error: 'Confirmation must be "DELETE"',
        code: 'INVALID_CONFIRMATION'
      });
    }

    if (!reason) {
      return res.status(400).json({ 
        success: false,
        error: 'Deletion reason is required',
        code: 'MISSING_REASON'
      });
    }

    // Check permissions
    const requestingUserId = req.user.userId || req.user.id;
    const { data: requestingUser } = await supabaseAdmin
      .from('registered_users')
      .select('is_main_admin, can_delete_admins')
      .eq('id', requestingUserId)
      .single();

    if (!requestingUser.is_main_admin && !requestingUser.can_delete_admins) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions to delete admin accounts',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get target admin
    const { data: targetAdmin, error: fetchError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('id', id)
      .eq('role', 'admin')
      .single();

    if (fetchError || !targetAdmin) {
      return res.status(404).json({ 
        success: false,
        error: 'Admin account not found',
        code: 'NOT_FOUND'
      });
    }

    // Cannot delete main admin
    if (targetAdmin.is_main_admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Cannot delete main admin account',
        code: 'CANNOT_DELETE_MAIN_ADMIN'
      });
    }

    // Cannot delete self
    if (targetAdmin.id === requestingUserId) {
      return res.status(403).json({ 
        success: false,
        error: 'Cannot delete your own account',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    // Send deletion notification email before deleting
    try {
      await sendEmail(targetAdmin.email, 'admin_account_deleted', {
        admin_name: targetAdmin.full_name,
        deletion_reason: reason,
        deleted_by: req.user.full_name || 'System Administrator',
        contact_email: 'admin@applybureau.com'
      });
    } catch (emailError) {
      console.error('Failed to send deletion email:', emailError);
    }

    // Delete admin account
    const { error: deleteError } = await supabaseAdmin
      .from('registered_users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting admin:', deleteError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete admin account',
        code: 'DELETE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Admin account deleted successfully',
      deleted_admin: {
        id: targetAdmin.id,
        full_name: targetAdmin.full_name,
        email: targetAdmin.email,
        deletion_reason: reason
      }
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete admin account',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;