#!/usr/bin/env node

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function debugEmailActions500() {
  console.log('🔍 Debugging Email Actions 500 Error\n');
  
  try {
    // Step 1: Get the consultation that's causing issues
    const consultationId = '1d97a76c-b533-4d28-9b2e-7ccf5814842d';
    
    console.log('1. Checking consultation exists...');
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', consultationId)
      .single();
    
    if (error) {
      console.log('❌ Error fetching consultation:', error);
      return;
    }
    
    if (!consultation) {
      console.log('❌ Consultation not found');
      return;
    }
    
    console.log('✅ Consultation found:');
    console.log('- ID:', consultation.id);
    console.log('- Email:', consultation.email);
    console.log('- Status:', consultation.status);
    console.log('- Full Name:', consultation.fullName || consultation.full_name);
    
    // Step 2: Check table structure
    console.log('\n2. Checking consultation_requests table structure...');
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Error checking table structure:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Table columns:', Object.keys(tableInfo[0]));
    }
    
    // Step 3: Test the update operation that's failing
    console.log('\n3. Testing update operation...');
    
    try {
      // Try the exact update from emailActions.js
      const { error: updateError } = await supabaseAdmin
        .from('consultation_requests')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          pipeline_status: 'confirmed'
        })
        .eq('id', consultationId);
      
      if (updateError) {
        console.log('❌ Update failed:', updateError);
        
        // Check if columns exist
        console.log('\n4. Checking if columns exist...');
        
        // Try updating just status
        const { error: statusError } = await supabaseAdmin
          .from('consultation_requests')
          .update({ status: 'confirmed' })
          .eq('id', consultationId);
        
        if (statusError) {
          console.log('❌ Status update failed:', statusError);
        } else {
          console.log('✅ Status update succeeded');
        }
        
        // Try updating with confirmed_at
        const { error: confirmedAtError } = await supabaseAdmin
          .from('consultation_requests')
          .update({ confirmed_at: new Date().toISOString() })
          .eq('id', consultationId);
        
        if (confirmedAtError) {
          console.log('❌ confirmed_at update failed:', confirmedAtError);
        } else {
          console.log('✅ confirmed_at update succeeded');
        }
        
        // Try updating with pipeline_status
        const { error: pipelineError } = await supabaseAdmin
          .from('consultation_requests')
          .update({ pipeline_status: 'confirmed' })
          .eq('id', consultationId);
        
        if (pipelineError) {
          console.log('❌ pipeline_status update failed:', pipelineError);
        } else {
          console.log('✅ pipeline_status update succeeded');
        }
        
      } else {
        console.log('✅ Update succeeded');
      }
      
    } catch (updateError) {
      console.log('❌ Update operation threw error:', updateError);
    }
    
    // Step 4: Check valid status values
    console.log('\n5. Checking valid status values...');
    
    // Try different status values to see which are valid
    const statusValues = ['pending', 'confirmed', 'rejected', 'approved', 'waitlisted'];
    
    for (const status of statusValues) {
      try {
        const { error } = await supabaseAdmin
          .from('consultation_requests')
          .update({ status })
          .eq('id', consultationId);
        
        if (error) {
          console.log(`❌ Status '${status}' failed:`, error.message);
        } else {
          console.log(`✅ Status '${status}' is valid`);
        }
      } catch (err) {
        console.log(`❌ Status '${status}' threw error:`, err.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error);
  }
}

debugEmailActions500().catch(console.error);