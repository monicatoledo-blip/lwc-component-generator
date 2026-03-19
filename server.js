require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const os = require("os");
const Handlebars = require("handlebars");
const JSZip = require("jszip");
const jsforce = require("jsforce");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Heroku, AWS, etc. (enables req.protocol and x-forwarded-* headers)
app.set("trust proxy", 1);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads (disk storage with temp directory)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (Cloudinary constraint)
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  }
});

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "cumulus-financial-lwc-generator-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Function to find available port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = app
      .listen(startPort, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      })
      .on("error", () => {
        resolve(findAvailablePort(startPort + 1));
      });
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Serve the form
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Generate LWC endpoint with file upload support
app.post(
  "/generate",
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            error: "File too large",
            message:
              "Image file must be smaller than 10MB. Please compress your image or use a smaller file."
          });
        }
        if (err.name === "MulterError") {
          return res.status(400).json({
            success: false,
            error: "Upload error",
            message: err.message
          });
        }
        return res.status(500).json({
          success: false,
          error: "Upload failed",
          message: err.message
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const formData = req.body;
      const componentType = formData.componentType || "unifiedProfileLwc";

      // Prepare template data based on component type
      let templateData = { ...formData };

      // =====================================================================
      // IMAGE UPLOAD PATTERN - TESTED & WORKING (DO NOT MODIFY)
      // =====================================================================
      // This pattern has been battle-tested with the Unified Profile component.
      //
      // HTML FORM STRUCTURE:
      //   <input type="file" name="avatarUrl" />      ← File upload
      //   <input type="text" name="avatarUrl_url" />  ← URL fallback
      //
      // BACKEND LOGIC:
      //   1. Process all uploaded files first (this loop)
      //   2. Skip empty file inputs (user left blank)
      //   3. Upload non-empty files to Cloudinary
      //   4. After loop: merge *_url fields for fields without uploaded files
      //
      // RESULT: User can mix & match uploads and URLs in the same form
      // =====================================================================

      // Process uploaded images and upload to Cloudinary
      if (req.files && req.files.length > 0) {
        console.log(`📸 Processing ${req.files.length} uploaded image(s)...`);

        for (const file of req.files) {
          // Skip empty files (user left file input blank, will use URL instead)
          // IMPORTANT: Multer creates entries with size=0 for blank file inputs
          if (!file.path || file.size === 0) {
            console.log(
              `⏭️  Skipping empty file input for ${file.fieldname}, will use URL if provided`
            );
            continue; // Skip to next file
          }

          try {
            const cloudinaryUrl = await uploadToCloudinary(
              file.path,
              file.originalname
            );
            console.log(`✅ Uploaded ${file.fieldname}: ${cloudinaryUrl}`);

            // Replace the field value with the Cloudinary URL
            templateData[file.fieldname] = cloudinaryUrl;
          } catch (uploadError) {
            console.error(
              `❌ Failed to upload ${file.fieldname}:`,
              uploadError.message
            );
            // Keep the original value if upload fails
          }
        }
      }

      // =====================================================================
      // URL FALLBACK PATTERN - TESTED & WORKING (DO NOT MODIFY)
      // =====================================================================
      // After processing file uploads, merge URL fields for images that weren't uploaded.
      //
      // LOGIC:
      //   - Look for fields ending with "_url" (e.g., "avatarUrl_url")
      //   - Extract base field name (e.g., "avatarUrl")
      //   - If base field is empty AND URL field has value → use the URL
      //   - If base field has value (file was uploaded) → skip (file takes priority)
      //
      // EXAMPLE:
      //   User uploads card1Image → uses Cloudinary URL
      //   User leaves card2Image blank but provides card2Image_url → uses that URL
      //
      // This is why Unified Profile works perfectly with mixed uploads!
      // =====================================================================

      // Merge URL fields for any image fields that weren't uploaded
      console.log("🔍 Checking for URL fields...");
      console.log("📋 Form data keys:", Object.keys(formData));
      Object.keys(formData).forEach((key) => {
        if (key.endsWith("_url")) {
          const baseFieldName = key.replace("_url", "");
          console.log(`   Found ${key} = ${formData[key]}`);
          console.log(
            `   Current ${baseFieldName} value = ${templateData[baseFieldName]}`
          );
          if (!templateData[baseFieldName] && formData[key]) {
            templateData[baseFieldName] = formData[key];
            console.log(`✅ Using URL for ${baseFieldName}: ${formData[key]}`);
          } else if (templateData[baseFieldName]) {
            console.log(
              `⏭️  Skipping ${baseFieldName} - already has value (file uploaded)`
            );
          }
        }
      });

      // For Unified Profile, calculate ring dash offset
      if (componentType === "unifiedProfileLwc") {
        const ringPercentage = parseFloat(formData.ringPercentage) || 0;
        const circumference = 251.2;
        const ringDashOffset =
          circumference - (circumference * ringPercentage) / 100;
        templateData.ringDashOffset = ringDashOffset.toFixed(2);
      }

      // Read template files
      const templatesDir = path.join(__dirname, "templates", componentType);
      const htmlTemplate = await fs.readFile(
        path.join(templatesDir, `${componentType}.html`),
        "utf-8"
      );
      const jsTemplate = await fs.readFile(
        path.join(templatesDir, `${componentType}.js`),
        "utf-8"
      );
      const cssTemplate = await fs.readFile(
        path.join(templatesDir, `${componentType}.css`),
        "utf-8"
      );
      const metaTemplate = await fs.readFile(
        path.join(templatesDir, `${componentType}.js-meta.xml`),
        "utf-8"
      );

      // Debug: Log avatarUrl being used for template compilation
      console.log(`🖼️  Avatar URL for deployment: ${templateData.avatarUrl}`);

      // Helper function to escape XML entities
      function escapeXml(str) {
        if (typeof str !== "string") return str;
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      }

      // Helper function to escape JavaScript string literals
      function escapeJs(str) {
        if (typeof str !== "string") return str;
        return str
          .replace(/\\/g, "\\\\") // Backslash must be first
          .replace(/'/g, "\\'") // Escape single quotes
          .replace(/"/g, '\\"') // Escape double quotes
          .replace(/\n/g, "\\n") // Escape newlines
          .replace(/\r/g, "\\r") // Escape carriage returns
          .replace(/\t/g, "\\t"); // Escape tabs
      }

      // Create XML-safe version of templateData for meta.xml (escape all string values)
      const templateDataXmlSafe = {};
      Object.keys(templateData).forEach((key) => {
        templateDataXmlSafe[key] = escapeXml(templateData[key]);
      });

      // Create JS-safe version of templateData for .js file (escape string literals)
      const templateDataJsSafe = {};
      Object.keys(templateData).forEach((key) => {
        templateDataJsSafe[key] = escapeJs(templateData[key]);
      });

      // Compile templates with Handlebars
      const htmlCompiled = Handlebars.compile(htmlTemplate)(templateData);
      const jsCompiled = Handlebars.compile(jsTemplate)(templateDataJsSafe); // Use JS-safe data for .js
      const cssCompiled = Handlebars.compile(cssTemplate)(templateData);
      const metaCompiled =
        Handlebars.compile(metaTemplate)(templateDataXmlSafe); // Use XML-safe data for meta.xml

      // Create ZIP file
      const zip = new JSZip();
      const lwcFolder = zip.folder(componentType);

      lwcFolder.file(`${componentType}.html`, htmlCompiled);
      lwcFolder.file(`${componentType}.js`, jsCompiled);
      lwcFolder.file(`${componentType}.css`, cssCompiled);
      lwcFolder.file(`${componentType}.js-meta.xml`, metaCompiled);

      // Generate ZIP
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Send ZIP file
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${componentType}.zip`
      );
      res.send(zipBuffer);
    } catch (error) {
      console.error("Error generating LWC:", error);
      res
        .status(500)
        .json({ error: "Failed to generate LWC", details: error.message });
    }
  }
);

// Helper function to upload image to Cloudinary using disk-based upload
async function uploadToCloudinary(filePath, originalName) {
  try {
    console.log(
      `📤 Uploading ${originalName} to Cloudinary from ${filePath}...`
    );

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "lwc-generator",
      public_id: `${Date.now()}-${originalName.replace(/\.[^/.]+$/, "")}`,
      resource_type: "image"
    });

    console.log(`✅ Upload successful: ${result.secure_url}`);

    // Clean up temp file after successful upload
    try {
      fsSync.unlinkSync(filePath);
      console.log(`🗑️  Cleaned up temp file: ${filePath}`);
    } catch (unlinkError) {
      console.warn(
        `⚠️  Could not delete temp file ${filePath}:`,
        unlinkError.message
      );
    }

    return result.secure_url;
  } catch (error) {
    // Clean up temp file even if upload fails
    try {
      fsSync.unlinkSync(filePath);
      console.log(`🗑️  Cleaned up temp file after error: ${filePath}`);
    } catch (unlinkError) {
      console.warn(
        `⚠️  Could not delete temp file ${filePath}:`,
        unlinkError.message
      );
    }

    // Throw detailed Cloudinary error
    const errorMessage = error.message || error.error?.message || String(error);
    console.error(
      `❌ Cloudinary upload failed for ${originalName}:`,
      errorMessage
    );
    throw new Error(`Cloudinary upload failed: ${errorMessage}`);
  }
}

// Helper function to get dynamic callback URL from request
function getCallbackUrl(req) {
  // Get protocol (http or https)
  const protocol = req.protocol || req.get("x-forwarded-proto") || "http";

  // Get host (includes port if present)
  const host = req.get("host");

  // Construct full callback URL
  return `${protocol}://${host}/oauth2/callback`;
}

// =====================================================================
// CSP TRUSTED SITES - FUTURE COMPONENT DEVELOPERS READ THIS!
// =====================================================================
// When adding new LWC components with external images, you MUST:
// 1. Identify the CDN domain(s) used for default images in the form
// 2. Create a new helper function below for that domain
// 3. Add the member name to the package.xml (search "CspTrustedSite")
// 4. Add the cspFolder.file() call in the /deploy endpoint
//
// Current trusted domains (always included):
// - res.cloudinary.com (uploaded images)
// - cdn.prod.website-files.com (Webflow CDN - Agentforce Astro icon)
// - image.s4.sfmc-content.com (Salesforce Marketing Cloud - Cumulus logos)
// - images.unsplash.com (Unsplash - Next Best Actions card images)
//
// DYNAMIC WHITELISTING:
// The deployment logic automatically detects image URLs in form data and
// adds their domains to CSP Trusted Sites. Users can paste ANY image URL!
// =====================================================================

// Helper function to create Cloudinary CSP Trusted Site
function createCloudinaryCspXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CspTrustedSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <context>All</context>
    <endpointUrl>https://res.cloudinary.com</endpointUrl>
    <isActive>true</isActive>
</CspTrustedSite>`;
}

// Helper function to create Webflow CDN CSP Trusted Site
function createWebflowCspXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CspTrustedSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <context>All</context>
    <endpointUrl>https://cdn.prod.website-files.com</endpointUrl>
    <isActive>true</isActive>
</CspTrustedSite>`;
}

// Helper function to create Salesforce Marketing Cloud CSP Trusted Site
function createSfmcCspXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CspTrustedSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <context>All</context>
    <endpointUrl>https://image.s4.sfmc-content.com</endpointUrl>
    <isActive>true</isActive>
</CspTrustedSite>`;
}

// Helper function to create Unsplash CSP Trusted Site
function createUnsplashCspXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CspTrustedSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <context>All</context>
    <endpointUrl>https://images.unsplash.com</endpointUrl>
    <isActive>true</isActive>
</CspTrustedSite>`;
}

// Helper function to create dynamic CSP Trusted Site for any URL
function createDynamicCspXml(url) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CspTrustedSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <context>All</context>
    <endpointUrl>${url}</endpointUrl>
    <isActive>true</isActive>
</CspTrustedSite>`;
}

// Helper function to extract unique image domains from form data
function extractImageDomains(templateData) {
  const domains = new Set();
  const urlPattern = /^https?:\/\/([^\/]+)/i;

  // List of known image field patterns
  const imageFields = [
    "avatarUrl",
    "astroIconUrl",
    "headerIcon",
    "card1Image",
    "card2Image",
    "lead1Avatar",
    "lead2Avatar",
    "lead3Avatar"
  ];

  Object.keys(templateData).forEach((key) => {
    // Check if it's a potential image field (contains common image field names or ends with Url/Icon/Image/Avatar)
    const isImageField =
      imageFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      ) ||
      key.toLowerCase().endsWith("url") ||
      key.toLowerCase().endsWith("icon") ||
      key.toLowerCase().endsWith("image") ||
      key.toLowerCase().endsWith("avatar");

    if (isImageField && typeof templateData[key] === "string") {
      const match = templateData[key].match(urlPattern);
      if (match) {
        const protocol = match[0].split("//")[0]; // http: or https:
        const domain = match[1];
        const baseUrl = `${protocol}//${domain}`;
        domains.add(baseUrl);
      }
    }
  });

  return Array.from(domains);
}

// Check authentication status
app.get("/auth/status", (req, res) => {
  res.json({
    authenticated: !!req.session.accessToken,
    instanceUrl: req.session.instanceUrl || null
  });
});

// Initiate Salesforce OAuth flow
app.get("/auth/salesforce", (req, res) => {
  // Store the component data in session if provided
  if (req.query.componentData) {
    req.session.pendingComponentData = req.query.componentData;
  }

  // Get dynamic callback URL based on current request
  const callbackUrl = getCallbackUrl(req);

  // Store callback URL in session for use in callback handler
  req.session.oauthCallbackUrl = callbackUrl;

  // Debug: Log environment variable status
  console.log("🔍 OAuth Environment Check:");
  console.log("   Client ID exists:", !!process.env.SALESFORCE_CLIENT_ID);
  console.log(
    "   Client Secret exists:",
    !!process.env.SALESFORCE_CLIENT_SECRET
  );
  console.log(
    "   Login URL:",
    process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com"
  );
  console.log("   Callback URL:", callbackUrl);

  // Create OAuth2 instance with dynamic callback URL
  const oauth2 = new jsforce.OAuth2({
    loginUrl:
      process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com",
    clientId: process.env.SALESFORCE_CLIENT_ID,
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
    redirectUri: callbackUrl
  });

  const authUrl = oauth2.getAuthorizationUrl({
    scope: "api web refresh_token"
  });

  console.log(`🔐 OAuth flow initiated with callback: ${callbackUrl}`);
  console.log(`🔗 Auth URL: ${authUrl}`);
  res.redirect(authUrl);
});

// OAuth2 callback handler
app.get("/oauth2/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code not provided");
  }

  try {
    // Retrieve the callback URL from session (set during /auth/salesforce)
    const callbackUrl = req.session.oauthCallbackUrl || getCallbackUrl(req);

    // Create OAuth2 instance with the same callback URL used for authorization
    const oauth2 = new jsforce.OAuth2({
      loginUrl:
        process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com",
      clientId: process.env.SALESFORCE_CLIENT_ID,
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
      redirectUri: callbackUrl
    });

    const conn = new jsforce.Connection({
      oauth2,
      version: "60.0"
    });
    const userInfo = await conn.authorize(code);

    // Store credentials in session
    req.session.accessToken = conn.accessToken;
    req.session.refreshToken = conn.refreshToken;
    req.session.instanceUrl = conn.instanceUrl;
    req.session.userId = userInfo.id;

    console.log("✅ User authenticated:", userInfo.id);
    console.log(`   Instance: ${conn.instanceUrl}`);

    // Redirect back to the app
    res.redirect("/?auth=success");
  } catch (error) {
    console.error("❌ OAuth error:", error);
    res.redirect("/?auth=error");
  }
});

// Logout route
app.get("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/");
  });
});

// Deploy to Salesforce endpoint with file upload support
app.post(
  "/deploy",
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            error: "File too large",
            message:
              "Image file must be smaller than 10MB. Please compress your image or use a smaller file."
          });
        }
        if (err.name === "MulterError") {
          return res.status(400).json({
            success: false,
            error: "Upload error",
            message: err.message
          });
        }
        return res.status(500).json({
          success: false,
          error: "Upload failed",
          message: err.message
        });
      }
      next();
    });
  },
  async (req, res) => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 DEPLOY REQUEST RECEIVED");
    console.log("=".repeat(60));
    console.log("Component Type:", req.body.componentType);
    console.log("Has Session:", !!req.session);
    console.log("Has Access Token:", !!req.session?.accessToken);
    console.log("=".repeat(60) + "\n");

    try {
      // Check authentication
      if (!req.session.accessToken) {
        return res.status(401).json({
          error: "Not authenticated",
          message: "Please authenticate with Salesforce first"
        });
      }

      const formData = req.body;
      const componentType = formData.componentType || "unifiedProfileLwc";

      // Prepare template data based on component type
      let templateData = { ...formData };

      // =====================================================================
      // IMAGE UPLOAD PATTERN - TESTED & WORKING (DO NOT MODIFY)
      // =====================================================================
      // This pattern has been battle-tested with the Unified Profile component.
      //
      // HTML FORM STRUCTURE:
      //   <input type="file" name="avatarUrl" />      ← File upload
      //   <input type="text" name="avatarUrl_url" />  ← URL fallback
      //
      // BACKEND LOGIC:
      //   1. Process all uploaded files first (this loop)
      //   2. Skip empty file inputs (user left blank)
      //   3. Upload non-empty files to Cloudinary
      //   4. After loop: merge *_url fields for fields without uploaded files
      //
      // RESULT: User can mix & match uploads and URLs in the same form
      // =====================================================================

      // Process uploaded images and upload to Cloudinary
      let hasUploadedImages = false;
      if (req.files && req.files.length > 0) {
        console.log(
          `📸 Processing ${req.files.length} uploaded image(s) for deployment...`
        );

        for (const file of req.files) {
          console.log(
            `   File: ${file.fieldname}, Size: ${file.size} bytes, Type: ${file.mimetype}`
          );

          // Skip empty files (user left file input blank, will use URL instead)
          // IMPORTANT: Multer creates entries with size=0 for blank file inputs
          if (!file.path || file.size === 0) {
            console.log(
              `⏭️  Skipping empty file input for ${file.fieldname}, will use URL if provided`
            );
            continue; // Skip to next file
          }

          try {
            const cloudinaryUrl = await uploadToCloudinary(
              file.path,
              file.originalname
            );
            console.log(`✅ Uploaded ${file.fieldname}: ${cloudinaryUrl}`);

            // Replace the field value with the Cloudinary URL
            templateData[file.fieldname] = cloudinaryUrl;
            hasUploadedImages = true;
          } catch (uploadError) {
            const errorMessage = uploadError.message || String(uploadError);
            console.error(
              `❌ Failed to upload ${file.fieldname}:`,
              uploadError
            );
            return res.status(500).json({
              success: false,
              error: "Image upload failed",
              message: `Failed to upload ${file.fieldname}: ${errorMessage}`
            });
          }
        }
      }

      // =====================================================================
      // URL FALLBACK PATTERN - TESTED & WORKING (DO NOT MODIFY)
      // =====================================================================
      // After processing file uploads, merge URL fields for images that weren't uploaded.
      //
      // LOGIC:
      //   - Look for fields ending with "_url" (e.g., "avatarUrl_url")
      //   - Extract base field name (e.g., "avatarUrl")
      //   - If base field is empty AND URL field has value → use the URL
      //   - If base field has value (file was uploaded) → skip (file takes priority)
      //
      // EXAMPLE:
      //   User uploads card1Image → uses Cloudinary URL
      //   User leaves card2Image blank but provides card2Image_url → uses that URL
      //
      // This is why Unified Profile works perfectly with mixed uploads!
      // =====================================================================

      // Merge URL fields for any image fields that weren't uploaded
      console.log("🔍 Checking for URL fields...");
      console.log("📋 Form data keys:", Object.keys(formData));
      Object.keys(formData).forEach((key) => {
        if (key.endsWith("_url")) {
          const baseFieldName = key.replace("_url", "");
          console.log(`   Found ${key} = ${formData[key]}`);
          console.log(
            `   Current ${baseFieldName} value = ${templateData[baseFieldName]}`
          );
          if (!templateData[baseFieldName] && formData[key]) {
            templateData[baseFieldName] = formData[key];
            console.log(`✅ Using URL for ${baseFieldName}: ${formData[key]}`);
          } else if (templateData[baseFieldName]) {
            console.log(
              `⏭️  Skipping ${baseFieldName} - already has value (file uploaded)`
            );
          }
        }
      });

      // For Unified Profile, calculate ring dash offset
      if (componentType === "unifiedProfileLwc") {
        const ringPercentage = parseFloat(formData.ringPercentage) || 0;
        const circumference = 251.2;
        const ringDashOffset =
          circumference - (circumference * ringPercentage) / 100;
        templateData.ringDashOffset = ringDashOffset.toFixed(2);
      }

      // Read template files
      const templatesDir = path.join(__dirname, "templates", componentType);
      const htmlTemplate = await fs.readFile(
        path.join(templatesDir, `${componentType}.html`),
        "utf-8"
      );
      const jsTemplate = await fs.readFile(
        path.join(templatesDir, `${componentType}.js`),
        "utf-8"
      );
      const cssTemplate = await fs.readFile(
        path.join(templatesDir, `${componentType}.css`),
        "utf-8"
      );
      const metaTemplate = await fs.readFile(
        path.join(templatesDir, `${componentType}.js-meta.xml`),
        "utf-8"
      );

      // Debug: Log avatarUrl being used for template compilation
      console.log(`🖼️  Avatar URL for deployment: ${templateData.avatarUrl}`);

      // Helper function to escape XML entities
      function escapeXml(str) {
        if (typeof str !== "string") return str;
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      }

      // Helper function to escape JavaScript string literals
      function escapeJs(str) {
        if (typeof str !== "string") return str;
        return str
          .replace(/\\/g, "\\\\") // Backslash must be first
          .replace(/'/g, "\\'") // Escape single quotes
          .replace(/"/g, '\\"') // Escape double quotes
          .replace(/\n/g, "\\n") // Escape newlines
          .replace(/\r/g, "\\r") // Escape carriage returns
          .replace(/\t/g, "\\t"); // Escape tabs
      }

      // Create XML-safe version of templateData for meta.xml (escape all string values)
      const templateDataXmlSafe = {};
      Object.keys(templateData).forEach((key) => {
        templateDataXmlSafe[key] = escapeXml(templateData[key]);
      });

      // Create JS-safe version of templateData for .js file (escape string literals)
      const templateDataJsSafe = {};
      Object.keys(templateData).forEach((key) => {
        templateDataJsSafe[key] = escapeJs(templateData[key]);
      });

      // Compile templates with Handlebars
      const htmlCompiled = Handlebars.compile(htmlTemplate)(templateData);
      const jsCompiled = Handlebars.compile(jsTemplate)(templateDataJsSafe); // Use JS-safe data for .js
      const cssCompiled = Handlebars.compile(cssTemplate)(templateData);
      const metaCompiled =
        Handlebars.compile(metaTemplate)(templateDataXmlSafe); // Use XML-safe data for meta.xml

      // Extract image domains from templateData for dynamic CSP whitelisting
      const imageDomains = extractImageDomains(templateData);
      console.log("🔍 Detected image domains:", imageDomains);

      // Build CSP members list (known domains + dynamic domains)
      const knownDomains = {
        "https://res.cloudinary.com": "Cloudinary_CDN",
        "https://cdn.prod.website-files.com": "Webflow_CDN",
        "https://image.s4.sfmc-content.com": "SFMC_CDN",
        "https://images.unsplash.com": "Unsplash_CDN"
      };

      const cspMembers = [...Object.values(knownDomains)]; // Always include known domains
      const dynamicDomains = [];

      // Add dynamic domains (skip if already in known domains)
      imageDomains.forEach((domain) => {
        if (!knownDomains[domain]) {
          const safeName = domain.replace(/[^a-zA-Z0-9]/g, "_"); // Replace special chars with underscore
          cspMembers.push(safeName);
          dynamicDomains.push({ url: domain, name: safeName });
        }
      });

      console.log("📋 CSP members to include:", cspMembers);
      console.log(
        "✨ Dynamic domains:",
        dynamicDomains.map((d) => d.url)
      );

      // Build package.xml dynamically
      const cspMemberTags = cspMembers
        .map((member) => `        <members>${member}</members>`)
        .join("\n");
      const packageXml = `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>LightningComponentBundle</name>
    </types>
    <types>
${cspMemberTags}
        <name>CspTrustedSite</name>
    </types>
    <version>60.0</version>
</Package>`;

      // Create ZIP for Metadata API deployment
      const zip = new JSZip();

      // Add package.xml at root
      zip.file("package.xml", packageXml);

      // Add LWC files in proper structure
      const lwcFolder = zip.folder("lwc").folder(componentType);
      lwcFolder.file(`${componentType}.html`, htmlCompiled);
      lwcFolder.file(`${componentType}.js`, jsCompiled);
      lwcFolder.file(`${componentType}.css`, cssCompiled);
      lwcFolder.file(`${componentType}.js-meta.xml`, metaCompiled);

      // Add CspTrustedSite metadata - KNOWN DOMAINS
      const cspFolder = zip.folder("cspTrustedSites");
      cspFolder.file(
        "Cloudinary_CDN.cspTrustedSite-meta.xml",
        createCloudinaryCspXml()
      );
      cspFolder.file(
        "Webflow_CDN.cspTrustedSite-meta.xml",
        createWebflowCspXml()
      );
      cspFolder.file("SFMC_CDN.cspTrustedSite-meta.xml", createSfmcCspXml());
      cspFolder.file(
        "Unsplash_CDN.cspTrustedSite-meta.xml",
        createUnsplashCspXml()
      );

      // Add DYNAMIC CSP domains from user URLs
      dynamicDomains.forEach(({ url, name }) => {
        cspFolder.file(
          `${name}.cspTrustedSite-meta.xml`,
          createDynamicCspXml(url)
        );
        console.log(`✅ Added dynamic CSP: ${url} as ${name}`);
      });

      console.log(
        `📋 Added ${cspMembers.length} CSP Trusted Sites (${Object.keys(knownDomains).length} known + ${dynamicDomains.length} dynamic)`
      );

      // Generate ZIP as base64
      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 }
      });
      const zipBase64 = zipBuffer.toString("base64");

      // Get dynamic callback URL for this request
      const callbackUrl = getCallbackUrl(req);

      // Create OAuth2 instance with dynamic callback URL
      const oauth2 = new jsforce.OAuth2({
        loginUrl:
          process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com",
        clientId: process.env.SALESFORCE_CLIENT_ID,
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
        redirectUri: callbackUrl
      });

      // Connect to Salesforce with stored credentials
      console.log("🔗 Connecting to Salesforce...");
      console.log("   Instance URL:", req.session.instanceUrl);
      console.log("   Access Token exists:", !!req.session.accessToken);
      console.log("   Refresh Token exists:", !!req.session.refreshToken);

      const conn = new jsforce.Connection({
        oauth2,
        instanceUrl: req.session.instanceUrl,
        accessToken: req.session.accessToken,
        refreshToken: req.session.refreshToken,
        version: "60.0"
      });

      // Test the connection before deploying
      try {
        const identity = await conn.identity();
        console.log("✅ Connection verified, user:", identity.username);
      } catch (identityError) {
        console.error("❌ Connection test failed:", identityError);
        return res.status(401).json({
          error: "Authentication failed",
          message: "Your Salesforce session may have expired. Please reconnect."
        });
      }

      // Deploy using Metadata API
      console.log("🚀 Starting deployment to Salesforce...");

      let deployResult;
      try {
        deployResult = await conn.metadata.deploy(zipBase64, {
          rollbackOnError: true,
          singlePackage: true
        });
        console.log("✅ Deploy call succeeded, deploy ID:", deployResult.id);
      } catch (deployError) {
        console.error("❌ Deploy call failed:", deployError);
        throw new Error(
          `Failed to initiate deployment: ${deployError.message}`
        );
      }

      // Poll for deployment status
      const deployId = deployResult.id;
      let deployStatus;
      let maxPolls = 60; // Max 5 minutes (60 * 5 seconds)
      let pollCount = 0;

      while (pollCount < maxPolls) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

        try {
          deployStatus = await conn.metadata.checkDeployStatus(deployId, true);
          console.log(
            `📊 Poll ${pollCount + 1}: Status = ${deployStatus.status}, Done = ${deployStatus.done}`
          );
        } catch (statusError) {
          console.error(
            `❌ Status check failed on poll ${pollCount + 1}:`,
            statusError
          );
          throw new Error(
            `Failed to check deployment status: ${statusError.message}`
          );
        }

        if (deployStatus.done === "true" || deployStatus.done === true) {
          break;
        }

        pollCount++;
      }

      // Check deployment result
      if (deployStatus.success === "true" || deployStatus.success === true) {
        console.log("✅ Deployment successful!");
        res.json({
          success: true,
          message: "Component deployed successfully to Salesforce!",
          componentName: componentType,
          deployId: deployId
        });
      } else {
        // Collect error messages
        const errors = [];
        if (deployStatus.details?.componentFailures) {
          const failures = Array.isArray(deployStatus.details.componentFailures)
            ? deployStatus.details.componentFailures
            : [deployStatus.details.componentFailures];

          failures.forEach((failure) => {
            errors.push(`${failure.fileName}: ${failure.problem}`);
          });
        }

        console.error("❌ Deployment failed:", errors);
        res.status(400).json({
          success: false,
          error: "Deployment failed",
          message: errors.join("; ") || "Unknown deployment error"
        });
      }
    } catch (error) {
      console.error("❌ Deployment error:", error);
      console.error("   Error name:", error.name);
      console.error("   Error code:", error.errorCode);
      console.error("   Error stack:", error.stack);

      // Don't send response if already sent
      if (res.headersSent) {
        console.error("⚠️  Headers already sent, cannot send error response");
        return;
      }

      // Check if it's an auth error
      if (
        error.name === "INVALID_SESSION_ID" ||
        error.errorCode === "INVALID_SESSION_ID"
      ) {
        req.session.destroy();
        return res.status(401).json({
          error: "Session expired",
          message: "Please authenticate again"
        });
      }

      res.status(500).json({
        error: "Deployment failed",
        message: error.message || "An error occurred during deployment"
      });
    }
  }
);

// Start server
(async () => {
  // On Heroku, use the provided PORT. Locally, find an available port.
  const finalPort = process.env.PORT ? PORT : await findAvailablePort(PORT);
  app.listen(finalPort, () => {
    console.log(`\n🚀 LWC Generator Server is running!`);
    console.log(
      `\n📝 Open your browser and navigate to: http://localhost:${finalPort}`
    );
    console.log(
      `\n✨ Fill out the form and download your custom LWC component!\n`
    );

    // Show OAuth configuration status
    if (process.env.SALESFORCE_CLIENT_ID) {
      console.log("🔐 Salesforce OAuth configured");
      console.log("   Callback URL: Dynamically determined from request");
      console.log(
        `   Example: http://localhost:${finalPort}/oauth2/callback\n`
      );
    } else {
      console.log(
        "⚠️  Salesforce OAuth not configured. Set up .env file for deployment features.\n"
      );
    }
  });
})();
