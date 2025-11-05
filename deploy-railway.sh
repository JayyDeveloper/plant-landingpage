#!/bin/bash

# Vibe Newsletter Platform - Railway Deployment Script
# This script automates deployment to Railway

set -e

echo "🚀 Vibe Newsletter Platform - Railway Deployment"
echo "================================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
fi

# Check if logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

echo "✅ Authenticated with Railway"
echo ""

# Check if project exists
if ! railway status &> /dev/null; then
    echo "📦 Creating new Railway project..."
    railway init
    echo "✅ Railway project created"
else
    echo "✅ Using existing Railway project"
fi

echo ""
echo "🔧 Setting up environment variables..."
echo "======================================="
echo ""

# Prompt for API keys
read -p "Enter your OpenAI API key (or press Enter to skip): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    railway variables set OPENAI_API_KEY="$OPENAI_KEY"
    echo "✅ OpenAI API key set"
fi

read -p "Enter your Anthropic API key (or press Enter to skip): " ANTHROPIC_KEY
if [ ! -z "$ANTHROPIC_KEY" ]; then
    railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
    echo "✅ Anthropic API key set"
fi

read -p "Enter your SendGrid API key (or press Enter to skip): " SENDGRID_KEY
if [ ! -z "$SENDGRID_KEY" ]; then
    railway variables set SENDGRID_API_KEY="$SENDGRID_KEY"
    echo "✅ SendGrid API key set"
fi

# Generate JWT secret
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(openssl rand -hex 32)
railway variables set JWT_SECRET="$JWT_SECRET"
echo "✅ JWT secret generated and set"

# Set other environment variables
railway variables set NODE_ENV="production"
railway variables set PORT="5000"
railway variables set WS_PORT="5001"
railway variables set API_VERSION="v1"
railway variables set CORS_ORIGIN="*"
railway variables set ENABLE_AI_GENERATION="true"
railway variables set ENABLE_PLUGINS="true"
railway variables set ENABLE_COLLABORATION="true"

echo "✅ All environment variables configured"
echo ""

# Provision databases (Railway will auto-detect from docker-compose.yml)
echo "🗄️  Railway will provision databases automatically"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
echo "=========================="
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'railway domain' to get your public URL"
echo "2. Run 'railway open' to view your deployment"
echo "3. Run 'railway logs' to view application logs"
echo ""
echo "🎉 Your Vibe Newsletter Platform is live!"
