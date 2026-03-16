const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const Handlebars = require('handlebars');
const JSZip = require('jszip');

const app = express();
const PORT = process.env.PORT || 3000;

// Function to find available port
function findAvailablePort(startPort) {
    return new Promise((resolve) => {
        const server = app.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        }).on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
    });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate LWC endpoint
app.post('/generate', async (req, res) => {
    try {
        const formData = req.body;

        // Calculate ring dash offset (circumference = 2 * π * r = 2 * 3.14159 * 40 ≈ 251.2)
        const ringPercentage = parseFloat(formData.ringPercentage) || 0;
        const circumference = 251.2;
        const ringDashOffset = circumference - (circumference * ringPercentage / 100);

        // Add calculated values to form data
        const templateData = {
            ...formData,
            ringDashOffset: ringDashOffset.toFixed(2)
        };

        // Read template files
        const templatesDir = path.join(__dirname, 'templates', 'unifiedProfileLwc');
        const htmlTemplate = await fs.readFile(path.join(templatesDir, 'unifiedProfileLwc.html'), 'utf-8');
        const jsTemplate = await fs.readFile(path.join(templatesDir, 'unifiedProfileLwc.js'), 'utf-8');
        const cssTemplate = await fs.readFile(path.join(templatesDir, 'unifiedProfileLwc.css'), 'utf-8');
        const metaTemplate = await fs.readFile(path.join(templatesDir, 'unifiedProfileLwc.js-meta.xml'), 'utf-8');

        // Compile templates with Handlebars
        const htmlCompiled = Handlebars.compile(htmlTemplate)(templateData);
        const jsCompiled = Handlebars.compile(jsTemplate)(templateData);
        const cssCompiled = Handlebars.compile(cssTemplate)(templateData);
        const metaCompiled = Handlebars.compile(metaTemplate)(templateData);

        // Create ZIP file
        const zip = new JSZip();
        const lwcFolder = zip.folder('unifiedProfileLwc');

        lwcFolder.file('unifiedProfileLwc.html', htmlCompiled);
        lwcFolder.file('unifiedProfileLwc.js', jsCompiled);
        lwcFolder.file('unifiedProfileLwc.css', cssCompiled);
        lwcFolder.file('unifiedProfileLwc.js-meta.xml', metaCompiled);

        // Generate ZIP
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // Send ZIP file
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=unifiedProfileLwc.zip');
        res.send(zipBuffer);

    } catch (error) {
        console.error('Error generating LWC:', error);
        res.status(500).json({ error: 'Failed to generate LWC', details: error.message });
    }
});

// Start server
(async () => {
    // On Heroku, use the provided PORT. Locally, find an available port.
    const finalPort = process.env.PORT ? PORT : await findAvailablePort(PORT);
    app.listen(finalPort, () => {
        console.log(`\n🚀 LWC Generator Server is running!`);
        console.log(`\n📝 Open your browser and navigate to: http://localhost:${finalPort}`);
        console.log(`\n✨ Fill out the form and download your custom LWC component!\n`);
    });
})();
