#!/usr/bin/env node

/**
 * Apply Application Schema Fix
 * Executes the comprehensive schema fix for application logging
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');
const fs = require('fs');
const path = require('path');

async function applySchemaFix() {
  console.log('🔧 Applying Application Schema Fix...\n');

  try {
    // 1. Read the SQL schema file
    console.log('1️⃣ Reading schema file...');
    
    const schemaPath = path.join(__dirname, 'sql', 'fix_application_logging_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    conso