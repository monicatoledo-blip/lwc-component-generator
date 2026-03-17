# Form State Management & OAuth UX

## Overview

The app now preserves user's form data through the OAuth authentication flow using browser `sessionStorage`. When users fill out a form and click "Connect to Salesforce", their data is automatically saved and restored after authentication.

## Features Implemented

### 1. ✅ Auto-Save Form State

- **What**: Form data is automatically saved to `sessionStorage` while you type
- **When**: After 1 second of inactivity on any form field
- **Why**: Prevents data loss during OAuth redirect
- **Storage Key**: `lwc_generator_form_state`

### 2. ✅ Pre-OAuth Save

- **What**: Form data is explicitly saved before redirecting to Salesforce
- **When**: User clicks "🔐 Connect to Salesforce" button
- **Why**: Ensures data is captured right before leaving the page
- **Storage Key**: `lwc_generator_auth_pending` (flag to track OAuth in progress)

### 3. ✅ Auto-Restore on Return

- **What**: Form data is automatically restored after OAuth completes
- **When**: User returns from Salesforce OAuth flow
- **Why**: Seamless experience - user continues where they left off
- **Includes**:
  - Component type (Unified Profile, Agentforce, etc.)
  - All text inputs
  - All color pickers
  - All textareas
  - All dropdowns

### 4. ✅ Post-Deployment Cleanup

- **What**: Form state is cleared from `sessionStorage` after successful deployment
- **When**: Deployment succeeds
- **Why**: Clean slate for next component, prevents stale data

### 5. ✅ Visual Authentication Status

- **What**: Clear indicator showing if user is connected to Salesforce
- **Where**: Top control bar with status indicator
- **States**:
  - 🔴 "Not connected" (gray dot)
  - 🟢 "Connected to Salesforce" (green dot with glow)
  - "Checking connection..." (initial state)

### 6. ✅ Smart Notifications

- **What**: Toast notifications for important events
- **Types**:
  - **Success** (green): Successful deployment, successful authentication
  - **Info** (blue): Redirecting to OAuth, loading states
  - **Error** (red): Deployment failures, authentication errors
- **Auto-dismiss**: 4 seconds (6 seconds for errors)

### 7. ✅ Session Expiry Handling

- **What**: Automatically re-authenticates if session expires during deployment
- **Behavior**: Saves form, redirects to OAuth, restores form, retries deployment
- **User experience**: Seamless - they don't lose their work

## User Flow Examples

### Flow 1: New User - First Time Connecting

```
1. User fills out Unified Profile form
   ↓ (auto-saves to sessionStorage every 1 second)
2. User clicks "🔐 Connect to Salesforce"
   ↓ (saves form state)
   ↓ (sets auth_pending flag)
   ↓ (shows "Redirecting..." notification)
3. Redirects to Salesforce login
   ↓
4. User logs into Salesforce
   ↓
5. Redirects back to app with ?auth=success
   ↓
6. App restores form state automatically
   ↓ (restores component type)
   ↓ (restores all field values)
   ↓ (updates live preview)
7. Shows "✅ Connected to Salesforce! Your form data has been restored."
8. Status indicator shows 🟢 "Connected to Salesforce"
9. Button now says "☁️ Deploy to Salesforce"
```

### Flow 2: Authenticated User - Direct Deploy

```
1. User fills out form (already authenticated)
2. User clicks "☁️ Deploy to Salesforce"
   ↓ (no OAuth redirect needed)
3. Shows "⚡ Deploying..."
   ↓ (20-30 seconds)
4. Shows "✅ Success! ComponentName deployed to Salesforce!"
5. Clears form state from sessionStorage
6. Button resets to "☁️ Deploy to Salesforce"
```

### Flow 3: Session Expired - Auto Re-auth

```
1. User fills out form (was authenticated, but session expired)
2. User clicks "☁️ Deploy to Salesforce"
3. Server returns 401 Unauthorized
   ↓
4. App detects session expiry
   ↓ (saves current form state)
   ↓ (sets auth_pending flag)
5. Shows "Session expired. Redirecting to re-authenticate..."
   ↓
6. Redirects to Salesforce OAuth
   ↓
7. User logs in again
   ↓
8. Redirects back to app
   ↓
9. App restores form state
10. Shows "✅ Connected to Salesforce! Your form data has been restored."
11. User can now retry deployment
```

### Flow 4: Page Refresh

```
1. User fills out form (auto-saved to sessionStorage)
2. User accidentally refreshes page (F5 / Cmd+R)
   ↓
3. Page reloads
   ↓
4. App checks for saved form state
   ↓
5. Finds saved state (less than 1 hour old)
   ↓
6. Restores form automatically
7. User's work is preserved!
```

## Technical Implementation

### SessionStorage Keys

```javascript
const FORM_STATE_KEY = "lwc_generator_form_state";
const AUTH_PENDING_KEY = "lwc_generator_auth_pending";
```

### Saved Form State Structure

```json
{
  "componentType": "unifiedProfileLwc",
  "fields": {
    "contactName": "Rachel Adams",
    "contactTitle": "VP of Finance, Apex Manufacturing",
    "bgColor": "#2a94d6",
    "field1Label": "Customer ID",
    "field1Value": "C-58392"
    // ... all other form fields
  },
  "timestamp": 1710876543210
}
```

### Functions

#### `saveFormState()`

```javascript
// Saves current form data to sessionStorage
// Called automatically on input (debounced 1 second)
// Called explicitly before OAuth redirect
```

#### `restoreFormState()`

```javascript
// Restores form data from sessionStorage
// Called on page load
// Called after successful OAuth callback
// Respects 1-hour expiration
// Switches to correct component type
// Populates all form fields
// Triggers preview updates
```

#### `clearFormState()`

```javascript
// Removes saved data from sessionStorage
// Called after successful deployment
// Prevents stale data on next use
```

#### `showNotification(message, type)`

```javascript
// Shows toast notification
// Types: 'success', 'info', 'error'
// Auto-dismisses after 4-6 seconds
// Replaces any existing notification
```

### Event Listeners

```javascript
// Auto-save on input (debounced)
document.addEventListener("input", (e) => {
  if (e.target.matches("input, select, textarea")) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveFormState();
    }, 1000);
  }
});

// Save before OAuth redirect
async function handleDeploy(buttonElement) {
  if (!isAuthenticated) {
    saveFormState();
    sessionStorage.setItem(AUTH_PENDING_KEY, "true");
    window.location.href = "/auth/salesforce";
    return;
  }
  // ... deployment logic
}

// Restore after OAuth callback
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("auth") === "success") {
    checkAuthStatus().then(() => {
      restoreFormState();
    });
  } else {
    restoreFormState();
  }
});
```

## UI Components

### Authentication Status Indicator

**Location**: Top right of component control bar

**States**:

```html
<!-- Not Connected -->
<div class="auth-status-indicator disconnected">
  <span class="auth-status-dot"></span>
  <span class="auth-status-text">Not connected</span>
</div>

<!-- Connected -->
<div class="auth-status-indicator connected">
  <span class="auth-status-dot"></span>
  <span class="auth-status-text">Connected to Salesforce</span>
</div>
```

**Styles**:

- Gray dot: Not connected
- Green dot with glow: Connected
- White background, rounded pill shape
- Responsive: centers on mobile

### Deploy Button States

**Not Authenticated**:

```html
<button class="deploy-btn not-authenticated">🔐 Connect to Salesforce</button>
```

**Authenticated**:

```html
<button class="deploy-btn authenticated">☁️ Deploy to Salesforce</button>
```

- Includes green indicator dot in top-right corner when authenticated

### Notification Toasts

**Position**: Fixed top-right corner

**Animations**:

- Slide in from right
- Slide out to right on dismiss

**Styles**:

- Success: Green background (`#00ac5b`)
- Info: Blue background (`#2a94d6`)
- Error: Red background (`#c23934`)
- White text, rounded corners, shadow

## Data Persistence

### What Gets Saved

✅ Component type selection
✅ All text inputs (name, title, labels, values)
✅ All color pickers (hex values)
✅ All textareas (descriptions, context)
✅ All dropdowns (if any)

### What Doesn't Get Saved

❌ Live preview state (regenerated on restore)
❌ Authentication tokens (stored server-side in session)
❌ Deployment history
❌ Server-side state

### Expiration

- Form state expires after **1 hour**
- Old state is automatically discarded
- Prevents restoring stale data from days ago

## Browser Compatibility

### SessionStorage Support

- ✅ Chrome 5+
- ✅ Firefox 3.5+
- ✅ Safari 4+
- ✅ Edge (all versions)
- ✅ iOS Safari 3.2+
- ✅ Android Browser 2.1+

### Fallback Behavior

If `sessionStorage` is not available (very rare):

- Form state won't be saved
- User must refill form after OAuth
- App still functions normally
- Error logged to console

## Testing

### Manual Test Cases

**Test 1: OAuth Flow**

1. Fill out Unified Profile form with custom data
2. Click "🔐 Connect to Salesforce"
3. Log into Salesforce
4. Return to app
5. ✅ Verify all form fields are restored
6. ✅ Verify live preview matches
7. ✅ Verify notification appears

**Test 2: Page Refresh**

1. Fill out form
2. Wait 2 seconds (auto-save)
3. Press F5 to refresh
4. ✅ Verify form data is restored

**Test 3: Component Switch**

1. Fill out Unified Profile form
2. Wait 2 seconds
3. Refresh page
4. ✅ Verify it switches back to Unified Profile
5. ✅ Verify all fields restored

**Test 4: Successful Deployment**

1. Fill out form (authenticated)
2. Deploy successfully
3. ✅ Verify sessionStorage is cleared
4. Refresh page
5. ✅ Verify form shows defaults (not previous data)

**Test 5: Session Expiry**

1. Authenticate
2. Wait 25 hours (or simulate by deleting server session)
3. Fill out form
4. Click Deploy
5. ✅ Verify auto re-authentication
6. ✅ Verify form data preserved
7. ✅ Can retry deployment after re-auth

**Test 6: Multiple Components**

1. Fill out Unified Profile
2. Switch to Agentforce Brief
3. Fill out Agentforce Brief
4. Refresh page
5. ✅ Verify Agentforce data restored (last active)

**Test 7: Expiration**

1. Fill out form
2. Close browser
3. Wait 2 hours
4. Reopen app
5. ✅ Verify stale data not restored

### Developer Tools Testing

```javascript
// Check saved state
console.log(sessionStorage.getItem("lwc_generator_form_state"));

// Manually restore state
restoreFormState();

// Clear state
clearFormState();

// Simulate expired state
const state = JSON.parse(sessionStorage.getItem("lwc_generator_form_state"));
state.timestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
sessionStorage.setItem("lwc_generator_form_state", JSON.stringify(state));
location.reload();
```

## Troubleshooting

### Form data not restored after OAuth

**Possible causes**:

1. SessionStorage disabled in browser
2. Private/incognito mode with strict settings
3. State expired (>1 hour old)
4. JavaScript error before restore

**Solutions**:

- Check browser console for errors
- Verify sessionStorage is enabled
- Try in normal (non-incognito) mode
- Check timestamp in saved state

### Notification not appearing

**Possible causes**:

1. CSS not loaded
2. JavaScript error
3. Notification removed too quickly

**Solutions**:

- Check browser console
- Verify `showNotification()` is called
- Check CSS animations are working

### Auth status not updating

**Possible causes**:

1. `/auth/status` endpoint failing
2. JavaScript error in `checkAuthStatus()`
3. Session not properly stored

**Solutions**:

- Check network tab for `/auth/status` call
- Check server logs
- Verify session middleware is working

## Future Enhancements

### Potential Improvements

- [ ] Save to `localStorage` for longer persistence
- [ ] Multiple saved states (history)
- [ ] "Restore previous" button
- [ ] Export/import form configurations
- [ ] Undo/redo functionality
- [ ] Form validation before OAuth redirect

### Advanced Features

- [ ] Cloud sync across devices
- [ ] Collaborative editing
- [ ] Template library
- [ ] A/B test different configurations

## Security Considerations

### Safe Data

✅ Form field values (component names, colors, text)
✅ Component type selection
✅ UI preferences

### Never Saved

❌ OAuth tokens (server-side only)
❌ Salesforce credentials
❌ Session IDs
❌ API keys

### Storage Location

- **SessionStorage**: Cleared when browser tab closes
- **Scope**: Same origin only (protocol + domain + port)
- **Size limit**: 5-10 MB per origin
- **Encryption**: Not encrypted, but non-sensitive data only

## Summary

The form state management system provides a **seamless OAuth experience** by:

1. ✅ **Automatically saving** user work while they type
2. ✅ **Preserving data** through OAuth redirects
3. ✅ **Restoring state** when user returns
4. ✅ **Cleaning up** after successful operations
5. ✅ **Clear visual feedback** on connection status
6. ✅ **Handling edge cases** like session expiry

Users can now **confidently authenticate** without losing their work! 🎉
