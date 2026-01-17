const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { validate, schemas } = require('../utils/validation');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Super Admin Email - Only this admin can manage other admins
const SUPER_ADMIN_EMAIL = 'admin@applybureau.com';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profile_picture') {
      // Allow images for profile pictures
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Profile picture must be an image file'), false);
      }
    } else if (file.fieldname === 'resume') {
      // Allow PDFs for resumes
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Resume must be a PDF file'), false);
      }
    } else {
      cb(new Error('Invalid file field'), false);
    }
  }
});

// Helper function to check if user is super admin
async function isSuperAdmin(userId) {
  // Check admins table first (new admin system)
  const { data: adminFromAdminsTable } = await supabaseAdmin
    .from('admins')
    .select('email')
    .eq('id', userId)
    .eq('email', SUPER_ADMIN_EMAIL)
    .maybeSingle();

  if (adminFromAdminsTable) {
    return true;
  }

  // Fallback to clients table (legacy admin system)
  const { data: adminFromClientsTable } = await supabaseAdmin
    .from('clients')
    .select('email')
    .eq('id', userId)
    .eq('email', SUPER_ADMIN_EMAIL)
    .maybeSingle();

  return !!adminFromClientsTable;
}

// Helper function to send admin action notification emails
async function sendAdminActionEmail(targetEmail, action, details) {
  try {
    const emailTemplates = {
      'account_suspended': {
        subject: 'Account Suspended - Apply Bureau',
        template: 'admin_account_suspended',
        data: {
          admin_name: details.admin_name,
          suspended_by: details.suspended_by,
          reason: details.reason || 'Administrative action',
          contact_email: SUPER_ADMIN_EMAIL
        }
      },
      'account_reactivated': {
        subject: 'Account Reactivated - Apply Bureau',
        template: 'admin_account_reactivated',
        data: {
          admin_name: details.admin_name,
          reactivated_by: details.reactivated_by,
          contact_email: SUPER_ADMIN_EMAIL
        }
      },
      'account_deleted': {
        subject: 'Account Deleted - Apply Bureau',
        template: 'admin_account_deleted',
        data: {
          admin_name: details.admin_name,
          deleted_by: details.deleted_by,
          reason: details.reason || 'Administrative action',
          contact_email: SUPER_ADMIN_EMAIL
        }
      },
      'password_reset': {
        subject: 'Password Reset - Apply Bureau',
        template: 'admin_password_reset',
        data: {
          admin_name: details.admin_name,
          new_password: details.new_password,
          reset_by: details.reset_by,
          login_url: `${process.env.FRONTEND_URL}/admin/login`
        }
      }
    };

    const emailConfig = emailTemplates[action];
    if (emailConfig) {
      await sendEmail(targetEmail, emailConfig.template, emailConfig.data);
    }
  } catch (error) {
    console.error('Failed to send admin action email:', error);
  }
}

// GET /api/admin-management/profile - Get current admin profile with full details
router.get('/profile', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.userId || req.user.id;

    // Get admin details from clients table (main admin system)
    const { data: adminData, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (error || !adminData) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    // Check if this is the super admin
    const isSuper = await isSuperAdmin(adminId);

    // Get recent activity from notifications or create mock data
    const { data: recentActivity } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', adminId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      admin: {
        id: adminData.id,
        full_name: adminData.full_name,
        email: adminData.email,
        role: adminData.role,
        profile_picture_url: adminData.profile_picture_url,
        phone: adminData.phone,
        is_super_admin: isSuper,
        permissions: {
          can_create_admins: isSuper,
          can_delete_admins: isSuper,
          can_suspend_admins: isSuper,
          can_manage_clients: true,
          can_schedule_consultations: true,
          can_view_reports: true,
          can_manage_system: isSuper,
          can_reset_passwords: isSuper
        },
        is_active: adminData.is_active !== false,
        last_login_at: adminData.last_login_at,
        created_at: adminData.created_at
      },
      recent_activity: recentActivity || [],
      system_info: {
        super_admin_email: SUPER_ADMIN_EMAIL,
        can_manage_admins: isSuper
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ error: 'Failed to get admin profile' });
  }
});

// GET /api/admin-management/admins - List all admins (super admin only)
router.get('/admins', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const currentAdminId = req.user.userId || req.user.id;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { data: admins, error } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email, role, profile_picture_url, phone, is_active, last_login_at, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return res.status(500).json({ error: 'Failed to fetch admins' });
    }

    // Mark super admin
    const adminsWithSuperFlag = (admins || []).map(admin => ({
      ...admin,
      is_super_admin: admin.email === SUPER_ADMIN_EMAIL,
      can_be_modified: admin.email !== SUPER_ADMIN_EMAIL // Super admin cannot be modified by others
    }));

    res.json({ admins: adminsWithSuperFlag });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ error: 'Failed to list admins' });
  }
});

// POST /api/admin-management/admins - Create new admin (super admin only)
router.post('/admins', authenticateToken, requireAdmin, upload.single('profile_picture'), async (req, res) => {
  try {
    const currentAdminId = req.user.userId || req.user.id;
    const { full_name, email, password, phone } = req.body;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Only super admin can create new admins' });
    }

    // Check if email already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Handle profile picture upload if provided
    let profilePictureUrl = null;
    if (req.file) {
      const fileName = `admin-${Date.now()}-${req.file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('profile-pictures')
        .upload(`admins/${fileName}`, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('profile-pictures')
          .getPublicUrl(`admins/${fileName}`);
        profilePictureUrl = urlData.publicUrl;
      }
    }

    // Create admin in clients table
    const { data: newAdmin, error } = await supabaseAdmin
      .from('clients')
      .insert({
        full_name,
        email,
        password: hashedPassword,
        phone,
        role: 'admin',
        profile_picture_url: profilePictureUrl,
        status: 'active',
        is_active: true
      })
      .select('id, full_name, email, role, profile_picture_url, phone, is_active, created_at')
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return res.status(500).json({ error: 'Failed to create admin' });
    }

    // Send welcome email to new admin
    try {
      await sendEmail(email, 'admin_welcome', {
        admin_name: full_name,
        login_url: `${process.env.FRONTEND_URL}/admin/login`,
        temporary_password: password,
        super_admin_email: SUPER_ADMIN_EMAIL
      });
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Don't fail admin creation if email fails
    }

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        ...newAdmin,
        is_super_admin: false,
        can_be_modified: true
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// PUT /api/admin-management/admins/:id/suspend - Suspend admin account
router.put('/admins/:id/suspend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentAdminId = req.user.userId || req.user.id;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Only super admin can suspend accounts' });
    }

    // Prevent self-suspension
    if (id === currentAdminId) {
      return res.status(400).json({ error: 'Cannot suspend your own account' });
    }

    // Get target admin details
    const { data: targetAdmin } = await supabaseAdmin
      .from('clients')
      .select('full_name, email, role')
      .eq('id', id)
      .eq('role', 'admin')
      .single();

    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prevent suspending super admin
    if (targetAdmin.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ error: 'Cannot suspend super admin account' });
    }

    // Suspend the admin
    const { data: suspendedAdmin, error } = await supabaseAdmin
      .from('clients')
      .update({ 
        is_active: false,
        suspended_at: new Date().toISOString(),
        suspended_by: currentAdminId,
        suspension_reason: reason
      })
      .eq('id', id)
      .select('id, full_name, email, is_active')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to suspend admin' });
    }

    // Get current admin name for email
    const { data: currentAdmin } = await supabaseAdmin
      .from('clients')
      .select('full_name')
      .eq('id', currentAdminId)
      .single();

    // Send suspension notification email
    await sendAdminActionEmail(targetAdmin.email, 'account_suspended', {
      admin_name: targetAdmin.full_name,
      suspended_by: currentAdmin?.full_name || 'Super Admin',
      reason: reason
    });

    res.json({
      message: 'Admin account suspended successfully',
      admin: suspendedAdmin
    });
  } catch (error) {
    console.error('Suspend admin error:', error);
    res.status(500).json({ error: 'Failed to suspend admin' });
  }
});

// PUT /api/admin-management/admins/:id/reactivate - Reactivate admin account
router.put('/admins/:id/reactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.user.userId || req.user.id;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Only super admin can reactivate accounts' });
    }

    // Get target admin details
    const { data: targetAdmin } = await supabaseAdmin
      .from('clients')
      .select('full_name, email, role')
      .eq('id', id)
      .eq('role', 'admin')
      .single();

    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Reactivate the admin
    const { data: reactivatedAdmin, error } = await supabaseAdmin
      .from('clients')
      .update({ 
        is_active: true,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        reactivated_at: new Date().toISOString(),
        reactivated_by: currentAdminId
      })
      .eq('id', id)
      .select('id, full_name, email, is_active')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to reactivate admin' });
    }

    // Get current admin name for email
    const { data: currentAdmin } = await supabaseAdmin
      .from('clients')
      .select('full_name')
      .eq('id', currentAdminId)
      .single();

    // Send reactivation notification email
    await sendAdminActionEmail(targetAdmin.email, 'account_reactivated', {
      admin_name: targetAdmin.full_name,
      reactivated_by: currentAdmin?.full_name || 'Super Admin'
    });

    res.json({
      message: 'Admin account reactivated successfully',
      admin: reactivatedAdmin
    });
  } catch (error) {
    console.error('Reactivate admin error:', error);
    res.status(500).json({ error: 'Failed to reactivate admin' });
  }
});

// PUT /api/admin-management/admins/:id/reset-password - Reset admin password
router.put('/admins/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const currentAdminId = req.user.userId || req.user.id;

    // Check if current user is super admin or resetting own password
    const isSuper = await isSuperAdmin(currentAdminId);
    const isSelfReset = id === currentAdminId;

    if (!isSuper && !isSelfReset) {
      return res.status(403).json({ error: 'Only super admin can reset other admin passwords' });
    }

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Get target admin details
    const { data: targetAdmin } = await supabaseAdmin
      .from('clients')
      .select('full_name, email, role')
      .eq('id', id)
      .eq('role', 'admin')
      .single();

    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Update password
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ 
        password: hashedPassword,
        password_reset_at: new Date().toISOString(),
        password_reset_by: currentAdminId
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to reset password' });
    }

    // Get current admin name for email
    const { data: currentAdmin } = await supabaseAdmin
      .from('clients')
      .select('full_name')
      .eq('id', currentAdminId)
      .single();

    // Send password reset notification email (only if not self-reset)
    if (!isSelfReset) {
      await sendAdminActionEmail(targetAdmin.email, 'password_reset', {
        admin_name: targetAdmin.full_name,
        new_password: new_password,
        reset_by: currentAdmin?.full_name || 'Super Admin'
      });
    }

    res.json({
      message: isSelfReset ? 'Password updated successfully' : 'Admin password reset successfully',
      admin: {
        id: id,
        full_name: targetAdmin.full_name,
        email: targetAdmin.email
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// DELETE /api/admin-management/admins/:id - Delete admin account (super admin only)
router.delete('/admins/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentAdminId = req.user.userId || req.user.id;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Only super admin can delete admin accounts' });
    }

    // Prevent self-deletion
    if (id === currentAdminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get target admin details
    const { data: targetAdmin } = await supabaseAdmin
      .from('clients')
      .select('full_name, email, role')
      .eq('id', id)
      .eq('role', 'admin')
      .single();

    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prevent deleting super admin
    if (targetAdmin.email === SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ error: 'Cannot delete super admin account' });
    }

    // Soft delete by changing role and deactivating
    const { data: deletedAdmin, error } = await supabaseAdmin
      .from('clients')
      .update({ 
        role: 'deleted_admin',
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: currentAdminId,
        deletion_reason: reason
      })
      .eq('id', id)
      .select('id, full_name, email')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to delete admin' });
    }

    // Get current admin name for email
    const { data: currentAdmin } = await supabaseAdmin
      .from('clients')
      .select('full_name')
      .eq('id', currentAdminId)
      .single();

    // Send deletion notification email
    await sendAdminActionEmail(targetAdmin.email, 'account_deleted', {
      admin_name: targetAdmin.full_name,
      deleted_by: currentAdmin?.full_name || 'Super Admin',
      reason: reason
    });

    res.json({
      message: 'Admin account deleted successfully',
      admin: deletedAdmin
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// GET /api/admin-management/settings - Get admin settings (super admin only)
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const currentAdminId = req.user.userId || req.user.id;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Get system settings (you can expand this)
    const settings = {
      super_admin_email: SUPER_ADMIN_EMAIL,
      system_status: 'active',
      admin_creation_enabled: true,
      email_notifications_enabled: true,
      password_reset_enabled: true,
      account_suspension_enabled: true,
      last_updated: new Date().toISOString()
    };

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

module.exports = router;