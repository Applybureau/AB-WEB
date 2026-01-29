const { supabaseAdmin } = require('../utils/supabase');
const logger = require('../utils/logger');

class ClientProfileController {
  // GET /api/client/profile - Get client profile with completion status
  static async getProfile(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;

      // Get client basic info
      const { data: client, error: clientError } = await supabaseAdmin
        .from('registered_users')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Get consultation request details for additional profile data
      const { data: consultation, error: consultationError } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .eq('user_id', clientId)
        .single();

      // Calculate profile completion percentage
      const profileData = {
        ...client,
        consultation_data: consultation || {}
      };

      const completionStatus = this.calculateProfileCompletion(profileData);

      res.json({
        profile: profileData,
        completion: completionStatus
      });
    } catch (error) {
      logger.error('Get profile error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  // PATCH /api/client/profile - Update client profile
  static async updateProfile(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;
      const {
        full_name,
        phone,
        linkedin_url,
        current_job,
        target_job,
        years_of_experience,
        country,
        user_location,
        age,
        profile_pic_url,
        career_goals,
        preferred_industries,
        minimum_salary,
        target_roles
      } = req.body;

      // Update registered_users table
      const userUpdateData = {};
      if (full_name !== undefined) userUpdateData.full_name = full_name;

      if (Object.keys(userUpdateData).length > 0) {
        await supabaseAdmin
          .from('registered_users')
          .update(userUpdateData)
          .eq('id', clientId);
      }

      // Update consultation_requests table with extended profile data
      const consultationUpdateData = {};
      if (phone !== undefined) consultationUpdateData.phone = phone;
      if (linkedin_url !== undefined) consultationUpdateData.linkedin_url = linkedin_url;
      if (current_job !== undefined) consultationUpdateData.current_job = current_job;
      if (target_job !== undefined) consultationUpdateData.target_job = target_job;
      if (years_of_experience !== undefined) consultationUpdateData.years_of_experience = years_of_experience;
      if (country !== undefined) consultationUpdateData.country = country;
      if (user_location !== undefined) consultationUpdateData.user_location = user_location;
      if (age !== undefined) consultationUpdateData.age = age;
      if (profile_pic_url !== undefined) consultationUpdateData.profile_pic_url = profile_pic_url;

      if (Object.keys(consultationUpdateData).length > 0) {
        await supabaseAdmin
          .from('consultation_requests')
          .update(consultationUpdateData)
          .eq('user_id', clientId);
      }

      // Get updated profile data
      const { data: updatedClient } = await supabaseAdmin
        .from('registered_users')
        .select('*')
        .eq('id', clientId)
        .single();

      const { data: updatedConsultation } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .eq('user_id', clientId)
        .single();

      const profileData = {
        ...updatedClient,
        consultation_data: updatedConsultation || {}
      };

      const completionStatus = this.calculateProfileCompletion(profileData);

      logger.info('Profile updated', { 
        userId: clientId, 
        completion: completionStatus.percentage 
      });

      res.json({
        message: 'Profile updated successfully',
        profile: profileData,
        completion: completionStatus
      });
    } catch (error) {
      logger.error('Update profile error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  // POST /api/client/profile/upload-resume - Upload resume
  static async uploadResume(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;
      const { resume_url, resume_filename } = req.body;

      if (!resume_url) {
        return res.status(400).json({ error: 'Resume URL is required' });
      }

      // Update consultation request with resume info
      const { data: consultation, error } = await supabaseAdmin
        .from('consultation_requests')
        .update({
          pdf_url: resume_url,
          pdf_path: resume_filename || resume_url
        })
        .eq('user_id', clientId)
        .select()
        .single();

      if (error) {
        logger.error('Resume upload error', error, { userId: clientId });
        return res.status(500).json({ error: 'Failed to save resume' });
      }

      logger.info('Resume uploaded', { userId: clientId, resumeUrl: resume_url });

      res.json({
        message: 'Resume uploaded successfully',
        resume_url: consultation.pdf_url
      });
    } catch (error) {
      logger.error('Upload resume error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to upload resume' });
    }
  }

  // GET /api/client/profile/completion - Get profile completion status
  static async getCompletionStatus(req, res) {
    try {
      const clientId = req.user.userId || req.user.id;

      // Get client data
      const { data: client } = await supabaseAdmin
        .from('registered_users')
        .select('*')
        .eq('id', clientId)
        .single();

      const { data: consultation } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .eq('user_id', clientId)
        .single();

      const profileData = {
        ...client,
        consultation_data: consultation || {}
      };

      const completionStatus = this.calculateProfileCompletion(profileData);

      res.json(completionStatus);
    } catch (error) {
      logger.error('Get completion status error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get completion status' });
    }
  }

  // Helper method to calculate profile completion percentage
  static calculateProfileCompletion(profileData) {
    const requiredFields = [
      'full_name',
      'email',
      'consultation_data.phone',
      'consultation_data.linkedin_url',
      'consultation_data.current_job',
      'consultation_data.target_job',
      'consultation_data.years_of_experience',
      'consultation_data.country',
      'consultation_data.user_location',
      'consultation_data.role_targets',
      'consultation_data.location_preferences',
      'consultation_data.minimum_salary',
      'consultation_data.pdf_url'
    ];

    const optionalFields = [
      'consultation_data.age',
      'consultation_data.profile_pic_url',
      'consultation_data.employment_status',
      'consultation_data.target_market'
    ];

    let completedRequired = 0;
    let completedOptional = 0;
    const missingFields = [];

    // Check required fields
    requiredFields.forEach(field => {
      const value = this.getNestedValue(profileData, field);
      if (value && value.toString().trim() !== '') {
        completedRequired++;
      } else {
        missingFields.push(field);
      }
    });

    // Check optional fields
    optionalFields.forEach(field => {
      const value = this.getNestedValue(profileData, field);
      if (value && value.toString().trim() !== '') {
        completedOptional++;
      }
    });

    const requiredPercentage = (completedRequired / requiredFields.length) * 80; // 80% weight for required
    const optionalPercentage = (completedOptional / optionalFields.length) * 20; // 20% weight for optional
    const totalPercentage = Math.round(requiredPercentage + optionalPercentage);

    const isComplete = completedRequired === requiredFields.length;

    return {
      percentage: totalPercentage,
      is_complete: isComplete,
      required_completed: completedRequired,
      required_total: requiredFields.length,
      optional_completed: completedOptional,
      optional_total: optionalFields.length,
      missing_fields: missingFields,
      features_unlocked: {
        application_tracking: totalPercentage >= 40,
        interview_hub: totalPercentage >= 60,
        document_vault: totalPercentage >= 80,
        full_access: isComplete
      }
    };
  }

  // Helper method to get nested object values
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }
}

module.exports = ClientProfileController;