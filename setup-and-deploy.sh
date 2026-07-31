#!/bin/bash
# ============================================================
# Pacifika Wear - Complete Setup & Deploy Script
# 
# This script does EVERYTHING for you:
# 1. Installs Fly.io CLI
# 2. Logs you in (opens browser)
# 3. Creates volumes for your database
# 4. Deploys your app to Sydney
#
# Usage:
#   1. Save this file in your project folder
#   2. Open terminal in that folder
#   3. Run: bash setup-and-deploy.sh
# ============================================================

set -e

echo ""
echo "=========================================="
echo "  Pacifika Wear - Deploy to Fly.io"
echo "  Region: Sydney (best for Australia)"
echo "=========================================="
echo ""

# Check if we're in the right folder
if [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from your pacifika-wear project folder"
    echo "(the folder that contains package.json, Dockerfile, and fly.toml)"
    exit 1
fi

# Step 1: Install Fly CLI
echo "Step 1/5: Installing Fly.io CLI..."
if ! command -v flyctl &> /dev/null; then
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
    echo 'export PATH="$HOME/.fly/bin:$PATH"' >> ~/.bashrc
    echo 'export PATH="$HOME/.fly/bin:$PATH"' >> ~/.zshrc 2>/dev/null || true
else
    echo "Fly CLI already installed ✓"
fi

# Step 2: Login
echo ""
echo "Step 2/5: Logging in to Fly.io..."
echo "(A browser window will open - click 'Authorize' and come back here)"
flyctl auth login

# Step 3: Create app
echo ""
echo "Step 3/5: Creating app 'pacifika-wear' in Sydney..."
flyctl apps create pacifika-wear --org personal 2>/dev/null || echo "App already exists, continuing..."

# Step 4: Create volumes for database persistence
echo ""
echo "Step 4/5: Setting up persistent storage..."
flyctl volumes create pacifika_data --region syd --size 1 --app pacifika-wear --yes 2>/dev/null || echo "Volume 'pacifika_data' already exists ✓"
flyctl volumes create pacifika_uploads --region syd --size 1 --app pacifika-wear --yes 2>/dev/null || echo "Volume 'pacifika_uploads' already exists ✓"

# Step 5: Set environment variable and deploy
echo ""
echo "Step 5/5: Deploying your app..."
flyctl secrets set OWNER_UNION_ID=admin_union_id --app pacifika-wear --stage 2>/dev/null || true
flyctl deploy --app pacifika-wear --region syd

echo ""
echo "=========================================="
echo "  DEPLOYED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Your app is live at:"
echo "  https://pacifika-wear.fly.dev"
echo ""
echo "Admin panel:"
echo "  https://pacifika-wear.fly.dev/admin"
echo "  Username: Andamamle1"
echo "  Password: JMA@2008"
echo ""
echo "To view logs: flyctl logs --app pacifika-wear"
echo "To update: flyctl deploy"
echo ""
