#!/usr/bin/env node

/**
 * Debug Consultation Tables
 * Check what consultation-related tables exist and their structure
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function debugConsultationTables() {
  console.log('🔍 Debugging consultation tables...');
  
  const tablesToCheck = [
    'consultation_requests',
    'consultations',
    'public_consultations',
    'consultation_bookings'
  ];

  for (const tableName of tablesToCheck) {
    console.log(`\n📋 Checking table: ${tableName}`);
    
    try {
      // Try to get table structure by selecting with limit 1
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Error accessing ${tableName}:`, error.message);
        console.log(`   Code: ${error.code}`);
      } else {
        console.log(`✅ Table ${tableName} exists`);
        console.log(`   Records found: ${data?.length || 0}`);
        
        if (data && data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
          // Try to get all records to see structure
          const { data: allData, error: allError } = await supabaseAdmin
            .from(tableName)
            .select('*');
            
          if (!allError && allData && allData.length > 0) {
            console.log(`   Total records: ${allData.length}`);
            console.log(`   Sample columns: ${Object.keys(allData[0]).join(', ')}`);
          } else {
            console.log(`   Table is empty or has no accessible records`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Exception accessing ${tableName}:`, error.message);
    }
  }

  // Check what tables actually exist by trying a different approach
  console.log('\n🔍 Checking for any consultation-related data...');
  
  try {
    // Check if we can find consultations in the main consultations table
    const { data: consultations, error: consultationsError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .limit(5);

    if (!consultationsError && consultations) {
      console.log(`✅ Found ${consultations.length} records in 'consultations' table`);
      if (consultations.length > 0) {
        console.log(`   Columns: ${Object.keys(consultations[0]).join(', ')}`);
        console.log(`   Sample record:`, consultations[0]);
      }
    } else {
      console.log(`❌ Error with consultations table:`, consultationsError?.message);
    }
  } catch (error) {
    console.log(`❌ Exception with consultations:`, error.message);
  }

  console.log('\n✅ Consultation tables debug complete');
}

debugConsultationTables().catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});