const Joi = require('joi');

const schemas = {
  // Auth schemas
  invite: Joi.object({
    email: Joi.string().email().required(),
    full_name: Joi.string().min(2).max(100).required()
  }),

  completeRegistration: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().min(2).max(100).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Admin schemas
  inviteClient: Joi.object({
    email: Joi.string().email().required(),
    full_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().max(20).optional(),
    consultation_notes: Joi.string().max(1000).optional()
  }),

  createApplication: Joi.object({
    client_id: Joi.string().uuid().required(),
    job_title: Joi.string().min(2).max(200).required(),
    company: Joi.string().min(2).max(100).required(),
    job_description: Joi.string().max(5000).optional(),
    job_url: Joi.string().uri().optional().allow(''),
    salary_range: Joi.string().max(100).optional(),
    location: Joi.string().max(200).optional(),
    job_type: Joi.string().valid('full-time', 'part-time', 'contract', 'remote').optional(),
    application_method: Joi.string().max(100).optional(),
    application_strategy: Joi.string().max(1000).optional(),
    admin_notes: Joi.string().max(1000).optional()
  }),

  updateApplicationStatus: Joi.object({
    status: Joi.string().valid(
      'applied', 'under_review', 'interview_scheduled', 'interview_completed', 
      'second_round', 'offer_received', 'offer_accepted', 'offer_declined', 
      'rejected', 'withdrawn', 'closed'
    ).required(),
    status_update_reason: Joi.string().max(500).optional(),
    interview_scheduled_at: Joi.date().iso().optional(),
    interview_type: Joi.string().valid('phone', 'video', 'in_person', 'panel').optional(),
    interview_notes: Joi.string().max(1000).optional(),
    offer_salary: Joi.number().positive().optional(),
    offer_benefits: Joi.string().max(1000).optional(),
    offer_deadline: Joi.date().iso().optional()
  }),

  sendMessage: Joi.object({
    client_id: Joi.string().uuid().optional(), // For admin sending to client
    subject: Joi.string().min(1).max(200).required(),
    content: Joi.string().min(1).max(5000).required(),
    application_id: Joi.string().uuid().optional(),
    consultation_id: Joi.string().uuid().optional()
  }),

  scheduleConsultation: Joi.object({
    client_id: Joi.string().uuid().required(),
    scheduled_at: Joi.date().iso().required(),
    consultation_type: Joi.string().valid('initial', 'follow_up', 'strategy', 'interview_prep').optional(),
    admin_notes: Joi.string().max(1000).optional()
  }),

  // Client schemas
  completeOnboarding: Joi.object({
    career_goals: Joi.string().min(10).max(2000).required(),
    job_search_timeline: Joi.string().valid('immediate', '1-3 months', '3-6 months', 'flexible').required(),
    current_challenges: Joi.string().max(1000).optional(),
    previous_applications_count: Joi.number().min(0).optional(),
    referral_source: Joi.string().max(200).optional(),
    target_role: Joi.string().min(2).max(200).required(),
    target_salary_min: Joi.number().positive().optional(),
    target_salary_max: Joi.number().positive().optional(),
    preferred_locations: Joi.array().items(Joi.string().max(100)).optional(),
    current_job_title: Joi.string().max(200).optional(),
    current_company: Joi.string().max(200).optional(),
    years_experience: Joi.number().min(0).max(50).optional(),
    linkedin_url: Joi.string().uri().optional().allow('')
  }),

  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().max(20).optional(),
    linkedin_url: Joi.string().uri().optional().allow(''),
    current_job_title: Joi.string().max(200).optional(),
    current_company: Joi.string().max(200).optional(),
    years_experience: Joi.number().min(0).max(50).optional(),
    target_role: Joi.string().min(2).max(200).optional(),
    target_salary_min: Joi.number().positive().optional(),
    target_salary_max: Joi.number().positive().optional(),
    preferred_locations: Joi.array().items(Joi.string().max(100)).optional(),
    career_goals: Joi.string().max(2000).optional()
  }),

  changePassword: Joi.object({
    current_password: Joi.string().optional(), // Optional for temporary passwords
    new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      })
  }),

  // Public consultation booking (from website)
  consultationBooking: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(20).optional(),
    reason: Joi.string().min(10).max(500).required(),
    preferred_date: Joi.date().iso().required(),
    preferred_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    package_interest: Joi.string().valid('essential', 'professional', 'executive', 'not_sure').required(),
    current_situation: Joi.string().max(500).optional(),
    timeline: Joi.string().valid('immediate', '1-3 months', '3-6 months', 'flexible').required()
  }),

  // Legacy schemas (keeping for backward compatibility)
  consultation: Joi.object({
    client_id: Joi.string().uuid().required(),
    scheduled_at: Joi.date().iso().required(),
    notes: Joi.string().max(1000).optional(),
    admin_notes: Joi.string().max(1000).optional()
  }),

  application: Joi.object({
    client_id: Joi.string().uuid().required(),
    job_title: Joi.string().min(2).max(200).required(),
    company: Joi.string().min(2).max(200).required(),
    job_link: Joi.string().uri().optional(),
    job_url: Joi.string().uri().optional(),
    status: Joi.string().valid('applied', 'interview', 'offer', 'rejected', 'withdrawn').default('applied')
  }),

  updateApplication: Joi.object({
    job_title: Joi.string().min(2).max(200).optional(),
    company: Joi.string().min(2).max(200).optional(),
    job_link: Joi.string().uri().optional(),
    status: Joi.string().valid('applied', 'interview', 'offer', 'rejected', 'withdrawn').optional()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

module.exports = {
  schemas,
  validate
};