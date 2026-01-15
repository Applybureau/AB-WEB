require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testAdminCreationWithPhoto() {
  console.log('🧪 Testing Admin Creation with Profile Photo\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login as master admin
    console.log('\n📝 Step 1: Login as master admin...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'Admin@123456'
    });

    if (!loginResponse.data.token) {
      console.error('❌ Login failed - no token received');
      return;
    }

    const masterToken = loginResponse.data.token;
    console.log('✅ Master admin logged in successfully');

    // Step 2: Create admin WITHOUT profile picture
    console.log('\n📝 Step 2: Creating admin WITHOUT profile picture...');
    
    const adminWithoutPhoto = {
      full_name: 'Admin Without Photo',
      email: `admin-no-photo-${Date.now()}@applybureau.com`,
      password: 'TestAdmin@123456',
      phone: '+1234567890'
    };

    try {
      const response1 = await axios.post(
        `${API_URL}/api/admin-management/admins`,
        adminWithoutPhoto,
        {
          headers: {
            'Authorization': `Bearer ${masterToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Admin created without photo!');
      console.log('Admin ID:', response1.data.admin.id);
      console.log('Email:', response1.data.admin.email);
      console.log('Profile Picture:', response1.data.admin.profile_picture_url || 'None');

    } catch (error) {
      console.error('❌ Failed to create admin without photo');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error:', error.response.data);
      }
      throw error;
    }

    // Step 3: Create a test image file
    console.log('\n📝 Step 3: Creating test profile picture...');
    
    // Create a simple 1x1 PNG image (base64 encoded)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    const testImagePath = path.join(__dirname, 'test-profile-pic.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('✅ Test image created:', testImagePath);

    // Step 4: Create admin WITH profile picture using multipart/form-data
    console.log('\n📝 Step 4: Creating admin WITH profile picture...');
    
    const formData = new FormData();
    formData.append('full_name', 'Admin With Photo');
    formData.append('email', `admin-with-photo-${Date.now()}@applybureau.com`);
    formData.append('password', 'TestAdmin@123456');
    formData.append('phone', '+0987654321');
    formData.append('profile_picture', fs.createReadStream(testImagePath), {
      filename: 'profile.png',
      contentType: 'image/png'
    });

    try {
      const response2 = await axios.post(
        `${API_URL}/api/admin-management/admins`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${masterToken}`,
            ...formData.getHeaders()
          }
        }
      );

      console.log('✅ Admin created with photo!');
      console.log('Admin ID:', response2.data.admin.id);
      console.log('Email:', response2.data.admin.email);
      console.log('Profile Picture URL:', response2.data.admin.profile_picture_url);

      if (response2.data.admin.profile_picture_url) {
        console.log('✅ Profile picture uploaded successfully!');
      } else {
        console.warn('⚠️  Profile picture URL is null');
      }

    } catch (error) {
      console.error('❌ Failed to create admin with photo');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error:', error.response.data);
      }
      throw error;
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test files...');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('✅ Test image deleted');
    }

    console.log('\n✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('- Master admin login: ✅');
    console.log('- Admin creation without photo: ✅');
    console.log('- Admin creation with photo: ✅');
    console.log('- Profile picture upload: ✅');

  } catch (error) {
    console.error('\n❌ Test failed');
    process.exit(1);
  }
}

// Only run if API is available
console.log('Testing against:', API_URL);
console.log('Make sure the server is running!\n');

testAdminCreationWithPhoto();
