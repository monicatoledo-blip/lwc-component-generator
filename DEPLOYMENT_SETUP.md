# 1-Click Deploy to Salesforce Setup Guide

This guide explains how to set up and use the "Deploy to Salesforce" feature.

## Prerequisites

- A Salesforce Developer or Production org
- Node.js installed (v14 or higher)
- The app dependencies installed (`npm install`)

## Setup Instructions

### 1. Create a Salesforce Connected App

1. Log into your Salesforce org
2. Go to **Setup** → **App Manager**
3. Click **New Connected App**
4. Fill in the required fields:
   - **Connected App Name**: `Cumulus Component Generator`
   - **API Name**: `Cumulus_Component_Generator`
   - **Contact Email**: Your email
5. Check **Enable OAuth Settings**
6. Set **Callback URL** - Add ALL of these URLs (the app dynamically determines which to use):
   - `http://localhost:3000/oauth2/callback`
   - `http://localhost:3001/oauth2/callback`
   - `https://your-app-name.herokuapp.com/oauth2/callback` (if deploying to Heroku)
   - Add any other ports or domains you might use
7. Select OAuth Scopes:
   - `Access and manage your data (api)`
   - `Perform requests on your behalf at any time (refresh_token, offline_access)`
   - `Access the web browser (web)`
8. Click **Save**
9. Click **Continue**
10. Copy the **Consumer Key** (Client ID)
11. Click **Reveal** and copy the **Consumer Secret** (Client Secret)

### 2. Configure Environment Variables

Update your `.env` file with the credentials:

```env
SALESFORCE_CLIENT_ID=your_consumer_key_here
SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SESSION_SECRET=your_random_secret_key_here
```

**Important**:

- Replace the placeholder values with your actual Connected App credentials
- Keep the `.env` file secure and never commit it to version control
- **No need to set CALLBACK_URL** - it's automatically determined from the request!
- Works seamlessly on any port (3000, 3001, etc.) or domain (localhost, Heroku, etc.)

### 3. Start the Server

```bash
npm start
```

The server will start and display:

```
🚀 LWC Generator Server is running!
📝 Open your browser and navigate to: http://localhost:3000
🔐 Salesforce OAuth configured
   Callback URL: http://localhost:3000/oauth2/callback
```

## Using the Deploy Feature

### First Time Setup

1. Fill out the component form as usual
2. Click the **"🔐 Connect to Salesforce"** button
3. You'll be redirected to Salesforce login
4. Log in and authorize the app
5. You'll be redirected back to the generator

### Deploying a Component

1. Fill out the component form with your customizations
2. Click **"☁️ Deploy to Salesforce"**
3. Wait for the deployment to complete (usually 10-30 seconds)
4. You'll see a success message with the component name
5. The component is now available in your Salesforce org!

### Adding to Lightning Pages

After deployment:

1. Open Lightning App Builder (or Experience Builder for Experience Cloud sites)
2. Edit a Record Page, App Page, or Home Page
3. Find your component in the **Custom** section — use the **search** field if needed
4. Drag it onto the page
5. Save and activate

**Palette labels (not the technical `*.js` bundle name):** Salesforce lists each component by its `masterLabel` from metadata. Look for:

| You built this in the generator | Appears in Salesforce as           |
| ------------------------------- | ---------------------------------- |
| Unified Profile                 | **Unified Profile**                |
| Agentforce Lead Brief           | **Agentforce Lead Brief (Custom)** |
| Next Best Actions               | **Next Best Actions (Custom)**     |
| Next Best Leads                 | **Next Best Leads (Custom)**       |
| Engagement History              | **Engagement History**             |

The technical names (e.g. `engagementHistoryLwc`) do **not** show in the component list—search for the label in the table above.

## Deployment vs Download

### Download (ZIP)

- Creates a `.zip` file you download to your computer
- Requires manual deployment via VS Code and SFDX
- Good for version control and further customization
- Works offline

### Deploy to Salesforce

- Directly deploys to your Salesforce org
- No manual steps required
- Instant availability in Lightning App Builder
- Requires internet connection and OAuth setup

## Troubleshooting

### "Authentication failed"

- Check your Connected App credentials in `.env`
- Ensure the callback URL matches exactly
- Try logging out and reconnecting: `/auth/logout`

### "Deployment failed"

- Check the component name doesn't already exist
- Ensure you have API access in your Salesforce profile
- Check the browser console for detailed error messages

### "Session expired"

- Click the deploy button again to re-authenticate
- Sessions last 24 hours by default

### OAuth Callback Error

- Verify your Connected App includes ALL callback URLs you might use:
  - `http://localhost:3000/oauth2/callback`
  - `http://localhost:3001/oauth2/callback`
  - Your production domain callback URL
- The app automatically detects the correct callback URL from your request
- For local development, use `http://localhost` (not 127.0.0.1)
- Make sure your Salesforce Connected App allows multiple callback URLs

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables in production (Heroku Config Vars, etc.)
- The session secret should be a random, secure string
- OAuth tokens are stored in server sessions, not in browser storage
- Sessions automatically expire after 24 hours

## Production Deployment

For Heroku or other hosting:

1. Set environment variables in your hosting platform:

   ```
   SALESFORCE_CLIENT_ID=xxx
   SALESFORCE_CLIENT_SECRET=xxx
   SALESFORCE_LOGIN_URL=https://login.salesforce.com
   SESSION_SECRET=xxx
   NODE_ENV=production
   ```

2. Add your production callback URL to your Salesforce Connected App:
   - `https://your-app.herokuapp.com/oauth2/callback`
   - The app will automatically use the correct URL based on the request

3. Deploy your app

**No need to configure callback URLs in environment variables** - the app dynamically determines the correct callback URL from each request!

## API Limits

- Metadata API has daily limits based on your Salesforce edition
- Each deployment counts as one API call
- Developer Edition: 5,000 API calls/day
- The app automatically handles deployment status polling

## Support

For issues with:

- OAuth setup: Check Salesforce Connected App configuration
- Deployment errors: Check Salesforce Metadata API documentation
- App functionality: Check server logs and browser console
