import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const screenshotsDir = path.resolve(__dirname, '../screenshots/t1');

fs.mkdirSync(screenshotsDir, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(4174, async () => {
  console.log('T1 Test server on http://localhost:4174');
  let browser;
  try {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
    });

    const errors = [];
    const warnings = [];

    // --- TEST 1: Mobile with ?explode=1 (Check draw calls <= 60, triangles <= 100k) ---
    console.log('\n--- Checking Mobile at ?explode=1 ---');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    mobilePage.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') errors.push(`[Mobile Error] ${text}`);
      if (type === 'warning') warnings.push(`[Mobile Warning] ${text}`);
    });
    mobilePage.on('pageerror', (err) => errors.push(`[Mobile Uncaught] ${err.message}`));

    await mobilePage.goto('http://localhost:4174?explode=1', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);

    const mobileMetrics = await mobilePage.evaluate(() => {
      const calls = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getDrawCalls() : 0;
      const triangles = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getTriangles() : 0;
      return { calls, triangles };
    });

    await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile_explode_1.png') });
    console.log(`Mobile Explode=1: Calls=${mobileMetrics.calls} (budget <= 60), Tris=${mobileMetrics.triangles} (budget <= 100k)`);
    await mobilePage.close();

    // --- TEST 2: Desktop with ?explode=0 ---
    console.log('\n--- Checking Desktop at ?explode=0 ---');
    const desktopPage0 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    desktopPage0.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[Desktop0 Error] ${msg.text()}`);
    });
    await desktopPage0.goto('http://localhost:4174?explode=0', { waitUntil: 'networkidle' });
    await desktopPage0.waitForTimeout(1500);

    await desktopPage0.screenshot({ path: path.join(screenshotsDir, 'desktop_explode_0.png') });
    await desktopPage0.close();

    // --- TEST 3: Desktop with ?explode=1 ---
    console.log('\n--- Checking Desktop at ?explode=1 ---');
    const desktopPage1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    desktopPage1.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[Desktop1 Error] ${msg.text()}`);
    });
    await desktopPage1.goto('http://localhost:4174?explode=1', { waitUntil: 'networkidle' });
    await desktopPage1.waitForTimeout(1500);

    const desktopMetrics = await desktopPage1.evaluate(() => {
      const calls = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getDrawCalls() : 0;
      const triangles = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getTriangles() : 0;
      return { calls, triangles };
    });

    await desktopPage1.screenshot({ path: path.join(screenshotsDir, 'desktop_explode_1.png') });
    console.log(`Desktop Explode=1: Calls=${desktopMetrics.calls}, Tris=${desktopMetrics.triangles}`);
    await desktopPage1.close();

    // --- TEST 4: Each Part QA Framing (?explode=0.8&part=...) ---
    const parts = ['battery', 'board', 'camera', 'port', 'screen', 'cover'];
    for (const part of parts) {
      const partPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await partPage.goto(`http://localhost:4174?explode=0.8&part=${part}`, { waitUntil: 'networkidle' });
      await partPage.waitForTimeout(600);
      await partPage.screenshot({ path: path.join(screenshotsDir, `desktop_part_${part}.png`) });
      await partPage.close();
      console.log(`Captured part framing for: ${part}`);
    }

    console.log('\n=======================================');
    console.log('T1 ACCEPTANCE VERIFICATION RESULTS:');
    console.log('=======================================');
    console.log(`Console Errors: ${errors.length} -> ${errors.length === 0 ? 'PASS' : 'FAIL'}`);
    if (errors.length > 0) console.error(errors);
    console.log(`Mobile Explode=1 Draw Calls: ${mobileMetrics.calls} (Budget: <= 60) -> ${mobileMetrics.calls <= 60 ? 'PASS' : 'FAIL'}`);
    console.log(`Mobile Explode=1 Triangles: ${mobileMetrics.triangles} (Budget: <= 100k) -> ${mobileMetrics.triangles <= 100000 ? 'PASS' : 'FAIL'}`);

    await browser.close();
  } catch (err) {
    console.error('T1 test failed:', err);
  } finally {
    server.close();
  }
});
