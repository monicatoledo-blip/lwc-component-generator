# 🚀 Quick Start: 1-Click Deploy to Salesforce

## TL;DR

The app now has a **"Deploy to Salesforce"** button that instantly deploys components to your Salesforce org. No manual deployment needed!

## What's New?

### ✨ New Features

- **☁️ Deploy to Salesforce** button next to every Download button
- **OAuth2 authentication** with Salesforce
- **Automatic deployment** using Metadata API
- **Session management** (stays logged in for 24 hours)
- **Real-time deployment status** polling

### 🔄 What Stayed the Same

- **All existing functionality works exactly as before**
- **Download ZIP** still works independently
- **Same templates, same components**
- **No breaking changes**

## Getting Started

### Option 1: Just Use Download (No Setup Required)

- Click **"⚡ Download Component (ZIP)"**
- Works exactly as before
- No Salesforce OAuth needed

### Option 2: Enable 1-Click Deploy (Requires Setup)

**Step 1: Create Salesforce Connected App** (5 minutes)

1. In Salesforce Setup → App Manager → New Connected App
2. Enable OAuth Settings
3. Set Callback URLs (add each on a new line):
   - `http://localhost:3000/oauth2/callback`
   - `http://localhost:3001/oauth2/callback`
   - Add your production URL if deploying
4. Add scopes: api, web, refresh_token
5. Copy Consumer Key and Consumer Secret

**Note**: The app automatically detects the correct callback URL - no need to change configuration when switching ports!

**Step 2: Configure Environment**

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
SALESFORCE_CLIENT_ID=paste_your_consumer_key
SALESFORCE_CLIENT_SECRET=paste_your_consumer_secret
```

**Step 3: Start the Server**

```bash
npm start
```

**Step 4: Connect and Deploy**

1. Open http://localhost:3000
2. Fill out a component form
3. Click **"🔐 Connect to Salesforce"**
4. Log in to Salesforce and authorize
5. Click **"☁️ Deploy to Salesforce"**
6. Wait ~20 seconds
7. Done! Component is in your org

## Comparison: Deploy vs Download

| Feature         | Download ZIP            | Deploy to Salesforce |
| --------------- | ----------------------- | -------------------- |
| Setup Required  | None                    | Salesforce OAuth     |
| Speed           | Instant download        | 20-30 seconds        |
| Manual Steps    | Requires VS Code + SFDX | Zero manual steps    |
| Availability    | Local file              | Immediately in org   |
| Version Control | Easy                    | Need to retrieve     |
| Offline         | Works                   | Needs internet       |
| Best For        | Development workflow    | Quick demos/testing  |

## Troubleshooting

### "🔐 Connect to Salesforce" button doesn't work

- Check that `.env` file exists with correct credentials
- Verify callback URL matches in both `.env` and Connected App
- Restart the server after changing `.env`

### Deployment hangs or times out

- Check you have API access in your Salesforce profile
- Ensure component name doesn't already exist
- Check Salesforce system status

### "Session expired" error

- Normal after 24 hours
- Just click deploy button again to re-authenticate

## Files Changed

### New Files

- `DEPLOYMENT_SETUP.md` - Detailed setup guide
- `DEPLOYMENT_FEATURE.md` - Implementation details
- `QUICKSTART.md` - This file
- `.env.example` - Environment variable template

### Modified Files

- `package.json` - Added jsforce, dotenv, express-session
- `server.js` - Added OAuth routes and deployment endpoint
- `public/index.html` - Added deploy buttons
- `public/script.js` - Added deploy handlers
- `public/styles.css` - Added deploy button styles
- `.env` - Added OAuth credentials

### Unchanged Files

- All template files (unifiedProfileLwc, agentforceLeadBriefLwc, etc.)
- All LWC generation logic
- All existing routes and functionality

## Next Steps

1. **Read DEPLOYMENT_SETUP.md** for detailed Connected App setup
2. **Configure your .env file** with OAuth credentials
3. **Test the feature** by deploying a component
4. **Use both features** - deploy for quick testing, download for production

## Support

- Setup issues? See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md)
- Technical details? See [DEPLOYMENT_FEATURE.md](DEPLOYMENT_FEATURE.md)
- Questions? Check server logs and browser console

---

**Happy deploying! ⚡☁️**
