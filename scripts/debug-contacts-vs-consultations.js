#!/usr/bin/env node

/**
 * Debug Contacts vs Consultations Separation
 * Check what tables exist and what data is in each
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function debugContactsVsConsultations() {
  console.log('🔍 Debugging Contacts vs Consultations separation...');
  
  // Check contacts table
  console.log('\n📋 CONTACTS TABLE:');
  try {
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .limit(5);

    if (contactsError) {
      console.log(`❌ Error accessing contacts table:`, contactsError.message);
    } else {
      console.log(`✅ Contacts table exists`);
      console.log(`   Records found: ${contacts?.length || 0}`);
      if (contacts && contacts.length > 0) {
        console.log(`   Sample columns: ${Object.keys(contacts[0]).join(', ')}`);
        console.log(`   Sample record:`, contacts[0]);
      }
    }
  } catch (error) {
    console.log(`❌ Exception with contacts:`, error.message);
  }

  // Check contact_requests table
  console.log('\n📋 CONTACT_REQUESTS TABLE:');
  try {
    const { data: contactRequests, error: contactRequestsError } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .limit(5);

    if (contactRequestsError) {
      console.log(`❌ Error accessing contact_requests table:`, contactRequestsError.message);
    } else {
      console.log(`✅ Contact_requests table exists`);
      console.log(`   Records found: ${contactRequests?.length || 0}`);
      if (contactRequests && contactRequests.length > 0) {
        console.log(`   Sample columns: ${Object.keys(contactRequests[0]).join(', ')}`);
        console.log(`   Sample record:`, contactRequests[0]);
      }
    }
  } catch (error) {
    console.log(`❌ Exception with contact_requests:`, error.message);
  }

  // Check consultations table
  console.log('\n📋 CONSULTATIONS TABLE:');
  try {
    const { data: consultations, error: consultationsError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .limit(5);

    if (consultationsError) {
      console.log(`❌ Error accessing consultations table:`, consultationsError.message);
    } else {
      console.log(`✅ Consultations table exists`);
      console.log(`   Records found: ${consultations?.length || 0}`);
      if (consultations && consultations.length > 0) {
        console.log(`   Sample columns: ${Object.keys(consultations[0]).join(', ')}`);
        console.log(`   Sample record:`, consultations[0]);
      }
    }
  } catch (error) {
    console.log(`❌ Exception with consultations:`, error.message);
  }

  console.log('\n✅ Debug complete');
}

debugContactsVsConsultations().catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});