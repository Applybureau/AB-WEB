const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Super Admin Email - Only this admin can manage other admins
const SUPER_ADMIN_EMAIL = 'applybureau@gmail.com';

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
    .select('email, is_super_admin')
    .eq('id', userId)
    .single();

  if (adminFromAdminsTable) {
    return adminFromAdminsTable.email === SUPER_ADMIN_EMAIL || adminFromAdminsTable.is_super_admin === true;
  }

  // Fallback to clients table (legacy admin system)
  const { data: adminFromClientsTable } = await supabaseAdmin
    .from('clients')
    .select('email')
    .eq('id', userId)
    .eq('email', SUPER_ADMIN_EMAIL)
    .single();

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
      'password_reset': {
        subject: 'Password Reset - Apply Bureau',
        template: 'admin_password_reset',
        data: {
          admin_name: details.admin_name,
          admin_email: details.admin_email || 'admin@applybureau.com', // Add admin email
          reset_by: details.reset_by,
          new_password: details.new_password,
          login_url: details.login_url,
          contact_email: SUPER_ADMIN_EMAIL,
          current_year: new Date().getFullYear() // Add current year
        }
      },
    };

    const emailConfig = emailTemplates[action];
    if (emailConfig) {
      await sendEmail(targetEmail, emailConfig.template, emailConfig.data);
    }
  } catch (error) {
    console.error('Failed to send admin action email:', error);
  }
}

// GET /api/admin-management - List all admins (root endpoint)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const currentAdminId = req.user.id;
    
    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Get all admins from both tables
    const { data: adminsFromAdminsTable } = await supabaseAdmin
      .from('admins')
      .select('id, email, full_name, role, is_active, created_at, last_login_at, profile_picture_url, phone, permissions')
      .order('created_at', { ascending: false });

    const { data: adminsFromClientsTable } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, role, created_at, last_login_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    // Combine and format results
    const allAdmins = [
      ...(adminsFromAdminsTable || []).map(admin => ({
        ...admin,
        source: 'admins_table',
        is_super_admin: admin.email === SUPER_ADMIN_EMAIL
      })),
      ...(adminsFromClientsTable || []).map(admin => ({
        ...admin,
        source: 'clients_table',
        is_active: true,
        is_super_admin: admin.email === SUPER_ADMIN_EMAIL
      }))
    ];

    res.json({
      admins: allAdmins,
      total: allAdmins.length,
      super_admin_email: SUPER_ADMIN_EMAIL
    });
  } catch (error) {
    console.error('Error fetching admin list:', error);
    res.status(500).json({ error: 'Failed to fetch admin list' });
  }
});

// GET /api/admin-management/profile - Get current admin profile with full details
router.get('/profile', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    let adminData = null;
    let isSuper = false;

    // First try admins table (new admin system)
    const { data: adminFromAdminsTable } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .single();

    if (adminFromAdminsTable) {
      adminData = adminFromAdminsTable;
      isSuper = adminFromAdminsTable.email === SUPER_ADMIN_EMAIL || adminFromAdminsTable.is_super_admin === true;
    } else {
      // Fallback to clients table (legacy admin system)
      const { data: adminFromClientsTable } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', adminId)
        .eq('role', 'admin')
        .single();

      if (adminFromClientsTable) {
        adminData = adminFromClientsTable;
        isSuper = adminFromClientsTable.email === SUPER_ADMIN_EMAIL;
      }
    }

    if (!adminData) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

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
        permissions: adminData.permissions || {
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
    const currentAdminId = req.user.id;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Get admins from both tables
    const { data: adminsFromAdminsTable } = await supabaseAdmin
      .from('admins')
      .select('id, full_name, email, role, profile_picture_url, phone, is_active, last_login_at, created_at, is_super_admin')
      .order('created_at', { ascending: false });

    const { data: adminsFromClientsTable } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email, role, profile_picture_url, phone, is_active, last_login_at, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    // Combine results and mark super admin
    const allAdmins = [
      ...(adminsFromAdminsTable || []).map(admin => ({
        ...admin,
        source: 'admins_table',
        is_super_admin: admin.email === SUPER_ADMIN_EMAIL || admin.is_super_admin === true,
        can_be_modified: admin.email !== SUPER_ADMIN_EMAIL
      })),
      ...(adminsFromClientsTable || []).map(admin => ({
        ...admin,
        source: 'clients_table',
        is_super_admin: admin.email === SUPER_ADMIN_EMAIL,
        can_be_modified: admin.email !== SUPER_ADMIN_EMAIL
      }))
    ];

    // Remove duplicates (same email from both tables)
    const uniqueAdmins = allAdmins.reduce((acc, admin) => {
      const existing = acc.find(a => a.email === admin.email);
      if (!existing) {
        acc.push(admin);
      } else if (admin.source === 'admins_table') {
        // Prefer admins table over clients table
        const index = acc.findIndex(a => a.email === admin.email);
        acc[index] = admin;
      }
      return acc;
    }, []);

    res.json({ 
      admins: uniqueAdmins,
      total: uniqueAdmins.length,
      super_admin_email: SUPER_ADMIN_EMAIL
    });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ error: 'Failed to list admins' });
  }
});

// POST /api/admin-management/admins - Create new admin (super admin only)
router.post('/admins', authenticateToken, requireAdmin, upload.single('profile_picture'), async (req, res) => {
  try {
    const currentAdminId = req.user.id;
    const { full_name, email, password, phone } = req.body;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Only super admin can create new admins' });
    }

    // Check if email already exists in either table
    const { data: existingClientAdmin } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', email)
      .single();

    const { data: existingAdminAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existingClientAdmin || existingAdminAdmin) {
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
        password: hashedPassword, // Use password field for clients table
        phone,
        role: 'admin',
        profile_picture_url: profilePictureUrl,
        status: 'active',
        onboarding_complete: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, full_name, email, role, profile_picture_url, phone, status, created_at')
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return res.status(500).json({ error: 'Failed to create admin' });
    }

    // Send welcome email to new admin (without password)
    try {
      await sendEmail(email, 'admin_welcome', {
        admin_name: full_name,
        admin_email: email,
        login_url: `${process.env.FRONTEND_URL}/admin/login`,
        super_admin_email: SUPER_ADMIN_EMAIL,
        current_year: new Date().getFullYear()
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
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, full_name, email, status')
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

    // Send action notification to super admin
    try {
      const { generateAdminActionUrls } = require('../utils/emailTokens');
      const actionUrls = generateAdminActionUrls(id, targetAdmin.email);
      
      await sendEmail('admin@applybureau.com', 'admin_action_required', {
        admin_name: targetAdmin.full_name,
        admin_email: targetAdmin.email,
        admin_status: 'Suspended',
        action_reason: reason || 'Administrative action',
        suspend_url: actionUrls.suspendUrl,
        delete_url: actionUrls.deleteUrl,
        dashboard_url: `${process.env.FRONTEND_URL}/admin/management`
      });
    } catch (emailError) {
      console.error('Failed to send super admin notification:', emailError);
    }

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
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, full_name, email, status')
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
        status: 'inactive',
        updated_at: new Date().toISOString()
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

// POST /api/admin-management/reset-password - Reset admin password (super admin only)
router.post('/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const currentAdminId = req.user.id;
    const { admin_email, new_password, send_email = true } = req.body;

    // Check if current user is super admin
    const isSuper = await isSuperAdmin(currentAdminId);
    if (!isSuper) {
      return res.status(403).json({ error: 'Only super admin can reset passwords' });
    }

    // Validate input
    if (!admin_email || !new_password) {
      return res.status(400).json({ error: 'Admin email and new password are required' });
    }

    // Validate password strength
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find admin in both tables
    let targetAdmin = null;
    let adminTable = null;

    // Check admins table first
    const { data: adminFromAdminsTable } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', admin_email)
      .single();

    if (adminFromAdminsTable) {
      targetAdmin = adminFromAdminsTable;
      adminTable = 'admins';
    } else {
      // Check clients table (legacy admin system)
      const { data: adminFromClientsTable } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('email', admin_email)
        .eq('role', 'admin')
        .single();

      if (adminFromClientsTable) {
        targetAdmin = adminFromClientsTable;
        adminTable = 'clients';
      }
    }

    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prevent super admin from resetting their own password through this endpoint
    if (targetAdmin.email === SUPER_ADMIN_EMAIL && targetAdmin.id === currentAdminId) {
      return res.status(400).json({ error: 'Use change-password endpoint to change your own password' });
    }

    // Hash the new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Update password in the appropriate table
    const { error: updateError } = await supabaseAdmin
      .from(adminTable)
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', admin_email);

    if (updateError) {
      console.error('Error updating admin password:', updateError);
      return res.status(500).json({ error: 'Failed to reset password' });
    }

    // Send password reset notification email if requested
    if (send_email) {
      try {
        await sendAdminActionEmail(admin_email, 'password_reset', {
          admin_name: targetAdmin.full_name,
          admin_email: targetAdmin.email, // Add admin email
          reset_by: req.user.full_name || req.user.email,
          new_password: new_password, // Include new password in email
          login_url: `${process.env.FRONTEND_URL}/admin/login`
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the password reset if email fails
      }
    }

    console.log(`Password reset for admin ${admin_email} by super admin ${req.user.email}`);

    res.json({
      message: 'Password reset successfully',
      admin_email: admin_email,
      email_sent: send_email
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/admin-management/change-password - Change own password
router.post('/change-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { current_password, new_password } = req.body;

    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Validate new password strength
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Find admin in both tables
    let targetAdmin = null;
    let adminTable = null;

    // Check admins table first
    const { data: adminFromAdminsTable } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .single();

    if (adminFromAdminsTable) {
      targetAdmin = adminFromAdminsTable;
      adminTable = 'admins';
    } else {
      // Check clients table (legacy admin system)
      const { data: adminFromClientsTable } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', adminId)
        .single();

      if (adminFromClientsTable) {
        targetAdmin = adminFromClientsTable;
        adminTable = 'clients';
      }
    }

    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isCurrentPasswordValid = await bcrypt.compare(current_password, targetAdmin.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from(adminTable)
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId);

    if (updateError) {
      console.error('Error changing admin password:', updateError);
      return res.status(500).json({ error: 'Failed to change password' });
    }

    console.log(`Password changed for admin ${targetAdmin.email}`);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;