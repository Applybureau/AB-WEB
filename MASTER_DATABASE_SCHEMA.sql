-- =====================================================
-- APPLY BUREAU - MASTER DATABASE SCHEMA
-- Complete database reset and setup for fresh start
-- This will DROP ALL existing tables and create new ones
-- =====================================================

-- WARNING: This will delete ALL existing data!
-- Make sure to backup your database before running this script

-- =====================================================
-- STEP 1: DROP ALL EXISTING TABLES AND POLICIES
-- =====================================================

-- Drop all tables in correct order (respecting foreign key constrain