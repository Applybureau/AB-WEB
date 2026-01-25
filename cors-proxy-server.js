#!/usr/bin/env node

/**
 * Temporary CORS Proxy Server
 * Use this locally until DigitalOcean deployment updates
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;
const TARGET_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

// Ultra-permissive CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: '*',
  allowedHeaders: '*',
  exposedHeaders: '*'
}));

// Proxy all requests to the DigitalOcean backend
app.use('/', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  secure: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying: ${req.method} ${req.url} -> ${TARGET_URL}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to all responses
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = '*';
    proxyRes.headers['Access-Control-Allow-Headers'] = '*';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: ${TARGET_URL}`);
  console.log(`🔧 Update your frontend to use: http://localhost:${PORT}`);
  console.log('');
  console.log('Example usage in frontend:');
  console.log(`const API_BASE_URL = 'http://localhost:${PORT}';`);
  console.log('');
  console.log('This is a temporary solution until DigitalOcean deployment updates.');
});

module.exports = app;