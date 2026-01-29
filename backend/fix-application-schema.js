require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const fs = require('fs');

async function runSchemaFix() {
  try {
    console.log('🔧 Running database schema fix...');
    
    // First, let's check the current table structure
    console.log('📊 Checking current applications table structure...');
    
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql_query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'applications' 
          ORDER BY ordinal_position;
        `
      });
    
    if (tableError) {
      console.error('❌ Table check error:', tableError);
    } else {
      console.log('📋 Current table structure:', tableInfo);
    }
    
    // Check if applications table exists
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, user_id, client_id', { count: 'exact' })
      .limit(1);
    
    if (appError && appError.code === '42P01') {
      console.log('📝 Applications table does not exist, creating it...');
      
      // Create the applications table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          client_id UUID, -- Keep for backward compatibility
          type VARCHAR(50) DEFAULT 'job_application',
          title TEXT,
          description TEXT,
          status VARCHAR(50) DEFAULT 'applied',
          priority VARCHAR(20) DEFAULT 'medium',
          
          -- Job details
          company_name TEXT,
          job_title TEXT,
          job_url TEXT,
          salary_range TEXT,
          location TEXT,
          job_type VARCHAR(50) DEFAULT 'full-time',
          
          -- Application details
          application_date TIMESTAMPTZ DEFAULT NOW(),
          application_method VARCHAR(100),
          application_strategy TEXT,
          
          -- Documents
          tailored_resume_url TEXT,
          cover_letter_url TEXT,
          documents JSONB DEFAULT '[]',
          
          -- Status tracking
          interview_date TIMESTAMPTZ,
          offer_amount DECIMAL(10,2),
          
          -- Notes
          notes TEXT,
          admin_notes TEXT,
          internal_notes TEXT,
          rejection_reason TEXT,
          
          -- Metadata
          tags TEXT[],
          deadline TIMESTAMPTZ,
          
          -- Admin tracking
          approved_by UUID REFERENCES auth.users(id),
          assigned_to UUID REFERENCES auth.users(id),
          approved_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          cancelled_at TIMESTAMPTZ,
          cancellation_reason TEXT,
          
          -- Timestamps
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
        CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
        CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
        
        -- Enable RLS
        ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
        CREATE POLICY "Users can view their own applications" ON applications
          FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;
        CREATE POLICY "Users can insert their own applications" ON applications
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
        CREATE POLICY "Users can update their own applications" ON applications
          FOR UPDATE USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
        CREATE POLICY "Admins can view all applications" ON applications
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
          );
        
        DROP POLICY IF EXISTS "Admins can insert applications" ON applications;
        CREATE POLICY "Admins can insert applications" ON applications
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
          );
        
        DROP POLICY IF EXISTS "Admins can update all applications" ON applications;
        CREATE POLICY "Admins can update all applications" ON applications
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
          );
      `;
      
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', { 
        sql_query: createTableSQL 
      });
      
      if (createError) {
        console.error('❌ Failed to create applications table:', createError);
        return;
      }
      
      console.log('✅ Applications table created successfully');
      
    } else if (appError) {
      console.error('❌ Error checking applications table:', appError);
      return;
    } else {
      console.log(`📊 Applications table exists with ${applications?.length || 0} records`);
      
      // Fix existing table - add user_id column if missing and populate from client_id
      const fixExistingSQL = `
        DO $$ 
        BEGIN
          -- Add user_id column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'applications' AND column_name = 'user_id'
          ) THEN
            ALTER TABLE applications ADD COLUMN user_id UUID;
            
            -- Copy data from client_id to user_id if client_id exists
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'applications' AND column_name = 'client_id'
            ) THEN
              UPDATE applications SET user_id = client_id WHERE client_id IS NOT NULL;
            END IF;
            
            -- Add foreign key constraint
            ALTER TABLE applications 
            ADD CONSTRAINT fk_applications_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Added user_id column and populated from client_id';
          END IF;
          
          -- Add missing columns
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'type') THEN
            ALTER TABLE applications ADD COLUMN type VARCHAR(50) DEFAULT 'job_application';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'title') THEN
            ALTER TABLE applications ADD COLUMN title TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'description') THEN
            ALTER TABLE applications ADD COLUMN description TEXT;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'status') THEN
            ALTER TABLE applications ADD COLUMN status VARCHAR(50) DEFAULT 'applied';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'admin_notes') THEN
            ALTER TABLE applications ADD COLUMN admin_notes TEXT;
          END IF;
        END $$;
      `;
      
      const { error: fixError } = await supabaseAdmin.rpc('exec_sql', { 
        sql_query: fixExistingSQL 
      });
      
      if (fixError) {
        console.error('❌ Failed to fix existing table:', fixError);
        return;
      }
      
      console.log('✅ Existing applications table updated');
    }
    
    // Final verification
    console.log('🔍 Final verification...');
    const { data: finalCheck, error: finalError } = await supabaseAdmin
      .from('applications')
      .select('id, user_id, client_id, type, title, status', { count: 'exact' })
      .limit(5);
    
    if (finalError) {
      console.error('❌ Final verification failed:', finalError);
    } else {
      console.log(`✅ Applications table is working! Found ${finalCheck?.length || 0} records`);
      if (finalCheck && finalCheck.length > 0) {
        console.log('📋 Sample records:', finalCheck);
      }
    }
    
    console.log('🎯 Database schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
  }
}

runSchemaFix();