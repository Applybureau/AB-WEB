const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireClient } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const ClientProfileController = require('../controllers/clientProfileController');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Resume must be a PDF file'), false);
      }
    } else if (file.fieldname === 'profile_picture') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Profile picture must be an image file'), false);
      }
    } else {
      cb(new Error('Invalid file field'), false);
    }
  }
});

// ========================================
// DASHBOARD OVERVIEW
// ========================================

// GET /api/client-dashboard - Complete dashboard overview
router.get('/', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get client profile
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get strategy call status
    const { data: strategyCalls } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    const latestStrategyCall = strategyCalls?.[0] || null;
    const hasConfirmedStrategyCall = strategyCalls?.some(call => call.admin_status === 'confirmed') || false;

    // Get onboarding status
    const { data: onboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', clientId)
      .single();

    const hasCompletedOnboarding = onboarding?.completed_at !== null;
    const onboardingApproved = onboarding?.execution_status === 'active';

    // Get applications count
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id, status, company, position, date_applied, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    const applicationsCount = applications?.length || 0;
    const activeApplications = applications?.filter(app => 
      ['applied', 'in_review', 'interview_requested', 'interview_completed'].includes(app.status)
    ).length || 0;

    // Get recent notifications
    const { data: notifications } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', clientId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    // Calculate progress and determine status
    const progress = calculateClientProgress({
      hasConfirmedStrategyCall,
      hasCompletedOnboarding,
      onboardingApproved,
      hasResume: client.resume_url !== null,
      hasLinkedIn: client.linkedin_url !== null
    });

    // Determine next steps
    const nextSteps = generateNextSteps({
      latestStrategyCall,
      hasConfirmedStrategyCall,
      hasCompletedOnboarding,
      onboardingApproved,
      client
    });

    res.json({
      client: {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        profile_picture_url: client.profile_picture_url,
        onboarding_complete: client.onboarding_complete,
        profile_unlocked: client.profile_unlocked,
        status: client.status
      },
      progress: progress,
      strategy_call: {
        has_booked: latestStrategyCall !== null,
        has_confirmed: hasConfirmedStrategyCall,
        latest_status: latestStrategyCall?.admin_status || null,
        confirmed_time: latestStrategyCall?.confirmed_time || null,
        meeting_link: latestStrategyCall?.meeting_link || null,
        can_book_new: !latestStrategyCall || latestStrategyCall.admin_status === 'completed'
      },
      onboarding: {
        completed: hasCompletedOnboarding,
        approved: onboardingApproved,
        execution_status: onboarding?.execution_status || 'not_started',
        completed_at: onboarding?.completed_at || null,
        can_start: hasConfirmedStrategyCall && !hasCompletedOnboarding
      },
      applications: {
        total_count: applicationsCount,
        active_count: activeApplications,
        recent_applications: applications?.slice(0, 5) || [],
        can_view: onboardingApproved
      },
      files: {
        resume_uploaded: client.resume_url !== null,
        linkedin_added: client.linkedin_url !== null,
        portfolio_added: client.portfolio_url !== null,
        resume_url: client.resume_url,
        linkedin_url: client.linkedin_url,
        portfolio_url: client.portfolio_url
      },
      notifications: {
        unread_count: notifications?.length || 0,
        recent_notifications: notifications || []
      },
      next_steps: nextSteps
    });
  } catch (error) {
    console.error('Client dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ========================================
// PROFILE MANAGEMENT
// ========================================

// GET /api/client-dashboard/profile - Get complete profile
router.get('/profile', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return res.status(404).json({ error: 'Client profile not found' });
    }

    // Calculate profile completion
    const completion = calculateProfileCompletion(client);

    res.json({
      profile: client,
      completion: completion
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PATCH /api/client-dashboard/profile - Update profile
router.patch('/profile', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated by client
    delete updateData.id;
    delete updateData.email;
    delete updateData.password;
    delete updateData.role;
    delete updateData.status;
    delete updateData.created_at;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: updatedClient, error } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    const completion = calculateProfileCompletion(updatedClient);

    res.json({
      message: 'Profile updated successfully',
      profile: updatedClient,
      completion: completion
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ========================================
// FILE UPLOADS
// ========================================

// POST /api/client-dashboard/upload/resume - Upload resume
router.post('/upload/resume', authenticateToken, requireClient, upload.single('resume'), async (req, res) => {
  try {
    const clientId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No resume file provided' });
    }

    // Upload to Supabase Storage
    const fileName = `resume-${clientId}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('client-documents')
      .upload(`resumes/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Resume upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload resume' });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('client-documents')
      .getPublicUrl(`resumes/${fileName}`);

    const resumeUrl = urlData.publicUrl;

    // Update client record
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        resume_url: resumeUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('Update client resume error:', updateError);
      return res.status(500).json({ error: 'Failed to save resume URL' });
    }

    res.json({
      message: 'Resume uploaded successfully',
      resume_url: resumeUrl,
      file_name: fileName
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// POST /api/client-dashboard/upload/profile-picture - Upload profile picture
router.post('/upload/profile-picture', authenticateToken, requireClient, upload.single('profile_picture'), async (req, res) => {
  try {
    const clientId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No profile picture provided' });
    }

    // Upload to Supabase Storage
    const fileName = `profile-${clientId}-${Date.now()}.${req.file.originalname.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('client-documents')
      .upload(`profile-pictures/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Profile picture upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload profile picture' });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('client-documents')
      .getPublicUrl(`profile-pictures/${fileName}`);

    const profilePictureUrl = urlData.publicUrl;

    // Update client record
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        profile_picture_url: profilePictureUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('Update client profile picture error:', updateError);
      return res.status(500).json({ error: 'Failed to save profile picture URL' });
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      profile_picture_url: profilePictureUrl,
      file_name: fileName
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// ========================================
// SCHEDULING SYSTEM
// ========================================

// POST /api/client-dashboard/schedule/strategy-call - Book strategy call
router.post('/schedule/strategy-call', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { preferred_slots, message } = req.body;

    if (!preferred_slots || !Array.isArray(preferred_slots) || preferred_slots.length === 0) {
      return res.status(400).json({ error: 'Please provide preferred time slots' });
    }

    // Get client details
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', clientId)
      .single();

    // Create strategy call request
    const { data: strategyCall, error } = await supabaseAdmin
      .from('strategy_calls')
      .insert({
        client_id: clientId,
        client_name: client.full_name,
        client_email: client.email,
        preferred_slots: preferred_slots,
        message: message || null,
        status: 'pending',
        admin_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating strategy call:', error);
      return res.status(500).json({ error: 'Failed to book strategy call' });
    }

    // Send confirmation emails
    try {
      await sendEmail(client.email, 'strategy_call_requested', {
        client_name: client.full_name,
        preferred_slots: preferred_slots,
        message: message || 'No additional message'
      });

      await sendEmail('admin@applybureau.com', 'new_strategy_call_request', {
        client_name: client.full_name,
        client_email: client.email,
        preferred_slots: preferred_slots,
        client_message: message || 'No message provided'
      });
    } catch (emailError) {
      console.error('Failed to send strategy call emails:', emailError);
    }

    res.status(201).json({
      message: 'Strategy call booked successfully',
      strategy_call: strategyCall
    });
  } catch (error) {
    console.error('Book strategy call error:', error);
    res.status(500).json({ error: 'Failed to book strategy call' });
  }
});

// GET /api/client-dashboard/schedule/strategy-calls - Get strategy call history
router.get('/schedule/strategy-calls', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: strategyCalls, error } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching strategy calls:', error);
      return res.status(500).json({ error: 'Failed to fetch strategy calls' });
    }

    res.json({
      strategy_calls: strategyCalls || [],
      total: strategyCalls?.length || 0
    });
  } catch (error) {
    console.error('Get strategy calls error:', error);
    res.status(500).json({ error: 'Failed to get strategy calls' });
  }
});

// ========================================
// 20-QUESTION ONBOARDING
// ========================================

// GET /api/client-dashboard/onboarding/questions - Get onboarding questions
router.get('/onboarding/questions', authenticateToken, requireClient, async (req, res) => {
  try {
    const questions = [
      // Role Targeting (Questions 1-5)
      {
        id: 1,
        category: 'Role Targeting',
        question: 'What job titles are you targeting?',
        field: 'target_job_titles',
        type: 'multi_select',
        required: true,
        options: [
          'Software Engineer', 'Senior Software Engineer', 'Lead Software Engineer',
          'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
          'DevOps Engineer', 'Data Scientist', 'Product Manager',
          'Engineering Manager', 'Technical Lead', 'Solutions Architect'
        ]
      },
      {
        id: 2,
        category: 'Role Targeting',
        question: 'Which industries interest you most?',
        field: 'target_industries',
        type: 'multi_select',
        required: true,
        options: [
          'Technology', 'Finance', 'Healthcare', 'E-commerce',
          'Education', 'Media & Entertainment', 'Government',
          'Consulting', 'Manufacturing', 'Real Estate'
        ]
      },
      {
        id: 3,
        category: 'Role Targeting',
        question: 'What company sizes do you prefer?',
        field: 'target_company_sizes',
        type: 'multi_select',
        required: false,
        options: [
          'Startup (1-50 employees)',
          'Small (51-200 employees)',
          'Medium (201-1000 employees)',
          'Large (1001-5000 employees)',
          'Enterprise (5000+ employees)'
        ]
      },
      {
        id: 4,
        category: 'Role Targeting',
        question: 'What are your preferred work locations?',
        field: 'target_locations',
        type: 'multi_select',
        required: true,
        options: [
          'New York, NY', 'San Francisco, CA', 'Los Angeles, CA',
          'Seattle, WA', 'Austin, TX', 'Chicago, IL',
          'Boston, MA', 'Denver, CO', 'Remote', 'Flexible'
        ]
      },
      {
        id: 5,
        category: 'Role Targeting',
        question: 'What is your remote work preference?',
        field: 'remote_work_preference',
        type: 'single_select',
        required: true,
        options: ['Remote only', 'Hybrid', 'On-site only', 'Flexible']
      },

      // Compensation (Questions 6-8)
      {
        id: 6,
        category: 'Compensation',
        question: 'What is your current salary range?',
        field: 'current_salary_range',
        type: 'text',
        required: false,
        placeholder: 'e.g., $80,000 - $100,000'
      },
      {
        id: 7,
        category: 'Compensation',
        question: 'What is your target salary range?',
        field: 'target_salary_range',
        type: 'text',
        required: true,
        placeholder: 'e.g., $100,000 - $130,000'
      },
      {
        id: 8,
        category: 'Compensation',
        question: 'How comfortable are you with salary negotiation? (1-10)',
        field: 'salary_negotiation_comfort',
        type: 'number',
        required: false,
        min: 1,
        max: 10
      },

      // Experience & Skills (Questions 9-12)
      {
        id: 9,
        category: 'Experience & Skills',
        question: 'How many years of professional experience do you have?',
        field: 'years_of_experience',
        type: 'number',
        required: true,
        min: 0,
        max: 50
      },
      {
        id: 10,
        category: 'Experience & Skills',
        question: 'What are your key technical skills?',
        field: 'key_technical_skills',
        type: 'multi_select',
        required: true,
        options: [
          'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
          'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Git',
          'Machine Learning', 'Data Analysis', 'Project Management'
        ]
      },
      {
        id: 11,
        category: 'Experience & Skills',
        question: 'What are your strongest soft skills?',
        field: 'soft_skills_strengths',
        type: 'multi_select',
        required: false,
        options: [
          'Leadership', 'Communication', 'Problem Solving',
          'Team Collaboration', 'Time Management', 'Adaptability',
          'Critical Thinking', 'Creativity', 'Mentoring'
        ]
      },
      {
        id: 12,
        category: 'Experience & Skills',
        question: 'Do you have any relevant certifications or licenses?',
        field: 'certifications_licenses',
        type: 'textarea',
        required: false,
        placeholder: 'List any relevant certifications, licenses, or courses'
      },

      // Job Search Strategy (Questions 13-16)
      {
        id: 13,
        category: 'Job Search Strategy',
        question: 'What is your job search timeline?',
        field: 'job_search_timeline',
        type: 'single_select',
        required: true,
        options: [
          'Immediately (0-1 month)',
          'Soon (1-3 months)',
          'Moderate (3-6 months)',
          'Flexible (6+ months)'
        ]
      },
      {
        id: 14,
        category: 'Job Search Strategy',
        question: 'Do you prefer quality-focused or volume-focused applications?',
        field: 'application_volume_preference',
        type: 'single_select',
        required: false,
        options: [
          'Quality focused (fewer, targeted applications)',
          'Volume focused (more applications)',
          'Balanced approach'
        ]
      },
      {
        id: 15,
        category: 'Job Search Strategy',
        question: 'How comfortable are you with networking? (1-10)',
        field: 'networking_comfort_level',
        type: 'number',
        required: false,
        min: 1,
        max: 10
      },
      {
        id: 16,
        category: 'Job Search Strategy',
        question: 'How confident are you in interviews? (1-10)',
        field: 'interview_confidence_level',
        type: 'number',
        required: false,
        min: 1,
        max: 10
      },

      // Career Goals & Challenges (Questions 17-20)
      {
        id: 17,
        category: 'Career Goals',
        question: 'What are your short-term career goals (1-2 years)?',
        field: 'career_goals_short_term',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your career objectives for the next 1-2 years'
      },
      {
        id: 18,
        category: 'Career Goals',
        question: 'What are your long-term career goals (3-5 years)?',
        field: 'career_goals_long_term',
        type: 'textarea',
        required: false,
        placeholder: 'Describe your career vision for the next 3-5 years'
      },
      {
        id: 19,
        category: 'Career Challenges',
        question: 'What are your biggest career challenges right now?',
        field: 'biggest_career_challenges',
        type: 'multi_select',
        required: true,
        options: [
          'Finding the right opportunities',
          'Getting interview callbacks',
          'Salary negotiation',
          'Career direction uncertainty',
          'Skill development',
          'Work-life balance',
          'Industry transition',
          'Leadership development'
        ]
      },
      {
        id: 20,
        category: 'Support Areas',
        question: 'What areas would you like the most support with?',
        field: 'support_areas_needed',
        type: 'multi_select',
        required: true,
        options: [
          'Resume optimization',
          'Interview preparation',
          'Job search strategy',
          'Salary negotiation',
          'LinkedIn optimization',
          'Portfolio development',
          'Networking guidance',
          'Career coaching'
        ]
      }
    ];

    res.json({
      questions: questions,
      total_questions: questions.length
    });
  } catch (error) {
    console.error('Get onboarding questions error:', error);
    res.status(500).json({ error: 'Failed to get onboarding questions' });
  }
});

// POST /api/client-dashboard/onboarding/submit - Submit onboarding questionnaire
router.post('/onboarding/submit', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const answers = req.body;

    // Validate required fields
    const requiredFields = [
      'target_job_titles', 'target_industries', 'target_locations',
      'target_salary_range', 'years_of_experience', 'key_technical_skills',
      'job_search_timeline', 'career_goals_short_term',
      'biggest_career_challenges', 'support_areas_needed'
    ];

    const missingFields = requiredFields.filter(field => !answers[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Create onboarding record
    const onboardingData = {
      user_id: clientId,
      ...answers,
      execution_status: 'pending_approval',
      completed_at: new Date().toISOString()
    };

    const { data: onboarding, error } = await supabaseAdmin
      .from('client_onboarding_20q')
      .upsert(onboardingData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving onboarding:', error);
      return res.status(500).json({ error: 'Failed to save onboarding questionnaire' });
    }

    // Update client onboarding status
    await supabaseAdmin
      .from('clients')
      .update({
        onboarding_complete: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    // Send confirmation emails
    try {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('email, full_name')
        .eq('id', clientId)
        .single();

      await sendEmail(client.email, 'onboarding_completed', {
        client_name: client.full_name,
        next_steps: 'Your onboarding questionnaire is under review. You will be notified when approved.'
      });

      await sendEmail('admin@applybureau.com', 'onboarding_needs_approval', {
        client_name: client.full_name,
        client_email: client.email,
        onboarding_id: onboarding.id
      });
    } catch (emailError) {
      console.error('Failed to send onboarding emails:', emailError);
    }

    res.status(201).json({
      message: 'Onboarding questionnaire submitted successfully',
      onboarding: {
        id: onboarding.id,
        execution_status: onboarding.execution_status,
        completed_at: onboarding.completed_at
      },
      next_steps: 'Your onboarding is under review. You will be notified when approved.'
    });
  } catch (error) {
    console.error('Submit onboarding error:', error);
    res.status(500).json({ error: 'Failed to submit onboarding questionnaire' });
  }
});

// GET /api/client-dashboard/onboarding/status - Get onboarding status
router.get('/onboarding/status', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: onboarding, error } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching onboarding status:', error);
      return res.status(500).json({ error: 'Failed to fetch onboarding status' });
    }

    res.json({
      onboarding: onboarding || null,
      completed: onboarding?.completed_at !== null,
      approved: onboarding?.execution_status === 'active',
      can_start: true // Can always start/restart onboarding
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

// ========================================
// APPLICATION TRACKING
// ========================================

// GET /api/client-dashboard/applications - Get client applications
router.get('/applications', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('applications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    // Get status counts
    const { data: statusCounts } = await supabaseAdmin
      .from('applications')
      .select('status')
      .eq('client_id', clientId);

    const counts = statusCounts?.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      applications: applications || [],
      total: applications?.length || 0,
      status_counts: counts,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// ========================================
// NOTIFICATIONS
// ========================================

// GET /api/client-dashboard/notifications - Get client notifications
router.get('/notifications', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { is_read, limit = 20, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Get unread count
    const { data: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', clientId)
      .eq('is_read', false);

    res.json({
      notifications: notifications || [],
      total: notifications?.length || 0,
      unread_count: unreadCount?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// PATCH /api/client-dashboard/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { id } = req.params;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }

    res.json({
      message: 'Notification marked as read',
      notification: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function calculateClientProgress({ hasConfirmedStrategyCall, hasCompletedOnboarding, onboardingApproved, hasResume, hasLinkedIn }) {
  let progress = 0;
  let status = 'getting_started';
  let message = 'Welcome! Let\'s get your job search started.';

  // Strategy call (30%)
  if (hasConfirmedStrategyCall) {
    progress += 30;
    status = 'strategy_call_completed';
    message = 'Strategy call completed. Time to fill out your onboarding questionnaire.';
  }

  // Onboarding completion (40%)
  if (hasCompletedOnboarding) {
    progress += 40;
    status = 'onboarding_completed';
    message = 'Onboarding submitted. Waiting for approval.';
  }

  // Onboarding approval (20%)
  if (onboardingApproved) {
    progress += 20;
    status = 'active';
    message = 'Profile approved! Applications are being processed.';
  }

  // Optional enhancements (10%)
  if (hasResume) progress += 5;
  if (hasLinkedIn) progress += 5;

  return {
    percentage: Math.min(progress, 100),
    status: status,
    message: message
  };
}

function generateNextSteps({ latestStrategyCall, hasConfirmedStrategyCall, hasCompletedOnboarding, onboardingApproved, client }) {
  const steps = [];

  if (!latestStrategyCall) {
    steps.push({
      id: 'book_strategy_call',
      title: 'Book Your Strategy Call',
      description: 'Schedule a call to align your goals and application strategy.',
      priority: 1,
      required: true,
      action: 'book_strategy_call'
    });
  } else if (latestStrategyCall.admin_status === 'pending') {
    steps.push({
      id: 'wait_strategy_confirmation',
      title: 'Strategy Call Confirmation Pending',
      description: 'A strategist is reviewing your request.',
      priority: 1,
      required: false,
      action: 'wait'
    });
  }

  if (hasConfirmedStrategyCall && !hasCompletedOnboarding) {
    steps.push({
      id: 'complete_onboarding',
      title: 'Complete 20-Question Onboarding',
      description: 'Fill out the detailed questionnaire to personalize your job search.',
      priority: 1,
      required: true,
      action: 'complete_onboarding'
    });
  }

  if (hasCompletedOnboarding && !onboardingApproved) {
    steps.push({
      id: 'wait_approval',
      title: 'Onboarding Under Review',
      description: 'Our team is reviewing your information.',
      priority: 1,
      required: false,
      action: 'wait'
    });
  }

  // Optional steps
  if (!client.resume_url) {
    steps.push({
      id: 'upload_resume',
      title: 'Upload Resume (Optional)',
      description: 'Upload your current resume or we\'ll help you build one.',
      priority: 2,
      required: false,
      action: 'upload_resume'
    });
  }

  if (!client.linkedin_url) {
    steps.push({
      id: 'add_linkedin',
      title: 'Add LinkedIn Profile (Optional)',
      description: 'Connect your LinkedIn for better job targeting.',
      priority: 3,
      required: false,
      action: 'add_linkedin'
    });
  }

  if (onboardingApproved) {
    steps.push({
      id: 'view_applications',
      title: 'Track Your Applications',
      description: 'Monitor your job applications and their progress.',
      priority: 1,
      required: false,
      action: 'view_applications'
    });
  }

  return steps.sort((a, b) => a.priority - b.priority);
}

function calculateProfileCompletion(client) {
  const requiredFields = [
    'full_name', 'email', 'phone', 'current_job_title',
    'target_role', 'years_experience', 'linkedin_url'
  ];

  const optionalFields = [
    'profile_picture_url', 'resume_url', 'portfolio_url',
    'current_company', 'preferred_locations'
  ];

  let completedRequired = 0;
  let completedOptional = 0;

  requiredFields.forEach(field => {
    if (client[field] && client[field].toString().trim() !== '') {
      completedRequired++;
    }
  });

  optionalFields.forEach(field => {
    if (client[field] && client[field].toString().trim() !== '') {
      completedOptional++;
    }
  });

  const requiredPercentage = (completedRequired / requiredFields.length) * 80;
  const optionalPercentage = (completedOptional / optionalFields.length) * 20;
  const totalPercentage = Math.round(requiredPercentage + optionalPercentage);

  return {
    percentage: totalPercentage,
    is_complete: completedRequired === requiredFields.length,
    required_completed: completedRequired,
    required_total: requiredFields.length,
    optional_completed: completedOptional,
    optional_total: optionalFields.length
  };
}

module.exports = router;