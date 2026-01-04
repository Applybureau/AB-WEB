#!/usr/bin/env node

const { supabaseAdmin } = require('../utils/supabase');

async function fixConsultationsSchema() {
  console.log('🔧 Fixing consultations table schema...');
  
  try {
    // Add missing prospect columns
    const alterQuery = `
      -- Add missing prospect columns to consultations table
      ALTER TABLE consultations 
      ADD COLUMN IF NOT EXISTS prospect_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS prospect_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS prospect_phone VARCHAR(50);

      -- Add constraint to ensure either client_id or prospect info is provided
      ALTER TABLE consultations 
      DROP CONSTRAINT IF EXISTS prospect_or_client_required;

      ALTER TABLE consultations 
      ADD CONSTRAINT prospect_or_client_required CHECK (
          (client_id IS NOT NULL) OR 
          (prospect_name IS NOT NULL AND prospect_email IS NOT NULL)
      );
    `;

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: alterQuery });
    
    if (error) {
      console.error('❌ Error updating schema:', error);
      return false;
    }

    console.log('✅ Consultations table schema updated successfully');
    
    // Verify the changes
    const { data: columns, error: verifyError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = 'consultations' 
              ORDER BY ordinal_position;`
      });

    if (verifyError) {
      console.log('⚠️  Could not verify changes, but update likely succeeded');
    } else {
      console.log('📋 Current consultations table structure:');
      if (columns) {
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to fix schema:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  fixConsultationsSchema()
    .then(success => {
      if (success) {
        console.log('\n🎉 Schema fix completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Schema fix failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { fixConsultationsSchema };