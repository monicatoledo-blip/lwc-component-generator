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
        const componentType = formData.componentType || 'unifiedProfileLwc';

        // Prepare template data based on component type
        let templateData = { ...formData };

        // For Unified Profile, calculate ring dash offset
        if (componentType === 'unifiedProfileLwc') {
            const ringPercentage = parseFloat(formData.ringPercentage) || 0;
            const circumference = 251.2;
            const ringDashOffset = circumference - (circumference * ringPercentage / 100);
            templateData.ringDashOffset = ringDashOffset.toFixed(2);
        }

        // Read template files
        const templatesDir = path.join(__dirname, 'templates', componentType);
        const htmlTemplate = await fs.readFile(path.join(templatesDir, `${componentType}.html`), 'utf-8');
        const jsTemplate = await fs.readFile(path.join(templatesDir, `${componentType}.js`), 'utf-8');
        const cssTemplate = await fs.readFile(path.join(templatesDir, `${componentType}.css`), 'utf-8');
        const metaTemplate = await fs.readFile(path.join(templatesDir, `${componentType}.js-meta.xml`), 'utf-8');

        // Compile templates with Handlebars
        const htmlCompiled = Handlebars.compile(htmlTemplate)(templateData);
        const jsCompiled = Handlebars.compile(jsTemplate)(templateData);
        const cssCompiled = Handlebars.compile(cssTemplate)(templateData);
        const metaCompiled = Handlebars.compile(metaTemplate)(templateData);

        // Create ZIP file
        const zip = new JSZip();
        const lwcFolder = zip.folder(componentType);

        lwcFolder.file(`${componentType}.html`, htmlCompiled);
        lwcFolder.file(`${componentType}.js`, jsCompiled);
        lwcFolder.file(`${componentType}.css`, cssCompiled);
        lwcFolder.file(`${componentType}.js-meta.xml`, metaCompiled);

        // Generate ZIP
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        // Send ZIP file
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${componentType}.zip`);
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
