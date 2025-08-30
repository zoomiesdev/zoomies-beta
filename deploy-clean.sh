#!/bin/bash

# Clean deployment to GitHub Pages
echo "🚀 Clean deployment to GitHub Pages..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Delete existing gh-pages branch locally and remotely
    echo "🗑️ Cleaning up existing gh-pages branch..."
    git branch -D gh-pages 2>/dev/null || true
    git push origin --delete gh-pages 2>/dev/null || true
    
    # Create new gh-pages branch from scratch
    echo "🌿 Creating clean gh-pages branch..."
    git checkout --orphan gh-pages
    
    # Remove all files
    echo "🧹 Removing all files..."
    git rm -rf . 2>/dev/null || true
    
    # Copy only the built files from dist to root
    echo "📁 Copying built files..."
    cp -r dist/* .
    
    # Remove the dist folder itself
    rm -rf dist
    
    # Add all files
    git add .
    
    # Commit
    echo "📝 Committing built files..."
    git commit -m "Deploy to GitHub Pages: $(date)"
    
    # Push to gh-pages branch
    echo "🚀 Pushing to gh-pages branch..."
    git push origin gh-pages --force
    
    # Switch back to main branch
    echo "🔄 Switching back to main branch..."
    git checkout main
    
    echo "🎉 Clean deployment complete!"
    echo "🌐 Your site should be available at: https://zoomiesdev.github.io/zoomies-beta/"
    echo "📋 IMPORTANT: Make sure GitHub Pages is set to deploy from 'gh-pages' branch"
    echo "🔧 Go to Settings → Pages → Source: 'Deploy from a branch' → Branch: 'gh-pages'"
else
    echo "❌ Build failed! Please check for errors."
    exit 1
fi
