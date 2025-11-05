# 🚀 Quick Start - Deploy in 5 Minutes

## The Fastest Way to Test This Platform

### Option 1: Railway (Recommended)

**Perfect for: Full-stack testing with all features**

```bash
# 1. Run the automated deploy script
./deploy-railway.sh

# 2. Get your URL
railway domain

# 3. Open in browser
railway open
```

**That's it!** Railway handles:
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ MongoDB
- ✅ SSL certificates
- ✅ Public URL

**Cost:** Free (includes $5/month credit)

---

### Option 2: Local Docker (Fastest for Local Testing)

**Perfect for: Development and quick testing**

```bash
# 1. Create backend/.env file
cd backend
cp .env.example .env

# 2. Add your API keys to backend/.env
# OPENAI_API_KEY=sk-...
# SENDGRID_API_KEY=SG...

# 3. Start everything
cd ..
docker-compose up -d

# 4. Open in browser
open http://localhost:3000
```

**Requirements:**
- Docker Desktop installed
- OpenAI API key (get free trial at platform.openai.com)

---

### Option 3: Vercel (Frontend Only)

**Perfect for: Testing the frontend UI**

```bash
# 1. Deploy frontend
cd frontend
npx vercel --prod

# 2. Set environment variables in Vercel dashboard:
# VITE_API_URL = (your backend URL)
# VITE_WS_URL = (your backend WebSocket URL)
```

**Note:** You'll still need to deploy the backend separately (use Railway for backend).

---

## Required API Keys

### Minimum to Test:
1. **OpenAI API Key** (Required for AI features)
   - Get it: https://platform.openai.com/api-keys
   - Free trial: $5 credit

### Optional:
2. **SendGrid API Key** (For actually sending emails)
   - Get it: https://sendgrid.com
   - Free tier: 100 emails/day

3. **Anthropic Claude** (Alternative AI - optional)
   - Get it: https://console.anthropic.com

---

## Testing Without API Keys

Want to test without setting up APIs? You can:

1. **Mock Mode** - Use the platform UI without AI generation
2. **Test Data** - Pre-generated sample newsletters are in `docs/SAMPLE_CONTENT.md`
3. **Static Preview** - View the architecture and design docs

---

## What Can You Do After Deployment?

Once deployed, you can:

1. **Test the Conversational Interface**
   - Describe your newsletter vibe
   - See AI-generated templates

2. **Try Content Generation**
   - Generate headlines
   - Create full newsletter content
   - Rewrite in different tones

3. **Explore the Template System**
   - Browse pre-built templates
   - Customize colors and fonts
   - See responsive previews

4. **View Analytics Dashboard** (after sending)
   - Open rates
   - Click tracking
   - Engagement insights

---

## Quick Links

- **Full Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Architecture Overview**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **See It In Action**: [USER_JOURNEY.md](USER_JOURNEY.md)
- **Sample Content**: [docs/SAMPLE_CONTENT.md](docs/SAMPLE_CONTENT.md)

---

## Troubleshooting

### "Railway command not found"
```bash
npm install -g @railway/cli
```

### "Docker daemon not running"
```bash
# Make sure Docker Desktop is running
open -a Docker
```

### "API key invalid"
- Double-check your OpenAI key at https://platform.openai.com/api-keys
- Make sure it starts with `sk-`

### "Database connection error"
- Railway: Wait 2-3 minutes for databases to provision
- Docker: Run `docker-compose restart`

---

## Need Help?

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
2. Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for technical details
3. Open an issue on GitHub

---

## Recommended: Railway Deployment

**I recommend starting with Railway because:**
- ✅ One command deployment
- ✅ All databases included
- ✅ Free for testing
- ✅ Public URL provided
- ✅ SSL automatic

Run this now:
```bash
./deploy-railway.sh
```

Then visit your URL and start creating newsletters! 🎉
