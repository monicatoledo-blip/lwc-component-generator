# LWC Template Guidelines

## Overview

This document outlines the **mandatory structure** and best practices for creating Lightning Web Component (LWC) templates that work with our LWC Generator. Following these guidelines ensures components render correctly with dynamic colors, images, and properties when deployed to Salesforce.

---

## Template Structure

Each LWC template must contain **four files** in a folder named after the component:

```
templates/
  └── componentNameLwc/
      ├── componentNameLwc.html          # HTML template
      ├── componentNameLwc.js            # JavaScript controller
      ├── componentNameLwc.css           # Styles
      └── componentNameLwc.js-meta.xml   # Metadata configuration
```

**Naming Convention**: All filenames must match the folder name exactly (case-sensitive).

---

## 1. HTML Template (.html)

### ✅ DO: Use Proper LWC Syntax

#### Dynamic Property Binding

Use **single curly braces** for text interpolation:

```html
<h1>{contactName}</h1>
<p>{contactTitle}</p>
```

#### Image Binding

Bind image sources **without quotes or braces**:

```html
<!-- ✅ CORRECT -->
<img src="{avatarUrl}" alt="Avatar" />

<!-- ❌ WRONG -->
<img src="{avatarUrl}" alt="Avatar" />
<img src="{{{avatarUrl}}}" alt="Avatar" />
```

#### Dynamic Style Binding

For dynamic colors, fonts, or measurements, **always use computed getters**:

```html
<!-- ✅ CORRECT: Binding to a computed style getter -->
<div class="profile-card" style="{containerStyle}">
  <span class="badge" style="{badgeStyle}">{badgeText}</span>
</div>

<!-- ❌ WRONG: Direct property interpolation in style attributes -->
<div style="background: {bgColor}; color: {textColor};">
  <div style="background-color: {{{bgColor}}};"></div>
</div>
```

### Container Element Requirements

The **outermost `<div>`** must:

1. Have a descriptive class name
2. Use `style={containerStyle}` if the component has dynamic background/text colors
3. Wrap all component content

**Example:**

```html
<template>
  <div class="profile-card" style="{containerStyle}">
    <!-- Component content -->
  </div>
</template>
```

---

## 2. JavaScript Controller (.js)

### Import Statement

```javascript
import { LightningElement, api } from "lwc";
```

### Exposed Properties with Handlebars Templates

All customizable properties must be decorated with `@api` and use **triple-brace Handlebars syntax** `{{{ }}}` as default values:

```javascript
export default class ComponentNameLwc extends LightningElement {
  // Text properties
  @api contactName = "{{{contactName}}}";
  @api contactTitle = "{{{contactTitle}}}";

  // Image URLs
  @api avatarUrl = "{{{avatarUrl}}}";

  // Colors
  @api bgColor = "{{{bgColor}}}";
  @api textColor = "{{{textColor}}}";

  // Numbers
  @api ringPercentage = "{{{ringPercentage}}}";
}
```

### ✅ REQUIRED: Computed Style Getters (for dynamic colors)

If your component has **dynamic background colors, text colors, or inline styles**, you **MUST** add computed getters:

```javascript
// Computed style getters with FALLBACK COLORS
get containerStyle() {
  return `background: ${this.bgColor || '#6B46C1'}; color: ${this.textColor || '#FFFFFF'};`;
}

get badgeStyle() {
  return `background: ${this.badgeBgColor || '#FFD700'}; color: ${this.badgeTextColor || '#000000'};`;
}

get sliderFillStyle() {
  return `width: ${this.sliderPercentage || 85}%; background-color: ${this.sliderFillColor || '#00AC5B'};`;
}
```

**Why getters are required:**

- LWC does not support direct property interpolation in style attributes
- Getters provide fallback values to prevent transparent/blank rendering
- They compile CSS strings dynamically based on `@api` properties

### Default Fallback Colors

Always provide fallback hex values using the `||` operator:

| Property         | Default Color | Hex Code  |
| ---------------- | ------------- | --------- |
| Background       | Purple        | `#6B46C1` |
| Text             | White         | `#FFFFFF` |
| Badge Background | Gold          | `#FFD700` |
| Badge Text       | Black         | `#000000` |
| Slider Fill      | Green         | `#00AC5B` |
| Ring Progress    | Blue          | `#2A94D6` |
| Ring Background  | Light Gray    | `#E0E0E0` |

---

## 3. CSS Styles (.css)

### Scoped Styling

All CSS is **automatically scoped** to the component. Write normal CSS:

```css
.profile-card {
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.contact-name {
  font-size: 24px;
  font-weight: 700;
}
```

### Color Properties

**Avoid hardcoding colors in CSS** if they should be customizable. Instead:

- Define them as `@api` properties in the JS file
- Apply them via computed style getters in the HTML

---

## 4. Metadata File (.js-meta.xml)

### Basic Structure

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
        <target>lightning__HomePage</target>
    </targets>
    <targetConfigs>
        <targetConfig
      targets="lightning__RecordPage,lightning__AppPage,lightning__HomePage"
    >
            <!-- Exposed properties appear here -->
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

### Exposing Properties

For each `@api` property in the JS file, add a corresponding `<property>` element:

```xml
<property name="contactName" type="String" label="Contact Name" default="John Doe" />
<property name="bgColor" type="String" label="Background Color" default="#6B46C1" />
<property name="avatarUrl" type="String" label="Avatar URL" default="https://example.com/avatar.png" />
```

**Property Types:**

- `String` - Text, URLs, hex colors
- `Integer` - Whole numbers
- `Boolean` - true/false values

---

## Handlebars Template Compilation

The LWC Generator uses **Handlebars.js** to compile templates with user-provided data.

### In Template Files

Use **triple-brace syntax** `{{{ }}}` for all properties that will be dynamically replaced:

```javascript
// In .js file
@api contactName = '{{{contactName}}}';
@api avatarUrl = '{{{avatarUrl}}}';
```

**Why triple braces?** They prevent HTML escaping, allowing URLs and special characters to render correctly.

### In server.js

The compilation process looks like this:

```javascript
const jsCompiled = Handlebars.compile(jsTemplate)(templateData);
const htmlCompiled = Handlebars.compile(htmlTemplate)(templateData);
```

Where `templateData` is the form data submitted by the user.

---

## Complete Example: Unified Profile LWC

### unifiedProfileLwc.html

```html
<template>
  <div class="profile-card" style="{containerStyle}">
    <div class="header-section">
      <img src="{avatarUrl}" alt="Avatar" class="avatar-image" />
      <h1 class="contact-name">{contactName}</h1>
      <span class="badge" style="{badgeStyle}">{badgeText}</span>
    </div>
  </div>
</template>
```

### unifiedProfileLwc.js

```javascript
import { LightningElement, api } from "lwc";

export default class UnifiedProfileLwc extends LightningElement {
  // Properties with Handlebars placeholders
  @api avatarUrl = "{{{avatarUrl}}}";
  @api contactName = "{{{contactName}}}";
  @api badgeText = "{{{badgeText}}}";
  @api bgColor = "{{{bgColor}}}";
  @api textColor = "{{{textColor}}}";
  @api badgeBgColor = "{{{badgeBgColor}}}";
  @api badgeTextColor = "{{{badgeTextColor}}}";

  // REQUIRED: Computed style getters with fallbacks
  get containerStyle() {
    return `background: ${this.bgColor || "#6B46C1"}; color: ${this.textColor || "#FFFFFF"};`;
  }

  get badgeStyle() {
    return `background: ${this.badgeBgColor || "#FFD700"}; color: ${this.badgeTextColor || "#000000"};`;
  }
}
```

### unifiedProfileLwc.js-meta.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
    </targets>
    <targetConfigs>
        <targetConfig targets="lightning__RecordPage">
            <property
        name="avatarUrl"
        type="String"
        label="Avatar URL"
        default="https://via.placeholder.com/80"
      />
            <property
        name="contactName"
        type="String"
        label="Contact Name"
        default="Rachel Adams"
      />
            <property
        name="badgeText"
        type="String"
        label="Badge Text"
        default="VIP"
      />
            <property
        name="bgColor"
        type="String"
        label="Background Color"
        default="#6B46C1"
      />
            <property
        name="textColor"
        type="String"
        label="Text Color"
        default="#FFFFFF"
      />
            <property
        name="badgeBgColor"
        type="String"
        label="Badge Background"
        default="#FFD700"
      />
            <property
        name="badgeTextColor"
        type="String"
        label="Badge Text Color"
        default="#000000"
      />
        </targetConfig>
    </targetConfigs>
</LightningComponentBundle>
```

---

## Common Mistakes to Avoid

### ❌ WRONG: Invalid Style Binding

```html
<!-- Invalid LWC syntax -->
<div style="background: {bgColor};">
  <div style="background-color: {{{bgColor}}};"></div>
</div>
```

### ❌ WRONG: Missing Fallback Colors

```javascript
// No fallback - component will be transparent if property is empty
get containerStyle() {
  return `background: ${this.bgColor}; color: ${this.textColor};`;
}
```

### ❌ WRONG: Hardcoded Colors in CSS

```css
/* Should be dynamic via JS getters instead */
.profile-card {
  background: #6b46c1;
  color: white;
}
```

### ❌ WRONG: Using Double Braces in JavaScript

```javascript
// Wrong - double braces don't prevent HTML escaping
@api avatarUrl = '{{avatarUrl}}';
```

---

## Deployment Checklist

Before deploying a new LWC template, verify:

- [ ] All four files (.html, .js, .css, .js-meta.xml) exist and follow naming conventions
- [ ] HTML uses `style={getter}` syntax for dynamic styles
- [ ] Images use `src={property}` without quotes
- [ ] JavaScript has `@api` properties with `{{{ }}}` Handlebars placeholders
- [ ] All style getters include fallback colors with `||` operator
- [ ] Metadata XML exposes all customizable properties
- [ ] API version is set to `60.0` in metadata
- [ ] Default property values in metadata match fallback colors in JS
- [ ] **NEW REQUIREMENT**: All external image CDN domains are added to CSP Trusted Sites (see below)

---

## 🚨 CRITICAL: CSP Trusted Sites for External Images

Salesforce's **Content Security Policy (CSP)** blocks external images by default. If your component uses default image URLs from external CDNs, you **MUST** add those domains to the deployment configuration.

### Currently Trusted Domains

The generator automatically adds these domains to every deployment:

| Domain                               | Purpose                                    | Example URL                                                                                                    |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `https://res.cloudinary.com`         | User-uploaded images via Cloudinary        | `https://res.cloudinary.com/abc123/image/upload/avatar.png`                                                    |
| `https://cdn.prod.website-files.com` | Webflow CDN (Agentforce Astro icon, etc.)  | `https://cdn.prod.website-files.com/62ab14c60bfc7da7685ed1fb/68496baad8a54a4d16a18868_Agentforce-RGB-icon.png` |
| `https://image.s4.sfmc-content.com`  | Salesforce Marketing Cloud (Cumulus logos) | `https://image.s4.sfmc-content.com/lib/fe3111727664047b741079/m/1/ccb17401-00ab-42c3-b141-7a1b93f23360.png`    |

### Adding a New CDN Domain

If you're adding a new component with images from a **new external CDN**, follow these steps:

#### 1. Create a CSP Helper Function in `server.js`

Find the CSP helper functions section (search for "CSP TRUSTED SITES") and add:

```javascript
// Helper function to create YourCDN CSP Trusted Site
function createYourCdnCspXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CspTrustedSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <context>All</context>
    <endpointUrl>https://your-cdn-domain.com</endpointUrl>
    <isActive>true</isActive>
</CspTrustedSite>`;
}
```

#### 2. Add to `package.xml`

In the `/deploy` endpoint, find the `packageXml` constant and add your CDN member:

```xml
<types>
    <members>Cloudinary_CDN</members>
    <members>Webflow_CDN</members>
    <members>SFMC_CDN</members>
    <members>YourCDN_Name</members>  <!-- ADD THIS -->
    <name>CspTrustedSite</name>
</types>
```

#### 3. Add to Deployment ZIP

Find the section that creates CSP files and add:

```javascript
cspFolder.file("YourCDN_Name.cspTrustedSite-meta.xml", createYourCdnCspXml());
```

#### 4. Update Console Log

Update the log message to include your new CDN:

```javascript
console.log(
  "📋 Added CSP Trusted Sites (Cloudinary + Webflow + SFMC + YourCDN) to deployment package"
);
```

### Symptoms of Missing CSP Configuration

If you forget to add a CSP Trusted Site, you'll see:

- ✅ The URL appears correctly in Lightning App Builder component properties
- ❌ The image doesn't display on the page (blank space or broken image icon)
- 🔍 Browser console shows: `Refused to load the image ... because it violates the following Content Security Policy directive`

### Testing CSP Configuration

After deployment:

1. Open the component in Lightning App Builder
2. Right-click → **Inspect Element**
3. Check the **Console** tab for CSP errors
4. Verify the image loads correctly in the preview

---

## Testing Your Template

1. **Preview in Generator**: Use the live preview to verify all properties update correctly
2. **Download .zip**: Generate and extract the component to inspect compiled files
3. **Deploy to Salesforce**: Test in a sandbox org before production
4. **Check CSP**: If using external images, ensure CSP Trusted Site is configured for `https://res.cloudinary.com`

---

## Future-Proofing

When adding **new components**, always:

1. Copy the structure from `unifiedProfileLwc` as a starting template
2. Update all occurrences of the component name (case-sensitive)
3. Add the component option to `public/index.html` dropdown
4. Add form inputs for all `@api` properties
5. Update `public/script.js` to handle the new component's preview logic
6. Test locally before deploying

---

## Related Files in Generator

- **Server**: `/server.js` - Handles Handlebars compilation, zip generation, and CSP configuration
  - Search for "CSP TRUSTED SITES" to find helper functions for adding new CDN domains
- **Frontend**: `/public/index.html` - Form inputs for all properties
- **Preview**: `/public/script.js` - Live preview update logic
- **Styles**: `/public/styles.css` - Generator UI styling (not LWC styles)

---

## Questions or Issues?

If a component renders with **transparent backgrounds** or **missing colors** in Salesforce:

1. Verify computed style getters exist in the `.js` file
2. Check that fallback colors are provided with `||` operator
3. Ensure HTML uses `style={getter}` not `style="{property}"`
4. Confirm `.js-meta.xml` has default values for color properties

For **broken image URLs**:

1. Verify `src={property}` syntax (no quotes, no braces)
2. **Check CSP Trusted Sites** - See "CSP Trusted Sites for External Images" section above
3. Ensure the image CDN domain is added to `server.js` helper functions
4. Verify Cloudinary uploads succeeded (check server logs for upload errors)

---

**Last Updated**: March 18, 2026
**LWC Generator Version**: 1.0
**Salesforce API Version**: 60.0
