require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_CLIENT_EMAIL = 'testclient1768943293606@example.com';
const TEST_CLIENT_PASSWORD = 'TestClient123!';

async function debugOnboardingSubmission() {
  console.log('🔍 DEBUGGING ONBOARDING SUBMISSION');
  console.log('==================================\n');

  try {
    // Login first
    console.log('1. Logging in as test client...');
    const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: TEST_CLIENT_EMAIL,
      password: TEST_CLIENT_PASSWORD
    });
    
    const clientToken = loginRes.data.token;
    console.log(`✅ Logged in successfully. User ID: ${loginRes.data.user?.id}`);

    // Check current onboarding status
    console.log('\n2. Checking current onboarding status...');
    try {
      const statusRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/onboarding/status`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      console.log('✅ Current onboarding status:', statusRes.data);
    } catch (error) {
      console.log('❌ Error getting onboarding status:', error.response?.data);
    }

    // Try minimal onboarding submission
    console.log('\n3. Testing minimal onboarding submission...');
    try {
      const minimalData = {
        target_job_titles: ['Software Engineer'],
        target_industr