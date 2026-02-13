const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail, buildUrl } = require('../utils/email');
const { upload, uploadToSupabase } = require('../utils/upload');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// Middleware to ensure user is a client
const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Access denied. Client role required.' });
  }
  next();
};

// GET /api/client/onboarding/status - Get onboarding status (CLIENT ONLY)
router.get('/status', authenticateToken, requireClient, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get onboarding data if exists
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Don't fail if no onboarding record exists yet
    const onboardingData = onboardingError ? null : onboarding;

    res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        tier: user.tier,
        onboarding_completed: user.onboarding_completed
      },
      onboarding: onboardingData,
      next_steps: user.onboarding_completed 
        ? 'Schedule your Strategy & Role Alignment Call'
        : 'Complete your onboarding questionnaire'
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

// POST /api/client/onboarding/questionnaire - Submit onboarding questionnaire (CLIENT ONLY)
router.post('/questionnaire', authenticateToken, requireClient, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      // Personal and Professional Background
      current_location,
      willing_to_relocate,
      preferred_locations,
      years_of_experience,
      current_employment_status,
      current_job_title,
      current_company,
      current_salary,
      target_salary_range,
      
      // Career Goals and Preferences
      target_roles,
      target_industries,
      target_company_sizes,
      work_preferences, // remote, hybrid, onsite
      career_goals_short_term,
      career_goals_long_term,
      
      // Skills and Qualifications
      key_skills,
      certifications,
      education_level,
      languages_spoken,
      
      // Job Search Specifics
      job_search_timeline,
      application_volume_preference, // quality_focused, volume_focused, balanced
      networking_comfort_level,
      interview_confidence_level,
      
      // Challenges and Support Needs
      biggest_job_search_challenges,
      areas_needing_support,
      previous_job_search_experience,
      
      // Additional Information
      additional_comments,
      special_circumstances,
      availability_for_calls,
      preferred_communication_method
    } = req.body;

    // Validate required fields
    if (!target_roles || !target_industries || !job_search_timeline) {
      return res.status(400).json({ 
        error: 'Missing required fields: target_roles, target_industries, job_search_timeline' 
      });
    }

    // Create or update onboarding record
    const onboardingData = {
      user_id: userId,
      // Personal and Professional Background
      current_location,
      willing_to_relocate: willing_to_relocate || false,
      preferred_locations: Array.isArray(preferred_locations) ? preferred_locations : [],
      years_of_experience: parseInt(years_of_experience) || 0,
      current_employment_status,
      current_job_title,
      current_company,
      current_salary: parseFloat(current_salary) || null,
      target_salary_range,
      
      // Career Goals and Preferences
      target_roles: Array.isArray(target_roles) ? target_roles : [target_roles],
      target_industries: Array.isArray(target_industries) ? target_industries : [target_industries],
      target_company_sizes: Array.isArray(target_company_sizes) ? target_company_sizes : [],
      work_preferences: Array.isArray(work_preferences) ? work_preferences : [work_preferences],
      career_goals_short_term,
      career_goals_long_term,
      
      // Skills and Qualifications
      key_skills: Array.isArray(key_skills) ? key_skills : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      education_level,
      languages_spoken: Array.isArray(languages_spoken) ? languages_spoken : [],
      
      // Job Search Specifics
      job_search_timeline,
      application_volume_preference: application_volume_preference || 'balanced',
      networking_comfort_level: parseInt(networking_comfort_level) || 5,
      interview_confidence_level: parseInt(interview_confidence_level) || 5,
      
      // Challenges and Support Needs
      biggest_job_search_challenges: Array.isArray(biggest_job_search_challenges) ? biggest_job_search_challenges : [],
      areas_needing_support: Array.isArray(areas_needing_support) ? areas_needing_support : [],
      previous_job_search_experience,
      
      // Additional Information
      additional_comments,
      special_circumstances,
      availability_for_calls: Array.isArray(availability_for_calls) ? availability_for_calls : [],
      preferred_communication_method: preferred_communication_method || 'email',
      
      completed_at: new Date().toISOString()
    };

    // Insert or update onboarding data
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding')
      .upsert(onboardingData, { onConflict: 'user_id' })
      .select()
      .single();

    if (onboardingError) {
      console.error('Error saving onboarding data:', onboardingError);
      return res.status(500).json({ error: 'Failed to save onboarding questionnaire' });
    }

    // Update user as onboarding completed
    const { error: userUpdateError } = await supabaseAdmin
      .from('registered_users')
      .update({ 
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error updating user onboarding status:', userUpdateError);
    }

    // Update consultation workflow stage
    const { error: consultationUpdateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({ 
        workflow_stage: 'onboarding_completed_awaiting_strategy_call'
      })
      .eq('user_id', userId);

    if (consultationUpdateError) {
      console.error('Error updating consultation workflow stage:', consultationUpdateError);
    }

    // Send completion email to client
    try {
      await sendEmail(req.user.email, 'onboarding_completed', {
        client_name: req.user.full_name || 'Client',
        target_roles: Array.isArray(target_roles) ? target_roles.join(', ') : target_roles,
        target_industries: Array.isArray(target_industries) ? target_industries.join(', ') : target_industries,
        job_search_timeline,
        next_steps: 'You can now schedule your Strategy & Role Alignment Call from your dashboard.',
        strategy_call_url: buildUrl('/client/schedule-strategy-call'),
        dashboard_url: buildUrl('/client/dashboard')
      });
    } catch (emailError) {
      console.error('Failed to send onboarding completion email:', emailError);
    }

    // Notify admin of completed onboarding
    try {
      await NotificationHelpers.clientOnboardingCompleted(userId, onboarding);
    } catch (notificationError) {
      console.error('Failed to create onboarding completion notification:', notificationError);
    }

    res.status(201).json({
      message: 'Onboarding questionnaire completed successfully',
      onboarding,
      next_steps: 'You can now schedule your Strategy & Role Alignment Call',
      strategy_call_available: true
    });
  } catch (error) {
    console.error('Submit onboarding questionnaire error:', error);
    res.status(500).json({ error: 'Failed to submit onboarding questionnaire' });
  }
});

// POST /api/client/onboarding/documents - Upload documents (CLIENT ONLY)
router.post('/documents', authenticateToken, requireClient, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'cover_letter', maxCount: 1 },
  { name: 'portfolio', maxCount: 3 }
]), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const uploadedFiles = {};

    // Handle resume upload
    if (req.files.resume && req.files.resume[0]) {
      try {
        const fileName = `client_${userId}_resume_${Date.now()}.pdf`;
        const uploadResult = await uploadToSupabase(req.files.resume[0], 'resumes', fileName);
        uploadedFiles.resume = {
          url: uploadResult.url,
          path: uploadResult.path,
          filename: fileName,
          size: req.files.resume[0].size
        };
      } catch (uploadError) {
        console.error('Resume upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload resume' });
      }
    }

    // Handle cover letter upload
    if (req.files.cover_letter && req.files.cover_letter[0]) {
      try {
        const fileName = `client_${userId}_cover_letter_${Date.now()}.pdf`;
        const uploadResult = await uploadToSupabase(req.files.cover_letter[0], 'documents', fileName);
        uploadedFiles.cover_letter = {
          url: uploadResult.url,
          path: uploadResult.path,
          filename: fileName,
          size: req.files.cover_letter[0].size
        };
      } catch (uploadError) {
        console.error('Cover letter upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload cover letter' });
      }
    }

    // Handle portfolio uploads
    if (req.files.portfolio && req.files.portfolio.length > 0) {
      uploadedFiles.portfolio = [];
      for (let i = 0; i < req.files.portfolio.length; i++) {
        try {
          const file = req.files.portfolio[i];
          const fileName = `client_${userId}_portfolio_${i + 1}_${Date.now()}.${file.originalname.split('.').pop()}`;
          const uploadResult = await uploadToSupabase(file, 'documents', fileName);
          uploadedFiles.portfolio.push({
            url: uploadResult.url,
            path: uploadResult.path,
            filename: fileName,
            size: file.size,
            original_name: file.originalname
          });
        } catch (uploadError) {
          console.error(`Portfolio file ${i + 1} upload error:`, uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    // Update user record with document URLs
    const updateData = {};
    if (uploadedFiles.resume) {
      updateData.resume_url = uploadedFiles.resume.url;
      updateData.resume_path = uploadedFiles.resume.path;
    }
    if (uploadedFiles.cover_letter) {
      updateData.cover_letter_url = uploadedFiles.cover_letter.url;
      updateData.cover_letter_path = uploadedFiles.cover_letter.path;
    }
    if (uploadedFiles.portfolio && uploadedFiles.portfolio.length > 0) {
      updateData.portfolio_urls = uploadedFiles.portfolio.map(p => p.url);
      updateData.portfolio_paths = uploadedFiles.portfolio.map(p => p.path);
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('registered_users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user documents:', updateError);
        return res.status(500).json({ error: 'Failed to save document references' });
      }
    }

    // Create file upload notifications
    try {
      if (uploadedFiles.resume) {
        await NotificationHelpers.fileUploaded(userId, 'Resume', 'resume');
      }
      if (uploadedFiles.cover_letter) {
        await NotificationHelpers.fileUploaded(userId, 'Cover Letter', 'cover_letter');
      }
      if (uploadedFiles.portfolio && uploadedFiles.portfolio.length > 0) {
        await NotificationHelpers.fileUploaded(userId, `Portfolio (${uploadedFiles.portfolio.length} files)`, 'portfolio');
      }
    } catch (notificationError) {
      console.error('Failed to create file upload notifications:', notificationError);
    }

    res.json({
      message: 'Documents uploaded successfully',
      uploaded_files: uploadedFiles,
      file_count: Object.keys(uploadedFiles).length
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// POST /api/client/onboarding/job-search-email - Provide job search email credentials (CLIENT ONLY)
router.post('/job-search-email', authenticateToken, requireClient, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { job_search_email, job_search_password } = req.body;

    if (!job_search_email || !job_search_password) {
      return res.status(400).json({ 
        error: 'Job search email and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(job_search_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Encrypt password (basic encryption - in production use proper encryption)
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(job_search_password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        job_search_email,
        job_search_password_encrypted: encrypted,
        job_search_email_provided_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error saving job search email:', updateError);
      return res.status(500).json({ error: 'Failed to save job search email credentials' });
    }

    // Create notification
    try {
      await NotificationHelpers.jobSearchEmailProvided(userId, job_search_email);
    } catch (notificationError) {
      console.error('Failed to create job search email notification:', notificationError);
    }

    res.json({
      message: 'Job search email credentials saved securely',
      job_search_email,
      next_steps: 'Your credentials are securely stored and will be used for job application tracking'
    });
  } catch (error) {
    console.error('Job search email error:', error);
    res.status(500).json({ error: 'Failed to save job search email credentials' });
  }
});

module.exports = router;