#!/bin/bash

# Content Integration Flow - Quick Deployment Script
# This script helps you deploy to GitHub Pages

echo "🚀 Content Integration Flow - Deployment Helper"
echo "================================================"

# Check if git is configured
if ! git config user.name > /dev/null; then
    echo "⚠️  Git user not configured. Please run:"
    echo "   git config --global user.name 'Your Name'"
    echo "   git config --global user.email 'your.email@company.com'"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Add all files
echo "📦 Adding files to Git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy: Content Integration Flow app - $(date)"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "🔗 GitHub repository setup needed:"
    echo "1. Go to https://github.com/new"
    echo "2. Create repository named: content-integration-flow"
    echo "3. Copy the repository URL"
    echo ""
    read -p "Enter your GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Click 'Settings' tab"
echo "3. Scroll to 'Pages' section"
echo "4. Set Source to 'Deploy from a branch'"
echo "5. Select 'main' branch"
echo "6. Click 'Save'"
echo ""
echo "Your app will be available at:"
echo "https://YOUR_USERNAME.github.io/content-integration-flow"
echo ""
echo "🎉 Happy sharing!"