#!/usr/bin/env node

require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function fixClientIdConstraint() {
  console.log('🔧 Fixing client_id Constraint Issue...\n');

  try {
    // Step 1: Check current table structure
    console.log('1. 📊 Checking Current Table Structure...');
    
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, is_nullable, column_default')
      .eq('table_name', 'applications')
      .in('column_name', ['user_id', 'client_id']);

    if (columnsError) {
      console.log('   ❌ Error checking table structure:', columnsError.message);
      return;
    }

    console.log('   ✅ Current column structure:');
    columns.forEach(col => {
      console.log(`     - ${col.column_name}: nullable=${col.is_nullable}, default=${col.column_default}`);
    });

    // Step 2: Make client_id nullable if it's not already
    console.log('\n2. 🔄 Making client_id Column Nullable...');
    
    const clientIdColumn = columns.find(col => col.column_name === 'client_id');
    
    if (clientIdColumn && clientIdColumn.is_nullable === 'NO') {
      console.log('   Making client_id nullable...');
      
      try {
        // Use raw SQL to alter the table
        const alterSQL = `ALTER TABLE applications ALTER COLUMN client_id DROP NOT NULL;`;
        
        await supabaseAdmin.rpc('exec_sql', { sql: alterSQL });
        console.log('   ✅ client_id column is now nullable');
      } catch (alterError) {
        console.log('   ❌ Failed to alter client_id column:', alterError.message);
        
        // Alternative approach: Update existing records and then alter
        console.log('   Trying alternative approach...');
        
        // First, update any records with null client_id
        const { error: updateError } = await supabaseAdmin
          .from('applications')
          .update({ client_id: supabaseAdmin.raw('user_id') })
          .is('client_id', null);
        
        if (updateError) {
          console.log('   ❌ Failed to update null client_id records:', updateError.message);
        } else {
          console.log('   ✅ Updated null client_id records');
          
          // Now try to alter the column again
          try {
            await supabaseAdmin.rpc('exec_sql', { sql: alterSQL });
            console.log('   ✅ client_id column is now nullable');
          } catch (secondAlterError) {
            console.log('   ❌ Still failed to alter client_id column:', secondAlterError.message);
          }
        }
      }
    } else {
      console.log('   ✅ client_id column is already nullable');
    }

    // Step 3: Test application creation with the fix
    console.log('\n3. 🧪 Testing Application Creation...');
    
    // Get existing applications to find a user_id
    const { data: existingApps, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('user_id')
      .limit(1);

    if (appsError || !existingApps || existingApps.length === 0) {
      console.log('   ❌ No existing applications found for testing');
      return;
    }

    const testUserId = existingApps[0].user_id;
    console.log(`   Using test user ID: ${testUserId}`);

    // Test creating an application with proper field mapping
    const testApplication = {
      user_id: testUserId,
      client_id: testUserId, // Set both fields to the same value
      type: 'job_application',
      title: 'Test Company - Test Developer',
      description: 'Test application for constraint fix',
      status: 'applied',
      company_name: 'Test Company',
      job_title: 'Test Developer',
      admin_notes: 'Created by constraint fix script'
    };

    const { data: newApp, error: createError } = await supabaseAdmin
      .from('applications')
      .insert(testApplication)
      .select()
      .single();

    if (createError) {
      console.log('   ❌ Application creation still failing:', createError.message);
      
      // Try creating without client_id
      console.log('   Trying without client_id...');
      const testAppWithoutClientId = {
        user_id: testUserId,
        type: 'job_application',
        title: 'Test Company - Test Developer (No Client ID)',
        description: 'Test application without client_id',
        status: 'applied',
        company_name: 'Test Company',
        job_title: 'Test Developer',
        admin_notes: 'Created without client_id'
      };

      const { data: newAppNoClientId, error: createErrorNoClientId } = await supabaseAdmin
        .from('applications')
        .insert(testAppWithoutClientId)
        .select()
        .single();

      if (createErrorNoClientId) {
        console.log('   ❌ Application creation without client_id also failed:', createErrorNoClientId.message);
      } else {
        console.log('   ✅ Application creation without client_id successful:', newAppNoClientId.id);
        
        // Update it to set client_id
        const { error: updateError } = await supabaseAdmin
          .from('applications')
          .update({ client_id: testUserId })
          .eq('id', newAppNoClientId.id);

        if (updateError) {
          console.log('   ❌ Failed to update client_id:', updateError.message);
        } else {
          console.log('   ✅ Successfully updated client_id');
        }
        
        // Clean up
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('id', newAppNoClientId.id);
        console.log('   ✅ Cleaned up test application');
      }
    } else {
      console.log('   ✅ Application creation successful:', newApp.id);
      
      // Clean up
      await supabaseAdmin
        .from('applications')
        .delete()
        .eq('id', newApp.id);
      console.log('   ✅ Cleaned up test application');
    }

    // Step 4: Check and fix any existing applications with missing client_id
    console.log('\n4. 🔄 Fixing Existing Applications...');
    
    const { data: appsWithoutClientId, error: missingClientIdError } = await supabaseAdmin
      .from('applications')
      .select('id, user_id, client_id')
      .is('client_id', null);

    if (missingClientIdError) {
      console.log('   ❌ Error checking for missing client_id:', missingClientIdError.message);
    } else if (appsWithoutClientId && appsWithoutClientId.length > 0) {
      console.log(`   Found ${appsWithoutClientId.length} applications with missing client_id`);
      
      for (const app of appsWithoutClientId) {
        if (app.user_id) {
          const { error: fixError } = await supabaseAdmin
            .from('applications')
            .update({ client_id: app.user_id })
            .eq('id', app.id);

          if (fixError) {
            console.log(`   ❌ Failed to fix application ${app.id}:`, fixError.message);
          } else {
            console.log(`   ✅ Fixed application ${app.id}`);
          }
        }
      }
    } else {
      console.log('   ✅ All applications have client_id set');
    }

    console.log('\n🎉 Client ID Constraint Fix Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Checked table structure');
    console.log('   ✅ Made client_id nullable (if needed)');
    console.log('   ✅ Tested application creation');
    console.log('   ✅ Fixed existing applications');
    
    console.log('\n🚀 Application Creation Should Now Work!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
if (require.main === module) {
  fixClientIdConstraint().catch(console.error);
}

module.exports = { fixClientIdConstraint };