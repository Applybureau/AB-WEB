#!/bin/bash

# Apply Bureau Backend - Git Push Script
# Prepares and pushes code to GitHub

echo "📦 Apply Bureau Backend - Git Push Script"
echo "=========================================="
echo ""

# Run final check
echo "Running final system check..."
node final-check.js

if [ $? -ne 0 ]; then
    echo "❌ System check failed. Please fix errors before pushing."
    exit 1
fi

echo ""
echo "✓ System check passed"
echo ""

# Check git status
echo "Checking git status..."
git status

echo ""
read -p "Do you want to commit and push these changes? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Push cancelled."
    exit 0
fi

# Add all changes
echo ""
echo "Adding changes to git..."
git add .

# Commit
echo ""
read -p "Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    commit_message="Backend updates and fixes"
fi

git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo "❌ Commit failed"
    exit 1
fi

echo "✓ Changes committed"

# Push
echo ""
echo "Pushing to GitHub..."
git push origin master

if [ $? -ne 0 ]; then
    echo "❌ Push failed"
    echo "You may need to set up your remote repository:"
    echo "git remote add origin <your-repo-url>"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Successfully pushed to GitHub!"
echo "=========================================="
echo ""
echo "Your backend is now on GitHub and ready for deployment."
echo ""
