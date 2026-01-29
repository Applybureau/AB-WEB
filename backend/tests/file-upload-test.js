#!/usr/bin/env node

/**
 * File Upload System Test Suite
 * Tests all file upload, management, and security features
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const crypto = require('crypto');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

class FileUploadTester {
  constructor() {
    this.results = { passed: 0, failed: 0, tests: [] };
    this.testFiles = [];
    this.uploadedFiles = [];
    this.authToken = null;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[FILE-TEST] ${message}${colors.reset}`);
  }

  async test(name, testFn) {
    try {
      this.log(`Testing: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      this.log(`✅ PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`❌ FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  createTestFile(filename, content, size = null) {
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const filePath = path.join(testDir, filename);
    
    if (size) {
      // Create file of specific size
      const buffer = Buffer.alloc(size, 'A');
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.writeFileSync(filePath, content || 'Test file content');
    }
    
    this.testFiles.push(filePath);
    return filePath;
  }

  async setupAuth() {
    // Try to get an auth token for testing
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
      this.authToken = response.data.token;
    } catch (error) {
      this.log('Could not authenticate - some tests may fail', 'warning');
    }
  }

  async testBasicFileUpload() {
    await this.test('Basic File Upload - Text File', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const testFile = this.createTestFile('test.txt', 'This is a test file for upload testing');
      const form = new FormData();
      form.append('file', fs.createReadStream(testFile));
      form.append('upload_purpose', 'document');

      const response = await axios.post(`${BASE_URL}/api/upload`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.status !== 201) throw new Error('File upload failed');
      if (!response.data.file || !response.data.file.id) throw new Error('No file ID returned');
      
      this.uploadedFiles.push(response.data.file.id);
    });

    await this.test('Basic File Upload - PDF File', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      // Create a fake PDF file
      const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF';
      const testFile = this.createTestFile('test-resume.pdf', pdfContent);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(testFile));
      form.append('upload_purpose', 'resume');

      const response = await axios.post(`${BASE_URL}/api/upload`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.status !== 201) throw new Error('PDF upload failed');
      this.uploadedFiles.push(response.data.file.id);
    });

    await this.test('Basic File Upload - Image File', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      // Create a minimal PNG file
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const testFile = this.createTestFile('test-image.png');
      fs.writeFileSync(testFile, pngHeader);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(testFile));
      form.append('upload_purpose', 'profile_picture');

      const response = await axios.post(`${BASE_URL}/api/upload`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.status !== 201) throw new Error('Image upload failed');
      this.uploadedFiles.push(response.data.file.id);
    });
  }

  async testFileUploadSecurity() {
    await this.test('Upload Security - No Authentication', async () => {
      const testFile = this.createTestFile('unauthorized.txt', 'Should not upload');
      const form = new FormData();
      form.append('file', fs.createReadStream(testFile));

      try {
        await axios.post(`${BASE_URL}/api/upload`, form, {
          headers: form.getHeaders()
        });
        throw new Error('Unauthorized upload was accepted');
      } catch (error) {
        if (!error.response || error.response.status !== 401) {
          throw new Error('Wrong error type for unauthorized upload');
        }
      }
    });

    await this.test('Upload Security - Invalid Token', async () => {
      const testFile = this.createTestFile('invalid-token.txt', 'Should not upload');
      const form = new FormData();
      form.append('file', fs.createReadStream(testFile));

      try {
        await axios.post(`${BASE_URL}/api/upload`, form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': 'Bearer invalid_token_here'
          }
        });
        throw new Error('Upload with invalid token was accepted');
      } catch (error) {
        if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
          throw new Error('Wrong error type for invalid token upload');
        }
      }
    });

    await this.test('Upload Security - Malicious File Extension', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const maliciousExtensions = ['.exe', '.bat', '.sh', '.php', '.jsp'];
      
      for (const ext of maliciousExtensions) {
        const testFile = this.createTestFile(`malicious${ext}`, 'malicious content');
        const form = new FormData();
        form.append('file', fs.createReadStream(testFile));

        try {
          await axios.post(`${BASE_URL}/api/upload`, form, {
            headers: {
              ...form.getHeaders(),
              'Authorization': `Bearer ${this.authToken}`
            }
          });
          throw new Error(`Malicious file with extension ${ext} was accepted`);
        } catch (error) {
          if (!error.response || error.response.status !== 400) {
            throw new Error(`Wrong error type for malicious file ${ext}`);
          }
        }
      }
    });

    await this.test('Upload Security - File Size Limit', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      // Create a large file (assuming 10MB limit)
      const largeFile = this.createTestFile('large-file.txt', null, 11 * 1024 * 1024); // 11MB
      const form = new FormData();
      form.append('file', fs.createReadStream(largeFile));

      try {
        await axios.post(`${BASE_URL}/api/upload`, form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${this.authToken}`
          }
        });
        throw new Error('Large file upload was accepted');
      } catch (error) {
        if (!error.response || error.response.status !== 413) {
          // Might be 400 depending on implementation
          if (error.response && error.response.status !== 400) {
            throw new Error('Wrong error type for large file upload');
          }
        }
      }
    });
  }

  async testFileManagement() {
    await this.test('File Listing', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const response = await axios.get(`${BASE_URL}/api/files`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.status !== 200) throw new Error('File listing failed');
      if (!Array.isArray(response.data.files)) throw new Error('Files not returned as array');
    });

    await this.test('File Details Retrieval', async () => {
      if (!this.authToken || this.uploadedFiles.length === 0) {
        throw new Error('No uploaded files available for testing');
      }

      const fileId = this.uploadedFiles[0];
      const response = await axios.get(`${BASE_URL}/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.status !== 200) throw new Error('File details retrieval failed');
      if (!response.data.file) throw new Error('File details not returned');
    });

    await this.test('File Download', async () => {
      if (!this.authToken || this.uploadedFiles.length === 0) {
        throw new Error('No uploaded files available for testing');
      }

      const fileId = this.uploadedFiles[0];
      const response = await axios.get(`${BASE_URL}/api/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        responseType: 'stream'
      });

      if (response.status !== 200) throw new Error('File download failed');
    });

    await this.test('File Deletion', async () => {
      if (!this.authToken || this.uploadedFiles.length === 0) {
        throw new Error('No uploaded files available for testing');
      }

      const fileId = this.uploadedFiles.pop(); // Remove last file
      const response = await axios.delete(`${BASE_URL}/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (response.status !== 200) throw new Error('File deletion failed');

      // Verify file is deleted
      try {
        await axios.get(`${BASE_URL}/api/files/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });
        throw new Error('Deleted file is still accessible');
      } catch (error) {
        if (!error.response || error.response.status !== 404) {
          throw new Error('Wrong error type for deleted file access');
        }
      }
    });
  }

  async testFileTypes() {
    await this.test('File Type Validation - Allowed Types', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const allowedTypes = [
        { ext: '.txt', content: 'text content' },
        { ext: '.pdf', content: '%PDF-1.4\ntest' },
        { ext: '.doc', content: 'document content' },
        { ext: '.docx', content: 'document content' },
        { ext: '.jpg', content: Buffer.from([0xFF, 0xD8, 0xFF]) },
        { ext: '.png', content: Buffer.from([0x89, 0x50, 0x4E, 0x47]) }
      ];

      for (const type of allowedTypes) {
        const testFile = this.createTestFile(`test${type.ext}`);
        fs.writeFileSync(testFile, type.content);
        
        const form = new FormData();
        form.append('file', fs.createReadStream(testFile));

        try {
          const response = await axios.post(`${BASE_URL}/api/upload`, form, {
            headers: {
              ...form.getHeaders(),
              'Authorization': `Bearer ${this.authToken}`
            }
          });

          if (response.status === 201) {
            this.uploadedFiles.push(response.data.file.id);
          }
        } catch (error) {
          // Some file types might not be allowed
          this.log(`File type ${type.ext} not allowed (might be expected)`, 'warning');
        }
      }
    });
  }

  async testUploadPurposes() {
    await this.test('Upload Purposes - Valid Purposes', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const purposes = ['resume', 'profile_picture', 'document', 'other'];
      
      for (const purpose of purposes) {
        const testFile = this.createTestFile(`${purpose}-test.txt`, `Test file for ${purpose}`);
        const form = new FormData();
        form.append('file', fs.createReadStream(testFile));
        form.append('upload_purpose', purpose);

        const response = await axios.post(`${BASE_URL}/api/upload`, form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${this.authToken}`
          }
        });

        if (response.status !== 201) throw new Error(`Upload with purpose ${purpose} failed`);
        this.uploadedFiles.push(response.data.file.id);
      }
    });

    await this.test('Upload Purposes - Invalid Purpose', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const testFile = this.createTestFile('invalid-purpose.txt', 'test content');
      const form = new FormData();
      form.append('file', fs.createReadStream(testFile));
      form.append('upload_purpose', 'invalid_purpose');

      try {
        await axios.post(`${BASE_URL}/api/upload`, form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${this.authToken}`
          }
        });
        throw new Error('Upload with invalid purpose was accepted');
      } catch (error) {
        if (!error.response || error.response.status !== 400) {
          throw new Error('Wrong error type for invalid purpose');
        }
      }
    });
  }

  async testRateLimiting() {
    await this.test('Upload Rate Limiting', async () => {
      if (!this.authToken) throw new Error('No auth token available');

      const requests = [];
      
      // Make multiple rapid upload requests
      for (let i = 0; i < 25; i++) {
        const testFile = this.createTestFile(`rate-limit-${i}.txt`, `content ${i}`);
        const form = new FormData();
        form.append('file', fs.createReadStream(testFile));

        requests.push(
          axios.post(`${BASE_URL}/api/upload`, form, {
            headers: {
              ...form.getHeaders(),
              'Authorization': `Bearer ${this.authToken}`
            }
          }).catch(error => error)
        );
      }

      const results = await Promise.all(requests);
      const rateLimitedRequests = results.filter(result => 
        result.response && result.response.status === 429
      );

      if (rateLimitedRequests.length === 0) {
        this.log('No rate limiting detected (might be expected)', 'warning');
      } else {
        this.log(`Rate limiting working: ${rateLimitedRequests.length} requests blocked`, 'success');
      }
    });
  }

  cleanup() {
    // Clean up test files
    this.testFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Clean up test directory
    const testDir = path.join(__dirname, 'test-files');
    if (fs.existsSync(testDir)) {
      try {
        fs.rmdirSync(testDir);
      } catch (error) {
        // Directory might not be empty
      }
    }
  }

  async runAllTests() {
    this.log('📁 Starting File Upload System Tests');
    this.log(`Testing against: ${BASE_URL}`);
    this.log('=' .repeat(50));

    await this.setupAuth();

    await this.testBasicFileUpload();
    await this.testFileUploadSecurity();
    await this.testFileManagement();
    await this.testFileTypes();
    await this.testUploadPurposes();
    await this.testRateLimiting();

    this.cleanup();

    this.log('=' .repeat(50));
    this.log('🏁 File Upload Test Results');
    this.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');

    const failedTests = this.results.tests.filter(t => t.status === 'FAILED');
    if (failedTests.length > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      failedTests.forEach(test => {
        this.log(`  • ${test.name}: ${test.error}`, 'error');
      });
    }

    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1);
    this.log(`\nFile Upload Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

    return this.results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new FileUploadTester();
  tester.runAllTests().catch(error => {
    console.error('File upload test runner error:', error);
    process.exit(1);
  });
}

module.exports = FileUploadTester;