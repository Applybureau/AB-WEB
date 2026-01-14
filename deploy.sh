#!/bin/bash

# Apply Bureau Backend - Deployment Script
# This script prepares and deploys the backend to production

echo "🚀 Apply Bureau Backend Deployment Script"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your production configuration"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ is required"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js version check passed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"

# Run tests
echo ""
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Some tests failed"
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✓ Tests completed"

# Run health check
echo ""
echo "🏥 Running health check..."
npm run health-check

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Health check failed"
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✓ Health check passed"

# Build (if needed)
echo ""
echo "🔨 Building application..."
# Add build steps here if needed

echo "✓ Build completed"

# Deployment instructions
echo ""
echo "=========================================="
echo "✅ Pre-deployment checks completed!"
echo ""
echo "Next steps:"
echo "1. Ensure your database schema is up to date (run MASTER_DATABASE_SCHEMA.sql)"
echo "2. Create an admin user if needed: npm run create-first-admin"
echo "3. Deploy to your hosting platform"
echo "4. Set environment variables on your hosting platform"
echo "5. Test the deployed application"
echo ""
echo "Deployment platforms:"
echo "- Render: https://render.com"
echo "- Railway: https://railway.app"
echo "- Vercel: https://vercel.com"
echo "- DigitalOcean: https://digitalocean.com"
echo ""
echo "=========================================="
