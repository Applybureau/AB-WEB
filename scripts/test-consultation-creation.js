#!/usr/bin/env node

/**
 * Test Consultation Creation
 * Debug consultation creation issues
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { supabaseAdmin } = require('../utils/supabase');

async function testConsultationCreation() {
  console.log('🔍 Testing Consultation Creation...\n');

  try {
    // First, get a client ID
    console.log('1. Getting client...');
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email')
      .eq('email', 'israelloko65@gmail.com')
      .single();

    if (clientError || !client) {
      console.log('❌ Client not found:', clientError?.message);
      return;
    }

    console.log('✅ Client found:', client.full_name);

    // Test consultation creation
    console.log('\n2. Creating consultation...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const consultationData = {
      client_id: client.id,
      scheduled_at: futureDate.toISOString(),
      admin_notes: 'Test consultation - Career guidance session',
      status: 'scheduled'
    };

    console.log('Consultation data:', consultationData);

    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultations')
      .insert(consultationData)
      .select()
      .single();

    if (consultationError) {
      console.log('❌ Consultation creation failed:', consultationError);
      
      // Check if it's a column issue
      if (consultationError.message.includes('column') || consultationError.message.includes('does not exist')) {
        console.log('\n🔍 Checking table structure...');
        
        // Try to get table info
        const { data: tableInfo, error: tableError } = await supabaseAdmin
          .from('consultations')
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.log('❌ Table structure check failed:', tableError);
        } else {
          console.log('✅ Table exists and is accessible');
        }
      }
      
      return;
    }

    console.log('✅ Consultation created successfully:', consultation);

    // Test notification creation
    console.log('\n3. Creating notification...');
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: client.id,
        user_type: 'client',
        type: 'consultation_scheduled',
        title: 'Consultation Scheduled',
        message: `Your consultation has been scheduled for ${futureDate.toLocaleString()}`,
        is_read: false
      })
      .select()
      .single();

    if (notificationError) {
      console.log('❌ Notification creation failed:', notificationError);
    } else {
      console.log('✅ Notification created successfully:', notification.id);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testConsultationCreation();