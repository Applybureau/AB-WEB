#!/usr/bin/env node

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkConsultationSchema() {
  console.log('🔍 Checking Consultation Requests Table Schema\n');
  
  try {
    // Get a sample record to see the structure
    console.log('1. Getting sample consultation request...');
    const { data: sample, error: sampleError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Error getting sample:', sampleError);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('✅ Sample consultation request structure:');
      console.log('Available columns:', Object.keys(sample[0]));
      console.log('\nFull sample record:');
      console.log(JSON.stringify(sample[0], null, 2));
    } else {
      console.log('❌ No consultation requests found');
    }
    
    // Check what columns the payment verification is trying to update
    console.log('\n2. Columns that payment verification tries to update:');
    const paymentColumns = [
      'payment_verified',
      'payment_method', 
      'payment_amount',
      'payment_reference',
      'package_tier',
      'payment_verification_date',
      'registration_token',
      'token_expires_at',
      'token_used',
      'verified_by',
      'admin_notes',
      'updated_at'
    ];
    
    const availableColumns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
    
    paymentColumns.forEach(col => {
      if (availableColumns.includes(col)) {
        console.log(`✅ ${col} - EXISTS`);
      } else {
        console.log(`❌ ${col} - MISSING`);
      }
    });
    
    // Try a test update with only existing columns
    console.log('\n3. Testing update with existing columns only...');
    if (sample && sample.length > 0) {
      const testId = sample[0].id;
      
      // Only update columns that exist
      const updateData = {
        admin_notes: 'Test update from schema check',
        updated_at: new Date().toISOString()
      };
      
      // Add status if it exists
      if (availableColumns.includes('status')) {
        updateData.status = 'payment_verified';
      }
      
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('consultation_requests')
        .update(updateData)
        .eq('id', testId)
        .select()
        .single();
      
      if (updateError) {
        console.log('❌ Test update failed:', updateError);
      } else {
        console.log('✅ Test update successful');
        console.log('Updated record:', JSON.stringify(updated, null, 2));
      }
    }
    
  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
  }
}

checkConsultationSchema().catch(console.error);