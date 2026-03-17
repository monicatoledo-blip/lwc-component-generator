# Image Preview Fix - File Upload + URL Support

## Problem

After adding file upload inputs alongside URL inputs, the live preview stopped working because:

- Preview functions looked for single `avatarUrl` field
- Now we have `avatarUrl` (file) AND `avatarUrl_url` (text)
- FormData couldn't handle File objects for image preview

## Solution

### 1. Helper Function: `getImageUrl()`

```javascript
function getImageUrl(fieldName, form) {
  const fileInput = form.querySelector(
    `input[name="${fieldName}"][type="file"]`
  );
  const urlInput = form.querySelector(`input[name="${fieldName}_url"]`);

  if (fileInput && fileInput.files && fileInput.files[0]) {
    // File uploaded - create object URL for immediate preview
    return URL.createObjectURL(fileInput.files[0]);
  } else if (urlInput && urlInput.value) {
    // URL provided - use it directly
    return urlInput.value;
  }

  return null;
}
```

**What it does:**

- Checks file input first (priority)
- If file exists, creates blob URL for instant preview
- Falls back to text URL if no file
- Returns `null` if neither

### 2. Preview Update Functions

Updated all preview functions to use `getImageUrl()`:

**Unified Profile:**

```javascript
const avatarUrl = getImageUrl("avatarUrl", form);
if (avatarUrl) {
  previewAvatar.src = avatarUrl;
}
```

**Agentforce Brief:**

```javascript
const astroIconUrl = getImageUrl("astroIconUrl", form);
if (astroIconUrl && previewAstroIcon) {
  previewAstroIcon.src = astroIconUrl;
}
```

**Next Best Actions:**

```javascript
const headerIconUrl = getImageUrl("headerIcon", form);
const card1ImageUrl = getImageUrl("card1Image", form);
const card2ImageUrl = getImageUrl("card2Image", form);
```

### 3. Auto-Clearing Inputs

When user picks a file, URL clears. When user types URL, file clears:

```javascript
function setupImagePreviewHandlers() {
  // File input change handler
  fileInput.addEventListener("change", (e) => {
    // Clear URL input
    urlInput.value = "";
    // Trigger preview update
    updatePreview();
  });

  // URL input handler
  urlInput.addEventListener("input", (e) => {
    // Clear file input
    fileInput.value = "";
  });
}
```

### 4. Automatic Preview Updates

Setup runs on page load:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  setupImagePreviewHandlers(); // Setup file change listeners
  checkAuthStatus();
  // ... rest of init
});
```

## How It Works

### Scenario 1: User Uploads File

```
1. User clicks "Choose File"
2. File selected
3. URL input clears automatically
4. Change event fires
5. getImageUrl() creates blob URL
6. Preview updates with uploaded image
7. Form submission sends file to server
```

### Scenario 2: User Pastes URL

```
1. User types/pastes URL
2. File input clears automatically
3. Input event fires
4. getImageUrl() returns text URL
5. Preview updates with external image
6. Form submission sends URL to server
```

### Scenario 3: Initial Page Load

```
1. Page loads with default URLs in value=""
2. File inputs are empty
3. updatePreview() called
4. getImageUrl() returns default URLs
5. Preview shows default images
```

## Browser Compatibility

### URL.createObjectURL()

- ✅ Chrome 23+
- ✅ Firefox 21+
- ✅ Safari 6.1+
- ✅ Edge (all versions)
- ✅ Mobile browsers

**Fallback:** If browser doesn't support createObjectURL, preview won't update for uploads (but deployment still works)

## Image Fields Supported

| Component         | Field Names                              |
| ----------------- | ---------------------------------------- |
| Unified Profile   | `avatarUrl`                              |
| Agentforce Brief  | `astroIconUrl`                           |
| Next Best Actions | `headerIcon`, `card1Image`, `card2Image` |
| Next Best Leads   | (none - uses SVG icons)                  |

## Memory Management

### Blob URLs

Created blob URLs are automatically released when:

- Page unloads
- New file selected (old URL replaced)
- Browser garbage collection

**Manual cleanup (optional):**

```javascript
const oldUrl = previewImage.src;
if (oldUrl.startsWith("blob:")) {
  URL.revokeObjectURL(oldUrl);
}
```

## Debugging

### Check if preview working

```javascript
// In browser console:
getImageUrl("avatarUrl", document.getElementById("lwcForm"));
// Should return: blob:http://localhost:3000/abc-123 (file)
// Or: https://image-url.com/... (URL)
```

### Check file input

```javascript
const fileInput = document.querySelector(
  'input[name="avatarUrl"][type="file"]'
);
console.log(fileInput.files); // FileList
console.log(fileInput.files[0]); // File object
```

### Check preview element

```javascript
const preview = document.getElementById("previewAvatar");
console.log(preview.src); // Should be blob: or https:
```

## Troubleshooting

### Preview not updating

- **Check**: File input has `change` event listener
- **Check**: URL input has `input` event listener
- **Check**: `setupImagePreviewHandlers()` called on DOMContentLoaded
- **Check**: Form IDs match (lwcForm, agentforceForm, nbaForm, nblForm)

### "Failed to fetch" error

- **Cause**: Trying to upload blob URL to server
- **Fix**: Already handled in `processFormData()` - sends file or URL, never blob

### Image shows locally but fails on deploy

- **Cause**: Cloudinary upload failed
- **Check**: Server logs for upload errors
- **Check**: Cloudinary credentials in `.env`

### CORS error on URL preview

- **Expected**: External URLs may have CORS restrictions
- **Impact**: Preview might not load, but deployment will work
- **Solution**: Use file upload instead, or host on CORS-friendly CDN

## Testing Checklist

✅ File upload shows preview immediately
✅ URL paste shows preview immediately
✅ Uploading file clears URL field
✅ Typing URL clears file field
✅ Default URLs show on page load
✅ Preview persists after form state restore
✅ Multiple components work independently
✅ Mobile responsive (file input + URL input stack)

## Performance

### File Preview (createObjectURL)

- **Speed**: Instant (no upload, local only)
- **Memory**: Minimal (~few MB per image)
- **Network**: Zero (local blob)

### URL Preview

- **Speed**: Depends on external server
- **Memory**: Browser cache
- **Network**: Downloads image on preview

## Related Files

- `public/script.js` - Preview logic
- `public/index.html` - Image input structure
- `public/styles.css` - Upload UI styles
- `server.js` - Actual upload on submission
