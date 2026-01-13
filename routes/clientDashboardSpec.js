const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');
const { upload, uploadToSupabase } = require('../utils/upload');

const router = express.Router();

// GET /api/client/profile - Get client profile data (PROTECTED - CLIENT)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Verify user is a client
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select(`
        id, full_name, email, phone, profile_picture, linkedin_url, current_job, 
        target_job, years_of_experience, role_targets, country, user_location, 
        location_preferences, minimum_salary, age, employment_status, target_market,
        package_tier, package_expiry, profile_completion, created_at, updated_at, role
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User profile not found',
        code: 'NOT_FOUND'
      });
    }

    if (user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Format response according to spec
    const profileData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      profile_picture: user.profile_picture,
      linkedin_url: user.linkedin_url,
      current_job: user.current_job,
      target_job: user.target_job,
      years_of_experience: user.years_of_experience,
      role_targets: user.role_targets,
      country: user.country,
      user_location: user.user_location,
      location_preferences: user.location_preferences,
      minimum_salary: user.minimum_salary,
      age: user.age,
      employment_status: user.employment_status,
      target_market: user.target_market,
      package_tier: user.package_tier,
      package_expiry: user.package_expiry,
      profile_completion: user.profile_completion || 0,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({
      success: true,
      profile: profileData
    });
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/client/profile - Update client profile (PROTECTED - CLIENT)
router.patch('/profile', authenticateToken, upload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const updateFields = req.body;

    // Remove fields that shouldn't be updated via this endpoint
    delete updateFields.id;
    delete updateFields.role;
    delete updateFields.created_at;
    delete updateFields.package_tier;
    delete updateFields.package_expiry;

    // Validate email if provided
    if (updateFields.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateFields.email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
      }
    }

    // Handle file uploads
    if (req.files) {
      // Handle profile picture upload
      if (req.files.profile_picture && req.files.profile_picture[0]) {
        try {
          const fileName = `client_${userId}_${Date.now()}.jpg`;
          const uploadResult = await uploadToSupabase(req.files.profile_picture[0], 'client-profiles', fileName);
          updateFields.profile_picture = uploadResult.url;
        } catch (uploadError) {
          console.error('Profile picture upload error:', uploadError);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to upload profile picture',
            code: 'UPLOAD_ERROR'
          });
        }
      }

      // Handle resume upload
      if (req.files.resume && req.files.resume[0]) {
        try {
          const fileName = `resume_${userId}_${Date.now()}.pdf`;
          const uploadResult = await uploadToSupabase(req.files.resume[0], 'client-resumes', fileName);
          updateFields.resume_url = uploadResult.url;
          updateFields.resume_path = uploadResult.path;
        } catch (uploadError) {
          console.error('Resume upload error:', uploadError);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to upload resume',
            code: 'UPLOAD_ERROR'
          });
        }
      }
    }

    // Add updated timestamp
    updateFields.updated_at = new Date().toISOString();

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update(updateFields)
      .eq('id', userId)
      .eq('role', 'client')
      .select(`
        id, full_name, email, phone, profile_picture, linkedin_url, current_job, 
        target_job, years_of_experience, role_targets, country, user_location, 
        location_preferences, minimum_salary, age, employment_status, target_market,
        package_tier, package_expiry, profile_completion, created_at, updated_at
      `)
      .single();

    if (updateError || !updatedUser) {
      console.error('Error updating client profile:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update profile',
        code: 'UPDATE_ERROR'
      });
    }

    // Format response according to spec
    const profileData = {
      id: updatedUser.id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      profile_picture: updatedUser.profile_picture,
      linkedin_url: updatedUser.linkedin_url,
      current_job: updatedUser.current_job,
      target_job: updatedUser.target_job,
      years_of_experience: updatedUser.years_of_experience,
      role_targets: updatedUser.role_targets,
      country: updatedUser.country,
      user_location: updatedUser.user_location,
      location_preferences: updatedUser.location_preferences,
      minimum_salary: updatedUser.minimum_salary,
      age: updatedUser.age,
      employment_status: updatedUser.employment_status,
      target_market: updatedUser.target_market,
      package_tier: updatedUser.package_tier,
      package_expiry: updatedUser.package_expiry,
      profile_completion: updatedUser.profile_completion,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: profileData
    });
  } catch (error) {
    console.error('Update client profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/client/dashboard - Get client dashboard data (PROTECTED - CLIENT)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role, package_tier, package_expiry')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get application statistics
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id, status, applied_date, interview_date, offer_date')
      .eq('user_id', userId);

    const stats = {
      applications_submitted: applications?.length || 0,
      interviews_scheduled: applications?.filter(app => app.status === 'interview_scheduled').length || 0,
      offers_received: applications?.filter(app => app.status === 'offer_received').length || 0,
      mock_sessions_completed: 0, // Will be calculated from mock_sessions table
      resources_downloaded: 0, // Will be calculated from resource_downloads table
      package_days_remaining: 0
    };

    // Calculate package days remaining
    if (user.package_expiry) {
      const expiryDate = new Date(user.package_expiry);
      const today = new Date();
      const diffTime = expiryDate - today;
      stats.package_days_remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Get recent applications (last 5)
    const { data: recentApplications } = await supabaseAdmin
      .from('applications')
      .select('id, company, role, status, applied_date, interview_date, job_link, notes')
      .eq('user_id', userId)
      .order('applied_date', { ascending: false })
      .limit(5);

    const formattedRecentApplications = (recentApplications || []).map(app => ({
      id: app.id,
      company: app.company,
      role: app.role,
      status: app.status,
      applied_date: app.applied_date,
      interview_date: app.interview_date,
      job_link: app.job_link,
      notes: app.notes
    }));

    // Get upcoming interviews
    const { data: upcomingInterviews } = await supabaseAdmin
      .from('applications')
      .select('id, company, role, interview_date, interview_type, meeting_link, interviewer, notes')
      .eq('user_id', userId)
      .eq('status', 'interview_scheduled')
      .gte('interview_date', new Date().toISOString())
      .order('interview_date', { ascending: true })
      .limit(5);

    const formattedUpcomingInterviews = (upcomingInterviews || []).map(interview => ({
      id: interview.id,
      company: interview.company,
      role: interview.role,
      interview_date: interview.interview_date,
      interview_type: interview.interview_type || 'Interview',
      meeting_link: interview.meeting_link,
      interviewer: interview.interviewer,
      preparation_notes: interview.notes
    }));

    // Get mock sessions (placeholder - would need mock_sessions table)
    const mockSessions = []; // TODO: Implement when mock_sessions table is created

    // Get available resources (placeholder - would need resources table)
    const resources = [
      {
        id: 1,
        title: "Software Engineering Interview Guide",
        type: "PDF",
        category: "Interview Preparation",
        download_url: "https://cdn.applybureau.com/resources/interview-guide.pdf",
        description: "Comprehensive guide covering technical and behavioral interviews"
      }
    ];

    // Format dashboard data according to spec
    const dashboardData = {
      stats,
      recent_applications: formattedRecentApplications,
      upcoming_interviews: formattedUpcomingInterviews,
      mock_sessions: mockSessions,
      resources: resources
    };

    res.json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Get client dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard data',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/client/applications - Get client applications (PROTECTED - CLIENT)
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      status,
      company,
      limit = 50, 
      offset = 0,
      sort_by = 'applied_date',
      sort_order = 'desc'
    } = req.query;

    // Verify user is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - clients only',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    let query = supabaseAdmin
      .from('applications')
      .select(`
        id, company, role, job_link, status, applied_date, salary_range, location,
        application_method, notes, interview_date, interview_type, interviewer,
        meeting_link, offer_date, rejection_date, created_at, updated_at
      `)
      .eq('user_id', userId)
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (company) {
      query = query.ilike('company', `%${company}%`);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching client applications:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch applications',
        code: 'DATABASE_ERROR'
      });
    }

    // Format applications according to spec
    const formattedApplications = (applications || []).map(app => ({
      id: app.id,
      company: app.company,
      role: app.role,
      status: app.status,
      applied_date: app.applied_date,
      job_link: app.job_link,
      salary_range: app.salary_range,
      location: app.location,
      application_method: app.application_method,
      notes: app.notes,
      interview_date: app.interview_date,
      interview_type: app.interview_type,
      interviewer: app.interviewer,
      meeting_link: app.meeting_link,
      offer_date: app.offer_date,
      rejection_date: app.rejection_date,
      created_at: app.created_at,
      updated_at: app.updated_at
    }));

    res.json({
      success: true,
      applications: formattedApplications,
      total: applications?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch client applications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applications',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;