#!/usr/bin/env node

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n');

  const tables = [
    'admins',
    'clients',
    'registered_users',
    'consultation_requests',
    'consultations',
    'applications',
    'messages',
    'notifications',
    'client_onboarding_20q',
    'contact_requests'
  ];

  for (const table of tables) {
    console.log(`\n📋 Table: ${table}`);
    console.log('─'.repeat(50));
    
    try {
      // Try to get a sample record
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      } else {
        console.log(`✅ Table exists`);
        console.log(`   Total records: ${count || 0}`);
        
        if (data && data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
          console.log(`   No records to show columns`);
        }
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }

  console.log('\n\n🔍 Checking Admin User...\n');
  
  try {
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, full_name, role, is_active')
      .eq('email', 'israelloko65@gmail.com')
      .single();

    if (error) {
      console.log('❌ Admin not found in admins table');
    } else {
      console.log('✅ Admin found in admins table:');
      console.log('   ID:', admin.id);
      console.log('   Email:', admin.email);
      console.log('   Name:', admin.full_name);
      console.log('   Role:', admin.role);
      console.log('   Active:', admin.is_active);
    }
  } catch (err) {
    console.log('❌ Error checking admin:', err.message);
  }

  console.log('\n\n🔍 Checking Consultation Requests...\n');
  
  try {
    const { data: consultations, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, name, email, admin_status, preferred_slots, created_at')
      .limit(3);

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`✅ Found ${consultations.length} consultation requests`);
      consultations.forEach((c, i) => {
        console.log(`\n   ${i + 1}. ${c.name} (${c.email})`);
        console.log(`      Status: ${c.admin_status}`);
        console.log(`      Has slots: ${c.preferred_slots ? 'Yes' : 'No'}`);
        if (c.preferred_slots) {
          console.log(`      Slots: ${JSON.stringify(c.preferred_slots)}`);
        }
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkDatabaseSchema().catch(console.error);
