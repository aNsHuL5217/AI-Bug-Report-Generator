import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.post('/api/scan', async (req, res) => {
  const { url, viewportWidth = 1280, viewportHeight = 800 } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser;
  try {
    // Launch headless browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: parseInt(viewportWidth), height: parseInt(viewportHeight) }
    });

    const page = await context.newPage();

    const consoleLogs = [];
    const networkRequests = [];

    // Capture console messages
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // Capture response details to track API/Network errors
    page.on('response', response => {
      const status = response.status();
      if (status >= 400) {
        networkRequests.push({
          url: response.url(),
          method: response.request().method(),
          status,
          statusText: response.statusText(),
          headers: response.headers()
        });
      }
    });

    // Capture failed requests (DNS errors, connection timeouts, etc.)
    page.on('requestfailed', request => {
      const failure = request.failure();
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        error: failure ? failure.errorText : 'Network failure'
      });
    });

    // Navigate to URL
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // Wait a brief moment for dynamic elements/fetch to resolve
    await page.waitForTimeout ? await page.waitForTimeout(2000) : await new Promise(r => setTimeout(r, 2000));

    // Capture viewport screenshot as base64
    const screenshotBuffer = await page.screenshot({ type: 'png', fullPage: false });
    const screenshotBase64 = screenshotBuffer.toString('base64');

    // Get page title and URL
    const title = await page.title();

    res.json({
      success: true,
      title,
      url,
      screenshot: `data:image/png;base64,${screenshotBase64}`,
      consoleLogs,
      networkRequests
    });

  } catch (error) {
    console.error('Scan error:', error);
    let message = error.message || 'Unknown error occurred during browser scan';
    let needsInstall = false;
    
    if (message.includes("Executable doesn't exist") || message.includes('playwright install') || message.includes('chromium')) {
      needsInstall = true;
      message = 'Playwright chromium browser is not installed. Please run "npx playwright install chromium" in the terminal to enable live scanning.';
    }

    res.status(500).json({
      success: false,
      error: message,
      needsPlaywrightInstall: needsInstall
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// A simple API parser endpoint for Swagger specs to validate
app.post('/api/parse-swagger', async (req, res) => {
  const { swaggerUrl, rawSpec } = req.body;
  
  try {
    let specData;
    if (rawSpec) {
      specData = typeof rawSpec === 'string' ? JSON.parse(rawSpec) : rawSpec;
    } else if (swaggerUrl) {
      const response = await fetch(swaggerUrl);
      specData = await response.json();
    } else {
      return res.status(400).json({ error: 'Swagger URL or raw spec JSON is required' });
    }

    // Basic structure validation
    const info = specData.info || {};
    const paths = specData.paths || {};
    const endpointsCount = Object.keys(paths).length;
    
    res.json({
      success: true,
      title: info.title || 'API Specification',
      version: info.version || '1.0.0',
      description: info.description || '',
      endpointsCount,
      paths,
      rawSpec: specData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to parse Swagger/OpenAPI spec. Make sure it is valid JSON.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Scanner server running on http://localhost:${PORT}`);
});
