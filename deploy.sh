#!/bin/bash

# GitHub Pages Deployment Script for Zoomies Beta
echo "🚀 Deploying Zoomies Beta to GitHub Pages..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Commit and push changes
    echo "📝 Committing changes..."
    git add .
    git commit -m "Deploy to GitHub Pages: $(date)"
    
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    echo "🎉 Deployment complete!"
    echo "🌐 Your site should be available at: https://zoomiesdev.github.io/zoomies-beta/"
    echo "⏰ It may take a few minutes for changes to appear."
else
    echo "❌ Build failed! Please check for errors."
    exit 1
fi
