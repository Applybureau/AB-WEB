require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

async function createFullyUnlockedClient() {
  try {
    console.log('Creating fully unlocked test client account...\n');

    const email = 'testclient@applybureau.com';
    const password = 'TestClient123!';
    const fullName = 'Test Client Unlocked';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('email', email)
      .single();

    let userId;

    if (existingUser) {
      console.log('User already exists, updating...');
      userId = existingUser.id;

      // Update user
      await supabaseAdmin
        .from('registered_users')
        .update({
          password_hash: hashedPassword,
          full_name: fullName,
          role: 'client',
          is_active: true,
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } else {
      console.log('Creating new user...');
      
      // Create user
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('registered_users')
        .insert({
          email: email,
          password_hash: hashedPassword,
          full_name: fullName,
          role: 'client',
          is_active: true,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }

      userId = newUser.id;
    }

    console.log(`✓ User created/updated (ID: ${userId})`);

    // Check if client profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .single();

    let clientId;

    if (existingProfile) {
      console.log('Client profile exists, updating...');
      clientId = existingProfile.id;

      // Update client profile - FULLY UNLOCKED
      await supabaseAdmin
        .from('clients')
        .update({
          full_name: fullName,
          email: email,
          phone: '+1-555-0199',
          country: 'United States',
          
          // Payment & Registration - UNLOCKED
          payment_verified: true,
          payment_amount: 500,
          payment_date: new Date().toISOString(),
          registration_completed: true,
          registration_completed_at: new Date().toISOString(),
          
          // Onboarding - COMPLETED
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_progress: 100,
          
          // Strategy Call - COMPLETED
          strategy_call_completed: true,
          strategy_call_date: new Date().toISOString(),
          
          // Profile - UNLOCKED
          profile_locked: false,
          profile_unlocked_at: new Date().toISOString(),
          
          // Status
          status: 'active',
          is_active: true,
          
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);
    } else {
      console.log('Creating new client profile...');
      
      // Create client profile - FULLY UNLOCKED
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          user_id: userId,
          full_name: fullName,
          email: email,
          phone: '+1-555-0199',
          country: 'United States',
          
          // Payment & Registration - UNLOCKED
          payment_verified: true,
          payment_amount: 500,
          payment_date: new Date().toISOString(),
          registration_completed: true,
          registration_completed_at: new Date().toISOString(),
          
          // Onboarding - COMPLETED
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_progress: 100,
          
          // Strategy Call - COMPLETED
          strategy_call_completed: true,
          strategy_call_date: new Date().toISOString(),
          
          // Profile - UNLOCKED
          profile_locked: false,
          profile_unlocked_at: new Date().toISOString(),
          
          // Status
          status: 'active',
          is_active: true,
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (clientError) {
        console.error('Error creating client profile:', clientError);
        return;
      }

      clientId = newClient.id;
    }

    console.log(`✓ Client profile created/updated (ID: ${clientId})`);

    // Create sample onboarding record
    const { data: existingOnboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('id')
      .eq('client_id', clientId)
      .single();

    if (!existingOnboarding) {
      console.log('Creating onboarding record...');
      
      await supabaseAdmin
        .from('client_onboarding_20q')
        .insert({
          client_id: clientId,
          user_id: userId,
          responses: {
            q1: 'Software Engineering',
            q2: 'Senior Software Engineer',
            q3: 'United States',
            q4: '5+ years experience',
            q5: 'Computer Science'
          },
          completed: true,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      console.log('✓ Onboarding record created');
    }

    // Create sample strategy call
    const { data: existingStrategyCall } = await supabaseAdmin
      .from('strategy_calls')
      .select('id')
      .eq('client_id', clientId)
      .single();

    if (!existingStrategyCall) {
      console.log('Creating strategy call record...');
      
      await supabaseAdmin
        .from('strategy_calls')
        .insert({
          client_id: clientId,
          client_name: fullName,
          client_email: email,
          preferred_slots: [
            { date: '2024-03-15', time: '14:00' }
          ],
          status: 'completed',
          admin_status: 'completed',
          confirmed_time: new Date().toISOString(),
          meeting_link: 'https://meet.google.com/test-meeting',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log('✓ Strategy call record created');
    }

    // Create sample application
    const { data: existingApp } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('client_id', clientId)
      .single();

    if (!existingApp) {
      console.log('Creating sample application...');
      
      await supabaseAdmin
        .from('applications')
        .insert({
          client_id: clientId,
          user_id: userId,
          company_name: 'Tech Corp',
          position_title: 'Senior Software Engineer',
          job_url: 'https://example.com/job',
          status: 'in_progress',
          application_stage: 'resume_review',
          priority: 'high',
          target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log('✓ Sample application created');
    }

    console.log('\n=== FULLY UNLOCKED CLIENT ACCOUNT CREATED ===');
    console.log('\nLogin Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`\nUser ID: ${userId}`);
    console.log(`Client ID: ${clientId}`);
    console.log('\nAccount Status:');
    console.log('✓ Payment Verified');
    console.log('✓ Registration Completed');
    console.log('✓ Onboarding Completed (100%)');
    console.log('✓ Strategy Call Completed');
    console.log('✓ Profile Unlocked');
    console.log('✓ Active Status');
    console.log('✓ Sample Application Created');
    console.log('\nThis account has full access to all client dashboard features!');

  } catch (error) {
    console.error('Error creating fully unlocked client:', error);
  }
}

createFullyUnlockedClient();
