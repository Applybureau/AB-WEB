const { z } = require('zod');

// Zero-Trust Input Validation Schemas using Zod
// Strict type enforcement with sanitization (strips unknown properties)

// 20-Question Onboarding Schema - Zero-Trust Validation
const onboarding20QSchema = z.object({
  // Role Targeting (Questions 1-5)
  target_job_titles: z.array(z.string().min(2).max(100).trim())
    .min(1, "At least one target job title is required")
    .max(5, "Maximum 5 target job titles allowed"),
  
  target_industries: z.array(z.string().min(2).max(100).trim())
    .min(1, "At least one target industry is required")
    .max(5, "Maximum 5 target industries allowed"),
  
  target_company_sizes: z.array(z.enum(['startup', 'small', 'medium', 'large', 'enterprise']))
    .optional()
    .default([]),
  
  target_locations: z.array(z.string().min(2).max(100).trim())
    .min(1, "At least one target location is required")
    .max(10, "Maximum 10 target locations allowed"),
  
  remote_work_preference: z.enum(['remote', 'hybrid', 'onsite', 'flexible'])
    .default('hybrid'),

  // Compensation Guardrails (Questions 6-8)
  current_salary_range: z.string().min(5).max(50).trim()
    .regex(/^\$?\d{1,3}(,?\d{3})*\s*-\s*\$?\d{1,3}(,?\d{3})*$/, "Invalid salary range format"),
  
  target_salary_range: z.string().min(5).max(50).trim()
    .regex(/^\$?\d{1,3}(,?\d{3})*\s*-\s*\$?\d{1,3}(,?\d{3})*$/, "Invalid salary range format"),
  
  salary_negotiation_comfort: z.number().int().min(1).max(10)
    .default(5),

  // Experience & Skills (Questions 9-12)
  years_of_experience: z.number().int().min(0).max(50),
  
  key_technical_skills: z.array(z.string().min(2).max(100).trim())
    .min(1, "At least one technical skill is required")
    .max(20, "Maximum 20 technical skills allowed"),
  
  soft_skills_strengths: z.array(z.string().min(2).max(100).trim())
    .max(10, "Maximum 10 soft skills allowed")
    .optional()
    .default([]),
  
  certifications_licenses: z.array(z.string().min(2).max(200).trim())
    .max(10, "Maximum 10 certifications allowed")
    .optional()
    .default([]),

  // Job Search Strategy (Questions 13-16)
  job_search_timeline: z.enum(['immediate', '1-3_months', '3-6_months', '6-12_months', 'flexible'])
    .default('3-6_months'),
  
  application_volume_preference: z.enum(['quality_focused', 'volume_focused', 'balanced'])
    .default('quality_focused'),
  
  networking_comfort_level: z.number().int().min(1).max(10)
    .default(5),
  
  interview_confidence_level: z.number().int().min(1).max(10)
    .default(5),

  // Career Goals & Challenges (Questions 17-20)
  career_goals_short_term: z.string().min(10).max(1000).trim(),
  
  career_goals_long_term: z.string().min(10).max(1000).trim()
    .optional(),
  
  biggest_career_challenges: z.array(z.string().min(5).max(200).trim())
    .min(1, "At least one career challenge is required")
    .max(5, "Maximum 5 career challenges allowed"),
  
  support_areas_needed: z.array(z.string().min(5).max(200).trim())
    .min(1, "At least one support area is required")
    .max(10, "Maximum 10 support areas allowed")
}).strict(); // Strict mode strips unknown properties for security

// Authentication Schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters")
}).strict();

const inviteSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  full_name: z.string().min(2).max(100).trim()
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
}).strict();

const completeRegistrationSchema = z.object({
  token: z.string().min(10, "Invalid token"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           "Password must contain uppercase, lowercase, number, and special character"),
  full_name: z.string().min(2).max(100).trim()
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .optional()
}).strict();

// Application Tracking Schemas
const createApplicationSchema = z.object({
  client_id: z.string().uuid("Invalid client ID"),
  job_title: z.string().min(2).max(200).trim(),
  company: z.string().min(2).max(100).trim(),
  job_description: z.string().max(5000).trim().optional(),
  job_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  salary_range: z.string().max(100).trim().optional(),
  location: z.string().max(200).trim().optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'remote']).optional(),
  application_method: z.string().max(100).trim().optional(),
  application_strategy: z.string().max(1000).trim().optional(),
  admin_notes: z.string().max(1000).trim().optional()
}).strict();

const updateApplicationStatusSchema = z.object({
  status: z.enum([
    'applied', 'under_review', 'interview_scheduled', 'interview_completed', 
    'second_round', 'offer_received', 'offer_accepted', 'offer_declined', 
    'rejected', 'withdrawn', 'closed'
  ]),
  status_update_reason: z.string().max(500).trim().optional(),
  interview_scheduled_at: z.string().datetime().optional(),
  interview_type: z.enum(['phone', 'video', 'in_person', 'panel']).optional(),
  interview_notes: z.string().max(1000).trim().optional(),
  offer_salary: z.number().positive().optional(),
  offer_benefits: z.string().max(1000).trim().optional(),
  offer_deadline: z.string().datetime().optional()
}).strict();

// Contact and Consultation Schemas
const consultationBookingSchema = z.object({
  name: z.string().min(2).max(100).trim()
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  phone: z.string().max(20).trim().optional(),
  reason: z.string().min(10).max(500).trim(),
  preferred_date: z.string().datetime("Invalid date format"),
  preferred_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  package_interest: z.enum(['essential', 'professional', 'executive', 'not_sure']),
  current_situation: z.string().max(500).trim().optional(),
  timeline: z.enum(['immediate', '1-3_months', '3-6_months', 'flexible'])
}).strict();

// Validation middleware factory
const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      // Parse and validate request body, stripping unknown properties
      const validatedData = schema.parse(req.body);
      
      // Replace request body with validated and sanitized data
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errorMessages,
          type: 'VALIDATION_ERROR'
        });
      }
      
      // Handle other validation errors
      return res.status(400).json({
        error: 'Invalid request data',
        type: 'VALIDATION_ERROR'
      });
    }
  };
};

module.exports = {
  // Schemas
  onboarding20QSchema,
  loginSchema,
  inviteSchema,
  completeRegistrationSchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
  consultationBookingSchema,
  
  // Validation middleware
  validateSchema,
  
  // Specific validators
  validateOnboarding: validateSchema(onboarding20QSchema),
  validateLogin: validateSchema(loginSchema),
  validateInvite: validateSchema(inviteSchema),
  validateRegistration: validateSchema(completeRegistrationSchema),
  validateCreateApplication: validateSchema(createApplicationSchema),
  validateUpdateApplicationStatus: validateSchema(updateApplicationStatusSchema),
  validateConsultationBooking: validateSchema(consultationBookingSchema)
}; 