# Deployment Guide - Vibe Newsletter Platform

## Quick Deploy Options

### 🚀 Option 1: Railway (Recommended for Full Stack)

**Why Railway?** Supports everything: databases, WebSocket, Docker, long-running processes.

#### Step-by-Step:

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
cd plant-landingpage
railway init
```

4. **Add Environment Variables**
```bash
railway variables set OPENAI_API_KEY=your-key
railway variables set ANTHROPIC_API_KEY=your-key
railway variables set SENDGRID_API_KEY=your-key
railway variables set JWT_SECRET=$(openssl rand -hex 32)
```

5. **Provision Databases**
```bash
# Railway will automatically detect and provision:
# - PostgreSQL
# - Redis
# - MongoDB
railway up
```

6. **Deploy**
```bash
railway up
```

7. **Get Your URLs**
```bash
railway domain
# Will provide public URLs for your services
```

**Cost:** Free tier includes $5/month credit (enough for testing)

**Deployment Time:** ~5 minutes

---

### 🌐 Option 2: Hybrid - Vercel (Frontend) + Railway (Backend)

**Best for:** Production-ready deployment with Vercel's CDN

#### A. Deploy Backend to Railway

```bash
# From project root
cd backend
railway login
railway init
railway up

# Add environment variables
railway variables set OPENAI_API_KEY=your-key
railway variables set CORS_ORIGIN=https://your-app.vercel.app

# Get backend URL
railway domain
# Note this URL (e.g., https://your-app.railway.app)
```

#### B. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From frontend directory
cd frontend

# Create vercel.json
```

Then deploy:
```bash
vercel --prod
```

**Environment Variables in Vercel Dashboard:**
- `VITE_API_URL`: Your Railway backend URL
- `VITE_WS_URL`: Your Railway WebSocket URL

---

### 🐳 Option 3: Render (Alternative to Railway)

#### Using Render Blueprint

1. **Create account** at [render.com](https://render.com)

2. **Connect GitHub repo**

3. **Create services:**
   - Web Service (Backend)
   - Static Site (Frontend)
   - PostgreSQL Database
   - Redis Instance

4. **Environment Variables** (in Render dashboard):
```
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
SENDGRID_API_KEY=your-key
DATABASE_URL=<auto-provided>
REDIS_URL=<auto-provided>
```

**Cost:** Free tier available

---

### 💻 Option 4: Local Docker (For Development)

**Fastest for local testing:**

```bash
# From project root
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Backend health: http://localhost:5000/health
```

**Requirements:**
- Docker Desktop installed
- 4GB RAM minimum

---

## Environment Variables Needed

### Required for Core Functionality:
```bash
# AI Services (Required)
OPENAI_API_KEY=sk-...              # Get from platform.openai.com
ANTHROPIC_API_KEY=sk-ant-...       # Get from console.anthropic.com

# Email Sending (Required for sending newsletters)
SENDGRID_API_KEY=SG...             # Get from sendgrid.com

# Security (Required)
JWT_SECRET=<random-32-char-string> # Generate: openssl rand -hex 32
```

### Optional (Enhance Features):
```bash
# Media Services
CLOUDINARY_CLOUD_NAME=...          # For image hosting
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
UNSPLASH_ACCESS_KEY=...            # For stock photos

# External APIs
GIPHY_API_KEY=...                  # For GIFs
```

### Auto-Configured (Handled by Platform):
```bash
# Databases (auto-provisioned by Railway/Render)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MONGODB_URL=mongodb://...
```

---

## Recommended: Railway Deployment

**I recommend Railway because:**
1. ✅ Supports our entire stack (databases, WebSocket, Docker)
2. ✅ One command deployment
3. ✅ Free $5/month credit (sufficient for testing)
4. ✅ Automatic SSL certificates
5. ✅ Built-in monitoring
6. ✅ Easy environment variable management

### Quick Railway Deploy Script:

```bash
#!/bin/bash
# deploy-railway.sh

echo "🚀 Deploying Vibe Newsletter Platform to Railway..."

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login
echo "Please login to Railway..."
railway login

# Initialize project
railway init

# Set environment variables
echo "Setting environment variables..."
echo "Please enter your OpenAI API key:"
read OPENAI_KEY
railway variables set OPENAI_API_KEY=$OPENAI_KEY

echo "Please enter your SendGrid API key:"
read SENDGRID_KEY
railway variables set SENDGRID_API_KEY=$SENDGRID_KEY

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)
railway variables set JWT_SECRET=$JWT_SECRET

# Deploy
echo "Deploying..."
railway up

echo "✅ Deployment complete!"
echo "Run 'railway domain' to get your public URL"
```

---

## Testing Checklist

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app.railway.app/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-05T...",
#   "uptime": 123.45,
#   "environment": "production"
# }
```

---

## Troubleshooting

### Issue: "Database connection failed"
**Solution:** Ensure Railway provisioned the databases. Run:
```bash
railway run env
# Should show DATABASE_URL, REDIS_URL, MONGODB_URL
```

### Issue: "AI content generation timeout"
**Solution:** Increase function timeout in Railway settings:
- Settings → Environment → Timeout → Set to 300s

### Issue: "CORS error in frontend"
**Solution:** Set correct CORS_ORIGIN:
```bash
railway variables set CORS_ORIGIN=https://your-frontend-url.vercel.app
```

---

## Cost Estimates

### Railway (Recommended):
- **Free Tier:** $5/month credit
  - Includes: 512MB RAM, shared CPU
  - Good for: Testing, demos
  - Estimated usage: ~$3-4/month

- **Developer Plan:** $20/month
  - Includes: 8GB RAM, more CPU
  - Good for: Production with moderate traffic

### Vercel + Railway:
- **Vercel:** Free for hobby projects
- **Railway:** $5 credit/month
- **Total:** ~$3-4/month for testing

### Full Production (Estimated):
- Backend hosting: $20-50/month
- Databases: $10-30/month
- Email (SendGrid): $15/month (40k emails)
- OpenAI API: Pay per use (~$0.002/request)
- **Total:** ~$50-100/month

---

## Next Steps

1. **Sign up for Railway:** https://railway.app
2. **Get API Keys:**
   - OpenAI: https://platform.openai.com
   - SendGrid: https://sendgrid.com
3. **Run deployment script** (above)
4. **Test the platform**
5. **Share your feedback!**

Need help with deployment? Let me know which option you prefer!
