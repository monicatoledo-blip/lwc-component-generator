# Image Upload & Cloudinary Integration

## Overview

Images can now be uploaded directly or pasted as URLs. Uploaded images are stored on Cloudinary CDN and automatically whitelisted in Salesforce via CSP Trusted Sites.

## How It Works

### 1. Upload or Paste URL

Each image field offers two options:

```
[Choose File] OR [https://image-url.com/...]
```

- **Upload**: Select file → Auto-uploads to Cloudinary → CDN URL injected into component
- **Paste URL**: Enter existing URL → Used directly

### 2. Automatic CSP Whitelisting

When images are uploaded:

- Cloudinary CDN (`https://res.cloudinary.com`) is added to package
- `CspTrustedSite` metadata deployed alongside component
- Images render immediately in Salesforce - no manual whitelisting needed

### 3. Deployment Package Structure

```
package.xml
├── LightningComponentBundle (your component)
└── CspTrustedSite (Cloudinary_CDN)
lwc/
  └── componentName/
      └── (component files with Cloudinary URLs)
cspTrustedSites/
  └── Cloudinary_CDN.cspTrustedSite
```

## Configuration

### Cloudinary Credentials

Already configured in `.env`:

```env
CLOUDINARY_CLOUD_NAME=dfx98jgdc
CLOUDINARY_API_KEY=897599816648957
CLOUDINARY_API_SECRET=iLck4maZrKjNt49MI5b2LaNvszU
```

### Supported Image Fields

- **Unified Profile**: Avatar
- **Agentforce Brief**: Astro Icon
- **Next Best Actions**: Header Icon, Card 1 Image, Card 2 Image
- **Next Best Leads**: (uses inline SVGs, no image uploads)

## Usage

### For Users

1. Click "Choose File" button
2. Select image (JPG, PNG, GIF, WebP)
3. File uploads automatically in background
4. Preview updates with Cloudinary URL
5. Deploy → CSP automatically configured

### File Limits

- **Max size**: 5MB per image
- **Formats**: All image types (`image/*`)
- **Storage**: Cloudinary folder `lwc-generator/`

## API Flow

### Download Flow

```javascript
FormData → multer → Cloudinary upload → Template compilation → ZIP download
```

### Deploy Flow

```javascript
FormData → multer → Cloudinary upload → Template compilation →
Add CSP metadata → Package XML → JSforce deploy
```

## Backend Implementation

### Server Routes

Both `/generate` and `/deploy` use `upload.any()` middleware:

```javascript
app.post("/generate", upload.any(), async (req, res) => {
  // Process uploaded files
  // Upload to Cloudinary
  // Inject URLs into templates
});
```

### CSP Trusted Site XML

```xml
<CspTrustedSite>
  <endpointUrl>https://res.cloudinary.com</endpointUrl>
  <isActive>true</isActive>
  <isApplicableToImgSrc>true</isApplicableToImgSrc>
</CspTrustedSite>
```

### Package.xml (with images)

```xml
<types>
  <members>componentName</members>
  <name>LightningComponentBundle</name>
</types>
<types>
  <members>Cloudinary_CDN</members>
  <name>CspTrustedSite</name>
</types>
```

## Frontend Implementation

### Image Upload UI

```html
<div class="image-upload-group">
  <input type="file" name="avatarUrl" accept="image/*" />
  <span class="file-or-divider">OR</span>
  <input type="text" name="avatarUrl_url" placeholder="https://..." />
</div>
```

### FormData Processing

```javascript
function processFormData(form, componentType) {
  const formData = new FormData(form);

  // If file uploaded, use file
  // If URL provided, use URL
  // Priority: file > URL
}
```

## Security

### File Validation

- **Server-side**: multer fileFilter checks `image/*` mimetype
- **Client-side**: HTML5 `accept="image/*"` attribute
- **Size limit**: 5MB enforced by multer

### CSP Security

- Only `https://res.cloudinary.com` whitelisted
- Applied only to `img-src` directive
- Does not affect other CSP policies

## Cloudinary Features

### Auto-Generated URLs

```
https://res.cloudinary.com/dfx98jgdc/image/upload/v1234567890/lwc-generator/filename.png
```

### Benefits

- ✅ CDN delivery (fast global loading)
- ✅ Automatic optimization
- ✅ HTTPS by default
- ✅ Permanent URLs (don't expire)
- ✅ No CORS issues

## Troubleshooting

### "Only image files allowed"

- Check file extension
- Verify mimetype is `image/*`
- Try different image format

### Images not rendering in Salesforce

- Check deployment logs for CSP metadata
- Verify `Cloudinary_CDN` CSP Trusted Site exists in Setup
- Check browser console for CSP violations

### Upload fails

- Verify Cloudinary credentials in `.env`
- Check Cloudinary quota (free tier: 25GB/month)
- Verify file size under 5MB

### CSP not deploying

- Check package.xml includes CspTrustedSite
- Verify `hasUploadedImages` flag is true
- Check deployment errors in console

## Migration Notes

### Existing URLs Still Work

- Old Salesforce Marketing Cloud URLs work
- Unsplash URLs work
- Any HTTPS image URL works
- Just add to CSP manually if needed

### When CSP Deploys

- **With upload**: Always
- **With URL paste**: Never (manual CSP setup required)
- **Mixed**: CSP added if ANY file uploaded

## Future Enhancements

- [ ] Image preview before upload
- [ ] Drag-and-drop upload
- [ ] Image cropping/editing
- [ ] Multiple CSP domains support
- [ ] Batch upload for NBA cards
- [ ] Image compression options
