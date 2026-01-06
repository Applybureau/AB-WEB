#!/usr/bin/env node

/**
 * Apply Bureau - Complete System Test with Real Admin Account
 * Tests all API endpoints and workflows using israelloko65@gmail.com
 */

const axios = require('axios');
const colors = require('colors');
const bcrypt = require('bcryptjs');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test credentials
const ADMIN_EMAIL = 'israelloko65@gmail.com';
const ADMIN_PASSWORD = 'admin123'; // Change this after first login
const TEST_CLIENT_EMAIL = 'testclient@example.com';

class ApplyBureauSystemTest {
  constructor() {
    this.adminToken = null;
    this.clientToken = null;
    this.testClientId = null;
    this.testApplicationId = null;
    this.testConsultationId = null;
    this.testMessageId = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    try {
      console.log(`\n🧪 Testing: ${name}`.cyan);
      const result = await testFn();
      consol