Error: Failed to run sql query: ERROR: 42703: column "scheduled_date" does not exist
-- Create mock_sessions table for interview practice sessions
CREATE TABLE IF NOT EXISTS mock_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('behavioral', 'technical', 'case_study', 'general')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  focus_areas JSONB DEFAULT '[]',
  preparation_level TEXT CHECK (preparation_level IN ('beginner', 'intermediate', 'advanced')),
  coach TEXT,
  coach_profile JSONB DEFAULT '{}',
  meeting_link TEXT,
  preparation_materials TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create registered_users table (referenced in mockSessions)
CREATE TABLE IF NOT EXISTS registered_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'verified', 'completed')),
  registration_token TEXT,
  registration_token_expires TIMESTAMP WITH TIME ZONE,
  payment_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for mock_sessions
CREATE INDEX IF NOT EXISTS idx_mock_sessions_client_id ON mock_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_scheduled_date ON mock_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_status ON mock_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_session_type ON mock_sessions(session_type);

-- Add indexes for registered_users
CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);
CREATE INDEX IF NOT EXISTS idx_registered_users_registration_status ON registered_users(registration_status);

-- Enable RLS for mock_sessions
ALTER TABLE mock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_sessions
CREATE POLICY "Clients can manage their own mock sessions" ON mock_sessions 
  FOR ALL USING (client_id = auth.uid());

CREATE POLICY "Admins can view all mock sessions" ON mock_sessions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can update all mock sessions" ON mock_sessions 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );

-- RLS Policies for registered_users
CREATE POLICY "Users can view their own registration" ON registered_users 
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own registration" ON registered_users 
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all registrations" ON registered_users 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );

-- Add updated_at triggers
CREATE TRIGGER update_mock_sessions_updated_at 
  BEFORE UPDATE ON mock_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registered_users_updated_at 
  BEFORE UPDATE ON registered_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();