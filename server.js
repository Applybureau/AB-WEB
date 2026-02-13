#!/usr/bin/env node

/**
 * Root Server Entry Point for DigitalOcean Deployment
 * This file redirects to the actual backend server in the backend directory
 */

console.log('🚀 Starting Apply Bureau Backend from root directory...');
console.log('📁 Redirecting to backend/server.js...');

// Change to backend directory and start the actual server
process.chdir('./backend');
require('./server.js');