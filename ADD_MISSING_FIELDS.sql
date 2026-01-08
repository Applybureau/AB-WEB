-- Run this in Supabase SQL Editor to add missing fields

-- Add resume/PDF upload field
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Add additional user input fields
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS career_goals TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS current_challenges TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS years_experience VARCHAR(50);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS preferred_industries TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS additional_notes TEXT;

SELECT 'Fields added successfully!' as result;