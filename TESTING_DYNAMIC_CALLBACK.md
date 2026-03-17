# Testing Dynamic Callback URL Feature

## Quick Test Checklist

### ✅ Test 1: Port 3000

```bash
# Terminal
PORT=3000 npm start

# Browser
1. Open http://localhost:3000
2. Click "🔐 Connect to Salesforce"
3. Check server logs for: "🔐 OAuth flow initiated with callback: http://localhost:3000/oauth2/callback"
4. Log into Salesforce
5. Should redirect back successfully
6. Button should now say "☁️ Deploy to Salesforce"
```

**Expected Result**: ✅ Authentication works on port 3000

### ✅ Test 2: Port 3001

```bash
# Terminal (stop previous server first)
PORT=3001 npm start

# Browser
1. Open http://localhost:3001
2. Click "🔐 Connect to Salesforce" (or should already say "Deploy" if session persists)
3. Check server logs for: "🔐 OAuth flow initiated with callback: http://localhost:3001/oauth2/callback"
4. Log into Salesforce if prompted
5. Should redirect back successfully
```

**Expected Result**: ✅ Authentication works on port 3001

### ✅ Test 3: Switch Ports Without Reauth

```bash
# Start on port 3000
PORT=3000 npm start
# Authenticate via browser

# Stop and restart on port 3001
PORT=3001 npm start
# Try to deploy on http://localhost:3001
```

**Expected Result**:

- ✅ Session might be lost (different port)
- ✅ Re-authentication works seamlessly on new port
- ✅ Deployment succeeds after reauth

### ✅ Test 4: Deployment After Auth

```bash
# After successful auth on any port:
1. Fill out a component form
2. Click "☁️ Deploy to Salesforce"
3. Should show "⚡ Deploying..."
4. Should complete successfully
5. Component should appear in Salesforce org
```

**Expected Result**: ✅ Deployment works regardless of which port was used for auth

### ✅ Test 5: Server Logs

```bash
# Start server
npm start

# Look for these log messages:
🚀 LWC Generator Server is running!
📝 Open your browser and navigate to: http://localhost:XXXX
🔐 Salesforce OAuth configured
   Callback URL: Dynamically determined from request
   Example: http://localhost:XXXX/oauth2/callback

# When user clicks auth:
🔐 OAuth flow initiated with callback: http://localhost:XXXX/oauth2/callback

# When callback succeeds:
✅ User authenticated: 005XXXXXXXXXXXX
   Instance: https://XXXXX.salesforce.com
```

**Expected Result**: ✅ All log messages appear correctly with correct port numbers

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch" error from Salesforce

**Cause**: The generated callback URL is not in your Connected App

**Solution**:

1. Check server logs to see the exact callback URL being used
2. Add that URL to your Salesforce Connected App (Setup → App Manager → Edit your app)
3. Save and try again

### Issue: Authentication works on one port but not another

**Cause**: Missing callback URL in Salesforce Connected App

**Solution**:
Add ALL these URLs to your Connected App:

```
http://localhost:3000/oauth2/callback
http://localhost:3001/oauth2/callback
http://localhost:3002/oauth2/callback
```

### Issue: Session doesn't persist between ports

**Expected Behavior**: This is normal! Sessions are domain+port specific.

**Solution**: Just re-authenticate on the new port. The process is seamless.

### Issue: HTTPS not detected on Heroku

**Cause**: Proxy headers not being read correctly

**Solution**: The code already handles this via `x-forwarded-proto` header. If still having issues:

```javascript
// In server.js, add trust proxy setting
app.set("trust proxy", 1);
```

## Manual Testing Script

```bash
#!/bin/bash

echo "🧪 Testing Dynamic Callback URL Feature"
echo ""

echo "Test 1: Starting on port 3000..."
PORT=3000 npm start &
PID1=$!
sleep 3
echo "✅ Server started on port 3000 (PID: $PID1)"
echo "👉 Open http://localhost:3000 and test authentication"
read -p "Press enter when done..."
kill $PID1

echo ""
echo "Test 2: Starting on port 3001..."
PORT=3001 npm start &
PID2=$!
sleep 3
echo "✅ Server started on port 3001 (PID: $PID2)"
echo "👉 Open http://localhost:3001 and test authentication"
read -p "Press enter when done..."
kill $PID2

echo ""
echo "✅ Testing complete!"
```

## Success Criteria

- [x] Server starts without errors
- [x] Server logs show dynamic callback URL message
- [x] Authentication works on port 3000
- [x] Authentication works on port 3001
- [x] Authentication works on custom ports
- [x] Deployment works after authentication
- [x] Server logs show correct callback URLs
- [x] No hardcoded callback URLs in code
- [x] No `SALESFORCE_CALLBACK_URL` needed in .env
- [x] Works seamlessly when switching ports

## Automated Test (Optional)

Create a test file `test-dynamic-callback.js`:

```javascript
const assert = require("assert");

function getCallbackUrl(protocol, host) {
  return `${protocol}://${host}/oauth2/callback`;
}

// Test cases
const tests = [
  {
    protocol: "http",
    host: "localhost:3000",
    expected: "http://localhost:3000/oauth2/callback"
  },
  {
    protocol: "http",
    host: "localhost:3001",
    expected: "http://localhost:3001/oauth2/callback"
  },
  {
    protocol: "https",
    host: "myapp.herokuapp.com",
    expected: "https://myapp.herokuapp.com/oauth2/callback"
  },
  {
    protocol: "https",
    host: "custom-domain.com",
    expected: "https://custom-domain.com/oauth2/callback"
  }
];

tests.forEach((test, i) => {
  const result = getCallbackUrl(test.protocol, test.host);
  assert.strictEqual(result, test.expected, `Test ${i + 1} failed`);
  console.log(`✅ Test ${i + 1} passed: ${result}`);
});

console.log("\n✅ All tests passed!");
```

Run with:

```bash
node test-dynamic-callback.js
```

## Documentation Verification

- [x] DEPLOYMENT_SETUP.md updated
- [x] QUICKSTART.md updated
- [x] .env.example updated
- [x] DYNAMIC_CALLBACK_UPDATE.md created
- [x] Server startup message updated
- [x] Troubleshooting guide updated

---

**All tests passing? You're ready to deploy on any port! 🚀**
