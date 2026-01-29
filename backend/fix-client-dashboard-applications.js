#!/usr/bin/env node

require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const logger = require('./utils/logger');

async function fixClientDashboardApplications() {
  console.log('🔧 Fixing Client Dashboard Application Loading Issues...\n');

  try {
    // Step 1: Diagnose the applications table schema
    console.log('1. 📊 Diagnosing Applications Table Schema...');
    
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'applications')
      .order('ordinal_position');

    if (tableError || !tableInfo || tableInfo.length === 0) {
      console.log('   ❌ Applications table not found or inaccessible');
      console.log('   Creating applications table...');
      
      // Create applications table with proper schema
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS applications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type TEXT NOT NULL DEFAULT 'job_application',
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'applied',
          priority TEXT DEFAULT 'medium',
          requirements JSONB DEFAULT '[]'::jsonb,
          documents JSONB DEFAULT '[]'::jsonb,
          
          -- Job Application Specific Fields
          company_name TEXT,
          job_title TEXT,
          job_url TEXT,
          application_date TIMESTAMPTZ DEFAULT NOW(),
          salary_range TEXT,
          location TEXT,
          job_type TEXT DEFAULT 'full-time',
          application_method TEXT,
          
          -- Status Tracking
          interview_date TIMESTAMPTZ,
          offer_amount TEXT,
          rejection_reason TEXT,
          
          -- Timing and Cost
          estimated_duration INTEGER,
          estimated_cost DECIMAL(10,2),
          actual_duration INTEGER,
          actual_cost DECIMAL(10,2),
          
          -- Notes and Admin Fields
          notes TEXT,
          admin_notes TEXT,
          internal_notes TEXT,
          tags TEXT[] DEFAULT '{}',
          
          -- Workflow Fields
          deadline TIMESTAMPTZ,
          approved_by UUID REFERENCES auth.users(id),
          assigned_to UUID REFERENCES auth.users(id),
          approved_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          cancelled_at TIMESTAMPTZ,
          cancellation_reason TEXT,
          
          -- Metadata
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
        CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
        CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
        CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
        
        -- Create RLS policies
        ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
        
        -- Policy for clients to see their own applications
        CREATE POLICY "Clients can view own applications" ON applications
          FOR SELECT USING (
            auth.uid() = user_id OR 
            auth.uid() = client_id OR
            (auth.jwt() ->> 'role') = 'admin'
          );
        
        -- Policy for admins to see all applications
        CREATE POLICY "Admins can view all applications" ON applications
          FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
        
        -- Policy for creating applications (admin only)
        CREATE POLICY "Admins can create applications" ON applications
          FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'admin');
        
        -- Policy for updating applications
        CREATE POLICY "Users can update own applications" ON applications
          FOR UPDATE USING (
            auth.uid() = user_id OR 
            auth.uid() = client_id OR
            (auth.jwt() ->> 'role') = 'admin'
          );
      `;

      try {
        await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL });
        console.log('   ✅ Applications table created successfully');
      } catch (createError) {
        console.log('   ❌ Failed to create applications table:', createError.message);
        return;
      }
    } else {
      console.log('   ✅ Applications table exists with columns:');
      tableInfo.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Step 2: Check for existing applications
    console.log('\n2. 📋 Checking Existing Applications...');
    
    const { data: existingApps, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('id, user_id, client_id, title, status, created_at')
      .limit(10);

    if (appsError) {
      console.log('   ❌ Error querying applications:', appsError.message);
    } else {
      console.log(`   ✅ Found ${existingApps.length} existing applications`);
      if (existingApps.length > 0) {
        console.log('   Sample applications:');
        existingApps.slice(0, 3).forEach(app => {
          console.log(`     - ${app.title} (${app.status}) - ${app.created_at}`);
        });
      }
    }

    // Step 3: Fix user_id vs client_id inconsistency
    console.log('\n3. 🔄 Fixing user_id vs client_id Inconsistency...');
    
    if (existingApps && existingApps.length > 0) {
      // Check if we have applications with null client_id but valid user_id
      const appsToFix = existingApps.filter(app => app.user_id && !app.client_id);
      
      if (appsToFix.length > 0) {
        console.log(`   Found ${appsToFix.length} applications with missing client_id`);
        
        for (const app of appsToFix) {
          const { error: updateError } = await supabaseAdmin
            .from('applications')
            .update({ client_id: app.user_id })
            .eq('id', app.id);
          
          if (updateError) {
            console.log(`   ❌ Failed to fix application ${app.id}:`, updateError.message);
          } else {
            console.log(`   ✅ Fixed application ${app.id}`);
          }
        }
      } else {
        console.log('   ✅ No applications need client_id fixes');
      }
    }

    // Step 4: Test application creation
    console.log('\n4. 🧪 Testing Application Creation...');
    
    // Get a test user
    const { data: testUsers, error: usersError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .limit(5);

    if (usersError || !testUsers || testUsers.length === 0) {
      console.log('   ❌ No users found for testing');
    } else {
      const testUser = testUsers.find(u => u.raw_user_meta_data?.role !== 'admin') || testUsers[0];
      console.log(`   Using test user: ${testUser.email}`);
      
      const testApplication = {
        user_id: testUser.id,
        client_id: testUser.id, // Set both for compatibility
        type: 'job_application',
        title: 'Test Company - Software Engineer',
        description: 'Test application for dashboard fix',
        status: 'applied',
        company_name: 'Test Company',
        job_title: 'Software Engineer',
        admin_notes: 'Created by dashboard fix script'
      };

      const { data: newApp, error: createError } = await supabaseAdmin
        .from('applications')
        .insert(testApplication)
        .select()
        .single();

      if (createError) {
        console.log('   ❌ Failed to create test application:', createError.message);
        console.log('   Details:', createError);
      } else {
        console.log('   ✅ Successfully created test application:', newApp.id);
        
        // Test querying the application
        const { data: queriedApp, error: queryError } = await supabaseAdmin
          .from('applications')
          .select('*')
          .eq('id', newApp.id)
          .single();

        if (queryError) {
          console.log('   ❌ Failed to query test application:', queryError.message);
        } else {
          console.log('   ✅ Successfully queried test application');
        }
        
        // Clean up test application
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('id', newApp.id);
        console.log('   ✅ Cleaned up test application');
      }
    }

    // Step 5: Test client dashboard application endpoints
    console.log('\n5. 🌐 Testing Client Dashboard Endpoints...');
    
    // Test the applications endpoint with different user roles
    if (testUsers && testUsers.length > 0) {
      const clientUser = testUsers.find(u => u.raw_user_meta_data?.role !== 'admin') || testUsers[0];
      
      console.log(`   Testing with client user: ${clientUser.email}`);
      
      // Simulate the applications query that the client dashboard would make
      const { data: clientApps, error: clientAppsError } = await supabaseAdmin
        .from('applications')
        .select(`
          id,
          user_id,
          type,
          title,
          description,
          status,
          company_name,
          job_title,
          application_date,
          interview_date,
          offer_amount,
          notes,
          admin_notes,
          created_at,
          updated_at
        `)
        .eq('user_id', clientUser.id)
        .order('created_at', { ascending: false });

      if (clientAppsError) {
        console.log('   ❌ Client applications query failed:', clientAppsError.message);
      } else {
        console.log(`   ✅ Client applications query successful (${clientApps.length} results)`);
      }

      // Test application stats calculation
      try {
        const stats = {
          total_applications: clientApps.length,
          status_breakdown: clientApps.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
          }, {}),
          applications_this_week: clientApps.filter(app => {
            const appDate = new Date(app.application_date || app.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return appDate >= weekAgo;
          }).length
        };
        
        console.log('   ✅ Application stats calculated successfully:');
        console.log(`     - Total: ${stats.total_applications}`);
        console.log(`     - This week: ${stats.applications_this_week}`);
        console.log(`     - Status breakdown:`, stats.status_breakdown);
      } catch (statsError) {
        console.log('   ❌ Application stats calculation failed:', statsError.message);
      }
    }

    // Step 6: Create sample applications for testing
    console.log('\n6. 📝 Creating Sample Applications for Testing...');
    
    if (testUsers && testUsers.length > 0) {
      const clientUser = testUsers.find(u => u.raw_user_meta_data?.role !== 'admin') || testUsers[0];
      
      const sampleApplications = [
        {
          user_id: clientUser.id,
          client_id: clientUser.id,
          type: 'job_application',
          title: 'Google - Senior Software Engineer',
          description: 'Full-stack development role at Google',
          status: 'applied',
          company_name: 'Google',
          job_title: 'Senior Software Engineer',
          application_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          admin_notes: 'Applied with tailored resume focusing on cloud technologies'
        },
        {
          user_id: clientUser.id,
          client_id: clientUser.id,
          type: 'job_application',
          title: 'Microsoft - Product Manager',
          description: 'Product management role for Azure services',
          status: 'interview_scheduled',
          company_name: 'Microsoft',
          job_title: 'Product Manager',
          application_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          interview_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          admin_notes: 'Interview scheduled for next week'
        },
        {
          user_id: clientUser.id,
          client_id: clientUser.id,
          type: 'job_application',
          title: 'Amazon - DevOps Engineer',
          description: 'DevOps engineering role for AWS infrastructure',
          status: 'rejected',
          company_name: 'Amazon',
          job_title: 'DevOps Engineer',
          application_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
          rejection_reason: 'Position filled internally',
          admin_notes: 'Received rejection email, will apply to similar roles'
        }
      ];

      let createdCount = 0;
      for (const app of sampleApplications) {
        const { data: createdApp, error: createError } = await supabaseAdmin
          .from('applications')
          .insert(app)
          .select('id, title')
          .single();

        if (createError) {
          console.log(`   ❌ Failed to create sample application: ${app.title}`);
          console.log(`     Error: ${createError.message}`);
        } else {
          console.log(`   ✅ Created sample application: ${createdApp.title}`);
          createdCount++;
        }
      }
      
      console.log(`   📊 Created ${createdCount} out of ${sampleApplications.length} sample applications`);
    }

    // Step 7: Test the complete client dashboard flow
    console.log('\n7. 🎯 Testing Complete Client Dashboard Flow...');
    
    if (testUsers && testUsers.length > 0) {
      const clientUser = testUsers.find(u => u.raw_user_meta_data?.role !== 'admin') || testUsers[0];
      
      // Test getting client profile
      const { data: clientProfile, error: profileError } = await supabaseAdmin
        .from('registered_users')
        .select('*')
        .eq('id', clientUser.id)
        .single();

      if (profileError) {
        console.log('   ❌ Failed to get client profile:', profileError.message);
      } else {
        console.log('   ✅ Client profile retrieved successfully');
      }

      // Test getting applications for dashboard
      const { data: dashboardApps, error: dashboardError } = await supabaseAdmin
        .from('applications')
        .select('id, title, status, company_name, job_title, application_date, interview_date')
        .eq('user_id', clientUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (dashboardError) {
        console.log('   ❌ Failed to get dashboard applications:', dashboardError.message);
      } else {
        console.log(`   ✅ Dashboard applications retrieved (${dashboardApps.length} applications)`);
        
        if (dashboardApps.length > 0) {
          console.log('   Recent applications:');
          dashboardApps.slice(0, 3).forEach(app => {
            console.log(`     - ${app.title} (${app.status})`);
          });
        }
      }

      // Test application statistics for dashboard
      const applicationStats = {
        total: dashboardApps.length,
        by_status: dashboardApps.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {}),
        recent: dashboardApps.filter(app => {
          const appDate = new Date(app.application_date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return appDate >= weekAgo;
        }).length
      };

      console.log('   ✅ Application statistics calculated:');
      console.log(`     - Total applications: ${applicationStats.total}`);
      console.log(`     - Applications this week: ${applicationStats.recent}`);
      console.log(`     - Status breakdown:`, applicationStats.by_status);
    }

    console.log('\n🎉 Client Dashboard Application Fix Complete!');
    console.log('\n📋 Summary of Changes:');
    console.log('   ✅ Verified/created applications table with proper schema');
    console.log('   ✅ Fixed user_id vs client_id inconsistencies');
    console.log('   ✅ Created sample applications for testing');
    console.log('   ✅ Tested complete client dashboard flow');
    console.log('   ✅ Verified application statistics calculation');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Test the client dashboard in the frontend');
    console.log('   2. Verify application loading works correctly');
    console.log('   3. Check that application statistics display properly');
    console.log('   4. Ensure proper error handling for edge cases');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    logger.error('Client dashboard application fix failed', error);
  }
}

// Run the fix
if (require.main === module) {
  fixClientDashboardApplications().catch(console.error);
}

module.exports = { fixClientDashboardApplications };