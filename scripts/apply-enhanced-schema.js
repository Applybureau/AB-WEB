#!/usr/bin/env node

/**
 * Apply Enhanced Admin Schema to Supabase
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const fs = require('fs');
const path = require('path');

async function applySchema() {
  try {
    console.log('📋 Reading enhanced admin schema...');
    
    const schemaPath = path.join(__dirname, '..', 'FIXED_ENHANCED_ADMIN_SCHEMA.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Applying enhanced admin schema to Supabase...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          console.log(`   ⚠️  Statement ${i + 1} warning:`, error.message);
          // Don't count warnings as errors if they're about existing objects
          if (!error.message.includes('already exists') && 
              !error.message.includes('does not exist') &&
              !error.message.includes('duplicate key')) {
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Schema Application Results:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Warnings/Errors: ${errorCount}`);
    
    // Test the schema by checking if tables exist
    console.log('\n🔍 Verifying schema application...');
    
    const tables = ['admins', 'file_uploads', 'admin_sessions', 'consultation_documents', 'admin_activity_log'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Table ${table}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ Table ${table}: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Enhanced admin schema application completed!');
    
  } catch (error) {
    console.error('❌ Failed to apply schema:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applySchemaAlternative() {
  try {
    console.log('📋 Reading enhanced admin schema (alternative method)...');
    
    const schemaPath = path.join(__dirname, '..', 'FIXED_ENHANCED_ADMIN_SCHEMA.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Applying schema using direct query...');
    
    // Try to execute the entire schema at once
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: schema
    });
    
    if (error) {
      console.log('⚠️  Schema execution had warnings:', error.message);
    } else {
      console.log('✅ Schema executed successfully');
    }
    
    console.log('📄 Schema content preview:');
    console.log(schema.substring(0, 500) + '...');
    
  } catch (error) {
    console.error('❌ Alternative method failed:', error);
    
    // Fall back to statement-by-statement execution
    console.log('🔄 Falling back to statement-by-statement execution...');
    await applySchema();
  }
}

console.log('🚀 Starting Enhanced Admin Schema Application...');
console.log('📍 Target: Supabase Database');

// Try alternative method first, fall back to statement-by-statement if needed
applySchemaAlternative().catch(error => {
  console.error('Schema application failed:', error);
  process.exit(1);
});