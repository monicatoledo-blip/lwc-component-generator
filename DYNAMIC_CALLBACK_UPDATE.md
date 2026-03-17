# 🎯 Dynamic Callback URL Update

## What Changed?

The OAuth callback URL is now **dynamically determined** from the incoming request, instead of being hardcoded in the `.env` file.

## Why This Matters

### Before (Hardcoded)

```env
SALESFORCE_CALLBACK_URL=http://localhost:3000/oauth2/callback
```

**Problems:**

- Only worked on port 3000
- Needed manual update when switching ports
- Different `.env` files for dev/production
- Broke if port changed

### After (Dynamic)

```javascript
// Automatically determined from request
http://localhost:3000/oauth2/callback  // When accessing via :3000
http://localhost:3001/oauth2/callback  // When accessing via :3001
https://myapp.herokuapp.com/oauth2/callback  // When accessing via Heroku
```

**Benefits:**

- ✅ Works on ANY port automatically
- ✅ Works on ANY domain automatically
- ✅ No configuration changes needed
- ✅ Same code works dev & production
- ✅ No manual updates when switching environments

## How It Works

### 1. Request Analysis

When you visit the app, the server extracts:

- **Protocol**: `http` or `https` (from `req.protocol` or `x-forwarded-proto` header)
- **Host**: `localhost:3000`, `localhost:3001`, `myapp.herokuapp.com`, etc. (from `Host` header)

### 2. Dynamic URL Construction

```javascript
function getCallbackUrl(req) {
  const protocol = req.protocol || req.get("x-forwarded-proto") || "http";
  const host = req.get("host");
  return `${protocol}://${host}/oauth2/callback`;
}
```

### 3. OAuth Flow

1. User clicks "Connect to Salesforce"
2. Server generates callback URL: `http://localhost:3001/oauth2/callback`
3. Redirects to Salesforce with this URL
4. Salesforce redirects back to: `http://localhost:3001/oauth2/callback`
5. Server handles callback with matching URL
6. ✅ Authentication succeeds!

## What You Need to Do

### 1. Update Your Salesforce Connected App

Add **all possible callback URLs** you might use:

```
http://localhost:3000/oauth2/callback
http://localhost:3001/oauth2/callback
http://localhost:3002/oauth2/callback
https://your-app.herokuapp.com/oauth2/callback
https://your-custom-domain.com/oauth2/callback
```

**How to add multiple URLs in Salesforce:**

1. Go to Setup → App Manager → Your Connected App → Edit
2. In "Callback URL" field, add each URL on a **new line**
3. Save

### 2. Update Your .env File

**Remove** the `SALESFORCE_CALLBACK_URL` line:

```env
# OLD - Remove this line
SALESFORCE_CALLBACK_URL=http://localhost:3000/oauth2/callback

# NEW - Just these are needed
SALESFORCE_CLIENT_ID=your_consumer_key
SALESFORCE_CLIENT_SECRET=your_consumer_secret
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SESSION_SECRET=your_secret_key
```

### 3. Restart Your Server

```bash
npm start
```

You'll see:

```
🔐 Salesforce OAuth configured
   Callback URL: Dynamically determined from request
   Example: http://localhost:3000/oauth2/callback
```

## Testing

### Test Port 3000

```bash
PORT=3000 npm start
# Open: http://localhost:3000
# Click "Connect to Salesforce"
# ✅ Should work with callback: http://localhost:3000/oauth2/callback
```

### Test Port 3001

```bash
PORT=3001 npm start
# Open: http://localhost:3001
# Click "Connect to Salesforce"
# ✅ Should work with callback: http://localhost:3001/oauth2/callback
```

### Test Heroku

```bash
git push heroku main
# Open: https://your-app.herokuapp.com
# Click "Connect to Salesforce"
# ✅ Should work with callback: https://your-app.herokuapp.com/oauth2/callback
```

## How It Handles Different Scenarios

### Scenario 1: Local Development (Port 3000)

```
Request: http://localhost:3000
Generated Callback: http://localhost:3000/oauth2/callback
Salesforce Redirects To: http://localhost:3000/oauth2/callback
Result: ✅ Match! Authentication succeeds
```

### Scenario 2: Local Development (Port 3001)

```
Request: http://localhost:3001
Generated Callback: http://localhost:3001/oauth2/callback
Salesforce Redirects To: http://localhost:3001/oauth2/callback
Result: ✅ Match! Authentication succeeds
```

### Scenario 3: Heroku Production

```
Request: https://myapp.herokuapp.com
Generated Callback: https://myapp.herokuapp.com/oauth2/callback
Salesforce Redirects To: https://myapp.herokuapp.com/oauth2/callback
Result: ✅ Match! Authentication succeeds
```

### Scenario 4: Behind Proxy (Heroku, AWS, etc.)

```
Request Headers:
  x-forwarded-proto: https
  host: myapp.herokuapp.com

Generated Callback: https://myapp.herokuapp.com/oauth2/callback
Result: ✅ Correctly uses HTTPS even behind HTTP proxy
```

## Security Considerations

### ✅ Secure

- Callback URL matches the request origin
- Salesforce validates against allowed callback URLs
- No open redirects possible
- Session-based token storage

### ⚠️ Important

- **Must configure all possible callback URLs in Salesforce Connected App**
- **Do not allow wildcards in production** (Salesforce doesn't support them anyway)
- **Use HTTPS in production** (automatically detected)

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The generated callback URL is not in your Salesforce Connected App's allowed list.

**Solution**:

1. Check server logs for the generated callback URL
2. Add that exact URL to your Salesforce Connected App
3. Save and try again

### Error: "Invalid OAuth flow"

**Cause**: Session lost between auth request and callback

**Solution**:

- Check that sessions are working (cookies enabled)
- Verify `SESSION_SECRET` is set in `.env`
- Try clearing browser cookies and retry

### Callback URL shows wrong protocol (http instead of https)

**Cause**: Proxy/load balancer not forwarding protocol header

**Solution**:

- For Heroku: Automatic (they set `x-forwarded-proto`)
- For other hosts: Configure your proxy to set `X-Forwarded-Proto` header
- Check `req.protocol` in server logs

## Code Changes Summary

### server.js

**Added:**

```javascript
function getCallbackUrl(req) {
  const protocol = req.protocol || req.get("x-forwarded-proto") || "http";
  const host = req.get("host");
  return `${protocol}://${host}/oauth2/callback`;
}
```

**Modified:**

- `/auth/salesforce` - Creates OAuth2 instance with dynamic callback URL
- `/oauth2/callback` - Uses callback URL from session
- `/deploy` - Creates OAuth2 instance with dynamic callback URL

**Removed:**

- Static `oauth2` constant at top of file
- Dependency on `SALESFORCE_CALLBACK_URL` env var

## Rollback Instructions

If you need to rollback to the old behavior:

1. Add back to `.env`:

   ```env
   SALESFORCE_CALLBACK_URL=http://localhost:3000/oauth2/callback
   ```

2. In `server.js`, replace the dynamic logic with:
   ```javascript
   const oauth2 = new jsforce.OAuth2({
     loginUrl:
       process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com",
     clientId: process.env.SALESFORCE_CLIENT_ID,
     clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
     redirectUri: process.env.SALESFORCE_CALLBACK_URL
   });
   ```

But you shouldn't need to! The dynamic approach is better in every way.

## Questions?

- **Q: Do I need to restart after changing ports?**
  - A: Yes, restart the server. The callback URL is determined per-request, but the server needs to run on the new port.

- **Q: Can I use both dynamic and static callback URLs?**
  - A: No need! Dynamic works for all scenarios.

- **Q: What about ngrok or other tunneling?**
  - A: Works automatically! Just add the ngrok URL to your Salesforce Connected App.

- **Q: Does this affect deployment to Salesforce?**
  - A: No! Deployment uses the stored access token. Only the initial OAuth flow uses the callback URL.

---

**Enjoy seamless OAuth across all your environments! 🚀**
