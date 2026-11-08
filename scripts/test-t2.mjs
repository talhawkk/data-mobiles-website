import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const screenshotsDir = path.resolve(__dirname, '../screenshots/t2');

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

server.listen(4175, async () => {
  console.log('T2 Test server on http://localhost:4175');
  let browser;
  try {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
    });

    const expectedFrames = [0.09, 0.12, 0.14, 0.17, 0.19, 0.23, 0.30, 0.37, 0.44, 0.52];
    const errors = [];
    const warnings = [];

    // --- TEST DESKTOP (1440x900) ---
    console.log('\n--- Capturing Desktop Expected Frames ---');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    desktopPage.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') errors.push(`[Desktop Error] ${text}`);
      if (type === 'warning') warnings.push(`[Desktop Warning] ${text}`);
    });
    desktopPage.on('pageerror', (err) => errors.push(`[Desktop Uncaught] ${err.message}`));

    await desktopPage.goto('http://localhost:4175', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(2000);

    const desktopReports = {};

    for (const p of expectedFrames) {
      await desktopPage.evaluate(async (prog) => {
        if (window.__seek) {
          await window.__seek(prog);
        }
      }, p);
      await desktopPage.waitForTimeout(300);

      const metrics = await desktopPage.evaluate(() => {
        const calls = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getDrawCalls() : 0;
        const triangles = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getTriangles() : 0;
        return { calls, triangles };
      });

      if ([0.12, 0.23, 0.30].includes(p)) {
        desktopReports[p] = metrics;
      }

      await desktopPage.screenshot({ path: path.join(screenshotsDir, `desktop_frame_${p}.png`) });
      console.log(`Desktop p=${p.toFixed(2)}: Calls=${metrics.calls}, Tris=${metrics.triangles}`);
    }
    await desktopPage.close();

    // --- TEST MOBILE (390x844) ---
    console.log('\n--- Capturing Mobile Expected Frames ---');
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

    await mobilePage.goto('http://localhost:4175', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);

    const mobileReports = {};

    for (const p of expectedFrames) {
      await mobilePage.evaluate(async (prog) => {
        if (window.__seek) {
          await window.__seek(prog);
        }
      }, p);
      await mobilePage.waitForTimeout(300);

      const metrics = await mobilePage.evaluate(() => {
        const calls = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getDrawCalls() : 0;
        const triangles = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getTriangles() : 0;
        return { calls, triangles };
      });

      if ([0.12, 0.23, 0.30].includes(p)) {
        mobileReports[p] = metrics;
      }

      await mobilePage.screenshot({ path: path.join(screenshotsDir, `mobile_frame_${p}.png`) });
      console.log(`Mobile p=${p.toFixed(2)}: Calls=${metrics.calls}, Tris=${metrics.triangles}`);
    }
    await mobilePage.close();

    console.log('\n=======================================');
    console.log('T2 REPORT (Draw calls & Triangle count at 0.12, 0.23, 0.30):');
    console.log('=======================================');
    [0.12, 0.23, 0.30].forEach((p) => {
      console.log(
        `p=${p.toFixed(2)} | Desktop: Calls=${desktopReports[p].calls}, Tris=${desktopReports[p].triangles} | Mobile: Calls=${mobileReports[p].calls}, Tris=${mobileReports[p].triangles}`
      );
    });

    console.log(`\nConsole Errors: ${errors.length}`);
    if (errors.length > 0) console.error(errors);
    console.log(`Console Warnings: ${warnings.length}`);
    if (warnings.length > 0) console.warn(warnings);

    await browser.close();
  } catch (err) {
    console.error('T2 test failed:', err);
  } finally {
    server.close();
  }
});
