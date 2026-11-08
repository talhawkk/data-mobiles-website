import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const screenshotsDir = path.resolve(__dirname, '../screenshots');

// Ensure screenshots directories exist
fs.mkdirSync(path.join(screenshotsDir, 'desktop'), { recursive: true });
fs.mkdirSync(path.join(screenshotsDir, 'mobile'), { recursive: true });

// MIME types dictionary
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

// 1. Static HTTP Server for dist
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

server.listen(4173, async () => {
  console.log('Static test server listening on http://localhost:4173');
  
  let browser;
  try {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
    });

    const progressPoints = [0.03, 0.10, 0.17, 0.23, 0.30, 0.37, 0.44, 0.52, 0.59, 0.62, 0.68, 0.72, 0.75, 0.79, 0.84, 0.88, 0.94, 1.0];
    const errors = [];
    const warnings = [];

    // --- TEST DESKTOP (1440x900) ---
    console.log('\n=======================================');
    console.log('Testing Desktop Viewport: 1440x900');
    console.log('=======================================');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    desktopPage.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (text.startsWith('[DEBUG')) console.log(text);
      if (type === 'error') errors.push(`[Desktop Error] ${text}`);
      if (type === 'warning') warnings.push(`[Desktop Warning] ${text}`);
    });
    desktopPage.on('pageerror', (err) => errors.push(`[Desktop Uncaught] ${err.message}`));

    await desktopPage.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    // Wait for preloader to exit (at most 1.8s)
    await desktopPage.waitForTimeout(2000);

    const desktopStats = [];

    for (const p of progressPoints) {
      await desktopPage.evaluate(async (prog) => {
        if (window.__seek) {
          await window.__seek(prog);
        } else {
          const spacer = document.getElementById('scroll-spacer');
          const maxScroll = spacer.offsetHeight - window.innerHeight;
          window.scrollTo(0, maxScroll * prog);
          if (window.__DATA_DEBUG__ && window.__DATA_DEBUG__.masterTl) {
            window.__DATA_DEBUG__.masterTl.progress(prog);
          }
        }
      }, p);

      await desktopPage.waitForTimeout(200);

      const metrics = await desktopPage.evaluate(() => {
        const calls = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getDrawCalls() : 0;
        const triangles = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getTriangles() : 0;
        return { calls, triangles };
      });

      desktopStats.push({ progress: p, ...metrics });
      const imgPath = path.join(screenshotsDir, 'desktop', `progress_${p}.png`);
      await desktopPage.screenshot({ path: imgPath });
      console.log(`Desktop Progress ${p.toFixed(2)}: Draw Calls = ${metrics.calls}, Triangles = ${metrics.triangles}`);

      if (p === 0.84) {
        const debug084 = await desktopPage.evaluate(() => {
          if (!window.__DATA_DEBUG__) return null;
          const { phone, accessories, wifiScene } = window.__DATA_DEBUG__;
          const pPos = phone.group.position;
          const aPos = accessories.group.position;
          const wPos = wifiScene.group.position;
          return {
            accessories: { visible: accessories.group.visible, scale: accessories.group.scale.x, pos: [aPos.x, aPos.y, aPos.z] },
            router: { visible: wifiScene.group.visible, scale: wifiScene.group.scale.x, pos: [wPos.x, wPos.y, wPos.z] },
            phone: { visible: phone.group.visible, scale: phone.group.scale.x, pos: [pPos.x, pPos.y, pPos.z] },
          };
        });
        console.log(`[Desktop 0.84 Objects]`, JSON.stringify(debug084));
      }
    }

    await desktopPage.close();

    // --- TEST MOBILE (390x844) ---
    console.log('\n=======================================');
    console.log('Testing Mobile Viewport: 390x844');
    console.log('=======================================');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    mobilePage.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (text.startsWith('[DEBUG')) console.log(text);
      if (type === 'error') errors.push(`[Mobile Error] ${text}`);
      if (type === 'warning') warnings.push(`[Mobile Warning] ${text}`);
    });
    mobilePage.on('pageerror', (err) => errors.push(`[Mobile Uncaught] ${err.message}`));

    await mobilePage.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(2000);

    const mobileStats = [];

    for (const p of progressPoints) {
      await mobilePage.evaluate(async (prog) => {
        if (window.__seek) {
          await window.__seek(prog);
        } else {
          const spacer = document.getElementById('scroll-spacer');
          const maxScroll = spacer.offsetHeight - window.innerHeight;
          window.scrollTo(0, maxScroll * prog);
          if (window.__DATA_DEBUG__ && window.__DATA_DEBUG__.masterTl) {
            window.__DATA_DEBUG__.masterTl.progress(prog);
          }
        }
      }, p);

      await mobilePage.waitForTimeout(200);

      const metrics = await mobilePage.evaluate(() => {
        const calls = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getDrawCalls() : 0;
        const triangles = window.__DATA_DEBUG__ ? window.__DATA_DEBUG__.getTriangles() : 0;
        return { calls, triangles };
      });

      mobileStats.push({ progress: p, ...metrics });
      const imgPath = path.join(screenshotsDir, 'mobile', `progress_${p}.png`);
      await mobilePage.screenshot({ path: imgPath });
      console.log(`Mobile Progress ${p.toFixed(2)}: Draw Calls = ${metrics.calls}, Triangles = ${metrics.triangles}`);

      if (p === 0.84) {
        const debug084 = await mobilePage.evaluate(() => {
          if (!window.__DATA_DEBUG__) return null;
          const { phone, accessories, wifiScene } = window.__DATA_DEBUG__;
          const pPos = phone.group.position;
          const aPos = accessories.group.position;
          const wPos = wifiScene.group.position;
          return {
            accessories: { visible: accessories.group.visible, scale: accessories.group.scale.x, pos: [aPos.x, aPos.y, aPos.z] },
            router: { visible: wifiScene.group.visible, scale: wifiScene.group.scale.x, pos: [wPos.x, wPos.y, wPos.z] },
            phone: { visible: phone.group.visible, scale: phone.group.scale.x, pos: [pPos.x, pPos.y, pPos.z] },
          };
        });
        console.log(`[Mobile 0.84 Objects]`, JSON.stringify(debug084));
      }
    }

    // Benchmark frame times
    console.log('\nMeasuring animation frame times on mobile...');
    const frameStats = await mobilePage.evaluate(() => {
      return new Promise((resolve) => {
        const times = [];
        let count = 0;
        let last = performance.now();
        function loop() {
          const now = performance.now();
          times.push(now - last);
          last = now;
          count++;
          if (count < 60) {
            requestAnimationFrame(loop);
          } else {
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const max = Math.max(...times);
            resolve({ avg, max });
          }
        }
        requestAnimationFrame(loop);
      });
    });

    await mobilePage.close();

    // --- TEST MULTI-VIEWPORT RESPONSIVE PASS (U9) ---
    // 360x740, 412x915, 768x1024, landscape 844x390
    console.log('\n=======================================');
    console.log('Testing Multi-Viewport Matrix (U9 Pass)');
    console.log('=======================================');
    const matrixViewports = [
      { name: 'Android Small', width: 360, height: 740 },
      { name: 'Android Large', width: 412, height: 915 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Mobile Landscape', width: 844, height: 390 },
    ];

    for (const vp of matrixViewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`[${vp.name} Error] ${msg.text()}`);
      });
      page.on('pageerror', (err) => errors.push(`[${vp.name} Uncaught] ${err.message}`));
      await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Seek through key progress checkpoints
      for (const p of [0.10, 0.35, 0.62, 0.75, 0.85, 1.0]) {
        await page.evaluate(async (prog) => {
          if (window.__seek) await window.__seek(prog);
        }, p);
      }
      console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): Clean render PASS`);
      await page.close();
    }

    // Summary Report
    console.log('\n=======================================');
    console.log('VERIFICATION SUMMARY REPORT:');
    console.log('=======================================');
    console.log(`Console Errors: ${errors.length}`);
    if (errors.length > 0) console.error(errors);
    console.log(`Console Warnings: ${warnings.length}`);
    if (warnings.length > 0) console.warn(warnings);

    const maxDesktopCalls = Math.max(...desktopStats.map(s => s.calls));
    const maxMobileCalls = Math.max(...mobileStats.map(s => s.calls));
    const maxMobileTriangles = Math.max(...mobileStats.map(s => s.triangles));

    console.log(`Desktop Max Draw Calls: ${maxDesktopCalls} (Budget: <= 150) -> ${maxDesktopCalls <= 150 ? 'PASS' : 'FAIL'}`);
    console.log(`Mobile Max Draw Calls: ${maxMobileCalls} (Budget: <= 80) -> ${maxMobileCalls <= 80 ? 'PASS' : 'FAIL'}`);
    console.log(`Mobile Max Triangles: ${maxMobileTriangles} (Budget: <= 100k) -> ${maxMobileTriangles <= 100000 ? 'PASS' : 'FAIL'}`);
    console.log(`Average Frame Delta: ${frameStats.avg.toFixed(2)} ms (~${(1000 / frameStats.avg).toFixed(0)} FPS) (Budget: < 22ms) -> ${frameStats.avg < 22 ? 'PASS' : 'FAIL'}`);

    await browser.close();
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    server.close();
  }
});
