#!/usr/bin/env node

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function debugConsultationTable() {
  console.log('🔍 Debugging Consultation Requests Table\n');
  
  try {
    // Test 1: Check if table exists by doing a simple select
    console.log('1. Testing basic table access...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('consultation_requests')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Table access failed:', testError);
      console.log('Error details:', JSON.stringify(testError, null, 2));
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Test 2: Check table structure
    console.log('\n2. Testing full select...');
    const { data: fullData, error: fullError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .limit(1);
    
    if (fullError) {
      console.log('❌ Full select failed:', fullError);
      console.log('Error details:', JSON.stringify(fullError, null, 2));
      return;
    }
    
    console.log('✅ Full select works');
    console.log('Sample data:', fullData);
    
    // Test 3: Test the exact query from the route
    console.log('\n3. Testing exact route query...');
    const { data: routeData, error: routeError } = await supabaseAdmin
      .from('consultation_requests')
      .select(`
        id,
        fullName,
        email,
        phone,
        message,
        preferredSlots,
        requestType,
        company,
        job_title,
        consultation_type,
        urgency_level,
        source,
        status,
        pipeline_status,
        priority,
        created_at,
        updated_at,
        admin_notes,
        confirmedSlot,
        scheduled_datetime,
        google_meet_link,
        handled_by,
        response_sent
      `)
      .order('created_at', { ascending: false })
      .range(0, 19);
    
    if (routeError) {
      console.log('❌ Route query failed:', routeError);
      console.log('Error details:', JSON.stringify(routeError, null, 2));
      
      // Check which column is causing the issue
      console.log('\n4. Testing individual columns...');
      const columns = [
        'id', 'fullName', 'email', 'phone', 'message', 'preferredSlots',
        'requestType', 'company', 'job_title', 'consultation_type',
        'urgency_level', 'source', 'status', 'pipeline_status', 'priority',
        'created_at', 'updated_at', 'admin_notes', 'confirmedSlot',
        'scheduled_datetime', 'google_meet_link', 'handled_by', 'response_sent'
      ];
      
      for (const column of columns) {
        try {
          const { data, error } = await supabaseAdmin
            .from('consultation_requests')
            .select(column)
            .limit(1);
          
          if (error) {
            console.log(`❌ Column '${column}' failed:`, error.message);
          } else {
            console.log(`✅ Column '${column}' works`);
          }
        } catch (err) {
          console.log(`❌ Column '${column}' exception:`, err.message);
        }
      }
      
      return;
    }
    
    console.log('✅ Route query works');
    console.log('Data count:', routeData?.length || 0);
    
    // Test 4: Test count query
    console.log('\n5. Testing count query...');
    const { count, error: countError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Count query failed:', countError);
      console.log('Error details:', JSON.stringify(countError, null, 2));
      return;
    }
    
    console.log('✅ Count query works');
    console.log('Total records:', count);
    
  } catch (error) {
    console.log('❌ Unexpected error:', error);
    console.log('Error details:', JSON.stringify(error, null, 2));
  }
}

debugConsultationTable().catch(console.error);