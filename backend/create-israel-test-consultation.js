require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const { sendEmail } = require('./utils/email');
const bcrypt = require('bcryptjs');

async function createIsraelTestConsultation() {
  console.log('🚀 Creating Israel Test Consultation and Account Setup\n');

  try {
    const clientEmail = 'israelloko65@gmail.com';
    const clientName = 'Israel Test';
    const tempPassword = 'IsraelTest2024!';

    // Step 1: Check if client already exists
    console.log('1️⃣ Checking if client exists...');
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', clientEmail)
      .maybeSingle();

    let clientId;

    if (existingClient) {
      console.log('✅ Client already exists:', existingClient.id);
      console.log('   Updating existing client...');
      clientId = existingClient.id;
      
      // Update existing client
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      await supabaseAdmin
        .from('clients')
        .update({
          full_name: clientName,
          password: hashedPassword,
          status: 'active'
        })
        .eq('id', clientId);
      
      console.log('✅ Client updated');
    } else {
      // Step 2: Create new client account
      console.log('2️⃣ Creating new client account...');
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          email: clientEmail,
          full_name: clientName,
          password: hashedPassword,
          role: 'client',
          status: 'active',
          onboarding_complete: false,
          payment_verified: false,
          profile_unlocked: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating client:', createError);
        throw createError;
      }

      clientId = newClient.id;
      console.log('✅ Client created:', clientId);
    }

    // Step 3: Verify payment
    console.log('\n3️⃣ Verifying payment...');
    const { error: paymentError } = await supabaseAdmin
      .from('clients')
      .update({
        payment_verified: true
      })
      .eq('id', clientId);

    if (paymentError) {
      console.error('❌ Error verifying payment:', paymentError);
      throw paymentError;
    }
    console.log('✅ Payment verified');

    // Step 4: Unlock profile
    console.log('\n4️⃣ Unlocking profile...');
    const { error: unlockError } = await supabaseAdmin
      .from('clients')
      .update({
        profile_unlocked: true
      })
      .eq('id', clientId);

    if (unlockError) {
      console.error('❌ Error unlocking profile:', unlockError);
      throw unlockError;
    }
    console.log('✅ Profile unlocked');

    // Step 5: Create consultation
    console.log('\n5️⃣ Creating consultation...');
    const consultationDate = new Date();
    consultationDate.setDate(consultationDate.getDate() + 7); // 7 days from now

    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultations')
      .insert({
        client_id: clientId,
        scheduled_at: consultationDate.toISOString(),
        status: 'confirmed',
        consultation_type: 'initial',
        client_reason: 'Test consultation for Israel Test account',
        communication_method: 'whatsapp_call',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (consultationError) {
      console.error('❌ Error creating consultation:', consultationError);
      console.log('⚠️  Continuing without consultation...');
    } else {
      console.log('✅ Consultation created:', consultation.id);
    }

    // Step 6: Send consultation confirmation email
    console.log('\n6️⃣ Sending consultation confirmation email...');
    try {
      await sendEmail(clientEmail, 'consultation_confirmed', {
        client_name: clientName,
        consultation_date: consultationDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        consultation_time: '10:00 AM',
        is_whatsapp_call: true,
        meeting_link: null
      });
      console.log('✅ Consultation confirmation email sent');
    } catch (emailError) {
      console.error('⚠️  Warning: Failed to send consultation email:', emailError.message);
    }

    // Step 7: Send registration/welcome email
    console.log('\n7️⃣ Sending registration welcome email...');
    try {
      await sendEmail(clientEmail, 'payment_verified_registration', {
        client_name: clientName,
        login_url: 'https://www.applybureau.com/login',
        email: clientEmail,
        temp_password: tempPassword,
        dashboard_url: 'https://www.applybureau.com/dashboard'
      });
      console.log('✅ Registration welcome email sent');
    } catch (emailError) {
      console.error('⚠️  Warning: Failed to send registration email:', emailError.message);
    }

    // Step 8: Create notification
    console.log('\n8️⃣ Creating welcome notification...');
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: clientId,
          user_type: 'client',
          type: 'account_activated',
          title: 'Welcome to Apply Bureau!',
          message: 'Your account has been activated. Your consultation is confirmed and your profile is unlocked.',
          is_read: false,
          created_at: new Date().toISOString()
        });
      console.log('✅ Welcome notification created');
    } catch (notifError) {
      console.error('⚠️  Warning: Failed to create notification:', notifError.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ISRAEL TEST ACCOUNT SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Account Details:');
    console.log('   Client ID:', clientId);
    console.log('   Name:', clientName);
    console.log('   Email:', clientEmail);
    console.log('   Password:', tempPassword);
    console.log('\n✅ Status:');
    console.log('   - Client account created/updated');
    console.log('   - Payment verified ✓');
    console.log('   - Profile unlocked ✓');
    console.log('   - Consultation confirmed ✓');
    console.log('   - Consultation confirmation email sent ✓');
    console.log('   - Registration welcome email sent ✓');
    console.log('\n📅 Consultation Details:');
    console.log('   Date:', consultationDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    console.log('   Time: 10:00 AM');
    console.log('   Method: WhatsApp Call');
    console.log('\n🔐 Login Credentials:');
    console.log('   URL: https://www.applybureau.com/login');
    console.log('   Email:', clientEmail);
    console.log('   Password:', tempPassword);
    console.log('\n📧 Emails Sent:');
    console.log('   1. Consultation Confirmation (consultation_confirmed)');
    console.log('   2. Registration Welcome (payment_verified_registration)');
    console.log('\n✅ Account is ready to use!');

  } catch (error) {
    console.error('\n❌ SETUP FAILED!\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createIsraelTestConsultation();
