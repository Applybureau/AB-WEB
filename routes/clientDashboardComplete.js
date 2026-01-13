const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');
const { upload, uploadToSupabase } = require('../utils/upload');

const router = express.Router();

// GET /api/client/profile - Get client profile data (PROTECTED)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: client, error } = await supabaseAdmin
      .from('registered_users')
      .select(`
        id,
        full_name,
        email,
        phone,
        profile_picture,
        linkedin_url,
        current_job,
        target_job,
        years_of_experience,
        role_targets,
        country,
        user_location,
        location_preferences,
        minimum_salary,
        age,
        employment_status,
        target_market,
        package_tier,
        package_expiry,
        profile_completion,
        created_at,
        updated_at
      `)
      .eq('id', clientId)
      .eq('role', 'client')
      .single();

    if (error) {
      console.error('Error fetching client profile:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch client profile',
        code: 'DATABASE_ERROR'
      });
    }

    if (!client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found',
        code: 'NOT_FOUND'
      });
    }

    // Format response to match exact specification
    const formattedProfile = {
      id: client.id,
      full_name: client.full_name,
      email: client.email,
      phone: client.phone,
      profile_picture: client.profile_picture,
      linkedin_url: client.linkedin_url,
      current_job: client.current_job,
      target_job: client.target_job,
      years_of_experience: client.years_of_experience,
      role_targets: client.role_targets,
      country: client.country,
      user_location: client.user_location,
      location_preferences: client.location_preferences,
      minimum_salary: client.minimum_salary,
      age: client.age,
      employment_status: client.employment_status,
      target_market: client.target_market,
      package_tier: client.package_tier || 'Tier 1',
      package_expiry: client.package_expiry,
      profile_completion: client.profile_completion || 0,
      created_at: client.created_at,
      updated_at: client.updated_at
    };

    res.json({
      success: true,
      data: formattedProfile
    });
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch client profile',
      code: 'SERVER_ERROR'
    });
  }
});

// PATCH /api/client/profile - Update client profile (PROTECTED)
router.patch('/profile', authenticateToken, upload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    const clientId = req.user.id;
    const {
      full_name,
      phone,
      linkedin_url,
      current_job,
      target_job,
      years_of_experience,
      role_targets,
      country,
      user_location,
      location_preferences,
      minimum_salary,
      age,
      employment_status,
      target_market
    } = req.body;

    const updateData = {};
    
    // Update text fields
    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = phone;
    if (linkedin_url) updateData.linkedin_url = linkedin_url;
    if (current_job) updateData.current_job = current_job;
    if (target_job) updateData.target_job = target_job;
    if (years_of_experience) updateData.years_of_experience = years_of_experience;
    if (role_targets) updateData.role_targets = role_targets;
    if (country) updateData.country = country;
    if (user_location) updateData.user_location = user_location;
    if (location_preferences) updateData.location_preferences = location_preferences;
    if (minimum_salary) updateData.minimum_salary = minimum_salary;
    if (age) updateData.age = parseInt(age);
    if (employment_status) updateData.employment_status = employment_status;
    if (target_market) updateData.target_market = target_market;

    // Handle profile picture upload
    if (req.files?.profile_picture?.[0]) {
      try {
        const file = req.files.profile_picture[0];
        const fileName = `profile_${clientId}_${Date.now()}.${file.originalname.split('.').pop()}`;
        const uploadResult = await uploadToSupabase(file, 'profile-pictures', fileName);
        updateData.profile_picture = uploadResult.url;
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
    if (req.files?.resume?.[0]) {
      try {
        const file = req.files.resume[0];
        const fileName = `resume_${clientId}_${Date.now()}.pdf`;
        const uploadResult = await uploadToSupabase(file, 'client-resumes', fileName);
        updateData.resume_url = uploadResult.url;
        updateData.resume_path = uploadResult.path;
      } catch (uploadError) {
        console.error('Resume upload error:', uploadError);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to upload resume',
          code: 'UPLOAD_ERROR'
        });
      }
    }

    // Calculate profile completion
    const completionFields = [
      'full_name', 'phone', 'linkedin_url', 'current_job', 'target_job',
      'years_of_experience', 'role_targets', 'country', 'user_location',
      'location_preferences', 'minimum_salary', 'age', 'employment_status', 'target_market'
    ];
    
    const { data: currentProfile } = await supabaseAdmin
      .from('registered_users')
      .select(completionFields.join(','))
      .eq('id', clientId)
      .single();

    const mergedProfile = { ...currentProfile, ...updateData };
    const completedFields = completionFields.filter(field => mergedProfile[field]);
    const completionPercentage = Math.round((completedFields.length / completionFields.length) * 100);
    updateData.profile_completion = completionPercentage;

    // Update client profile
    const { data: client, error } = await supabaseAdmin
      .from('registered_users')
      .update(updateData)
      .eq('id', clientId)
      .eq('role', 'client')
      .select(`
        id,
        full_name,
        email,
        phone,
        profile_picture,
        linkedin_url,
        current_job,
        target_job,
        years_of_experience,
        role_targets,
        country,
        user_location,
        location_preferences,
        minimum_salary,
        age,
        employment_status,
        target_market,
        package_tier,
        package_expiry,
        profile_completion,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating client profile:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update client profile',
        code: 'DATABASE_ERROR'
      });
    }

    // Format response
    const formattedProfile = {
      id: client.id,
      full_name: client.full_name,
      email: client.email,
      phone: client.phone,
      profile_picture: client.profile_picture,
      linkedin_url: client.linkedin_url,
      current_job: client.current_job,
      target_job: client.target_job,
      years_of_experience: client.years_of_experience,
      role_targets: client.role_targets,
      country: client.country,
      user_location: client.user_location,
      location_preferences: client.location_preferences,
      minimum_salary: client.minimum_salary,
      age: client.age,
      employment_status: client.employment_status,
      target_market: client.target_market,
      package_tier: client.package_tier || 'Tier 1',
      package_expiry: client.package_expiry,
      profile_completion: client.profile_completion,
      created_at: client.created_at,
      updated_at: client.updated_at
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: formattedProfile
    });
  } catch (error) {
    console.error('Update client profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update client profile',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/client/dashboard - Get client dashboard data (PROTECTED)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get applications statistics
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('clientId', clientId)
      .order('applied_date', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch dashboard data',
        code: 'DATABASE_ERROR'
      });
    }

    // Get mock sessions
    const { data: mockSessions, error: mockError } = await supabaseAdmin
      .from('mock_sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false });

    if (mockError) {
      console.error('Error fetching mock sessions:', mockError);
    }

    // Get resource downloads
    const { data: downloads, error: downloadsError } = await supabaseAdmin
      .from('resource_downloads')
      .select('resource_id')
      .eq('client_id', clientId);

    if (downloadsError) {
      console.error('Error fetching downloads:', downloadsError);
    }

    // Get client package info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('package_tier, package_expiry')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client info:', clientError);
    }

    // Calculate statistics
    const stats = {
      applications_submitted: applications?.length || 0,
      interviews_scheduled: applications?.filter(app => app.status === 'interview_scheduled').length || 0,
      offers_received: applications?.filter(app => app.status === 'offer_received').length || 0,
      mock_sessions_completed: mockSessions?.filter(session => session.status === 'completed').length || 0,
      resources_downloaded: downloads?.length || 0,
      package_days_remaining: client?.package_expiry ? 
        Math.max(0, Math.ceil((new Date(client.package_expiry) - new Date()) / (1000 * 60 * 60 * 24))) : 0
    };

    // Recent applications (last 5)
    const recent_applications = applications?.slice(0, 5).map(app => ({
      id: app.id,
      company: app.company,
      role: app.role,
      status: app.status,
      applied_date: app.applied_date,
      interview_date: app.interview_date,
      job_link: app.job_link,
      notes: app.notes
    })) || [];

    // Upcoming interviews
    const upcoming_interviews = applications?.filter(app => 
      app.status === 'interview_scheduled' && 
      app.interview_date && 
      new Date(app.interview_date) > new Date()
    ).map(app => ({
      id: app.id,
      company: app.company,
      role: app.role,
      interview_date: app.interview_date,
      interview_type: app.interview_type || 'Interview',
      meeting_link: app.meeting_link,
      interviewer: app.interviewer,
      preparation_notes: app.notes
    })) || [];

    // Mock sessions (upcoming and recent)
    const mock_sessions = mockSessions?.slice(0, 5).map(session => ({
      id: session.id,
      session_type: session.session_type,
      scheduled_date: session.scheduled_date,
      coach: session.coach,
      status: session.status,
      meeting_link: session.meeting_link,
      focus_areas: JSON.parse(session.focus_areas || '[]')
    })) || [];

    // Sample resources (would come from resources table)
    const resources = [
      {
        id: 1,
        title: "Software Engineering Interview Guide",
        type: "PDF",
        category: "Interview Preparation",
        download_url: "https://cdn.applybureau.com/resources/interview-guide.pdf",
        description: "Comprehensive guide covering technical and behavioral interviews"
      },
      {
        id: 2,
        title: "Resume Template - Software Engineer",
        type: "DOCX",
        category: "Resume Templates",
        download_url: "https://cdn.applybureau.com/templates/resume-software-engineer.docx",
        description: "Professional resume template optimized for software engineering roles"
      }
    ];

    const dashboardData = {
      stats,
      recent_applications,
      upcoming_interviews,
      mock_sessions,
      resources
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get client dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard data',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/client/applications - Get client applications (PROTECTED)
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('applications')
      .select('*')
      .eq('clientId', clientId)
      .order('applied_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.range(offset, offset + parseInt(limit) - 1);
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

    // Format applications to match specification
    const formattedApplications = applications?.map(app => ({
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
      created_at: app.created_at,
      updated_at: app.updated_at
    })) || [];

    res.json({
      success: true,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Get client applications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applications',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/client/mock-sessions - Get client mock sessions (PROTECTED)
router.get('/mock-sessions', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: sessions, error } = await supabaseAdmin
      .from('mock_sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error('Error fetching mock sessions:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch mock sessions',
        code: 'DATABASE_ERROR'
      });
    }

    // Format sessions to match specification
    const formattedSessions = sessions?.map(session => ({
      id: session.id,
      session_type: session.session_type,
      scheduled_date: session.scheduled_date,
      coach: session.coach,
      coach_profile: JSON.parse(session.coach_profile || '{}'),
      status: session.status,
      meeting_link: session.meeting_link,
      focus_areas: JSON.parse(session.focus_areas || '[]'),
      preparation_materials: JSON.parse(session.preparation_materials || '[]'),
      feedback: JSON.parse(session.feedback || '{}'),
      created_at: session.created_at
    })) || [];

    res.json({
      success: true,
      data: formattedSessions
    });
  } catch (error) {
    console.error('Get mock sessions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch mock sessions',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/client/resources - Get available resources (PROTECTED)
router.get('/resources', authenticateToken, async (req, res) => {
  try {
    const { data: resources, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resources:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch resources',
        code: 'DATABASE_ERROR'
      });
    }

    // Format resources to match specification
    const formattedResources = resources?.map(resource => ({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      category: resource.category,
      download_url: resource.download_url,
      description: resource.description,
      file_size: resource.file_size,
      pages: resource.pages,
      created_at: resource.created_at,
      download_count: resource.download_count,
      tags: JSON.parse(resource.tags || '[]')
    })) || [];

    res.json({
      success: true,
      data: formattedResources
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch resources',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;