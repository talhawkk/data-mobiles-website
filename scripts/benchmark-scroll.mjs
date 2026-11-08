import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

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
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

async function runScrollBenchmark(browser, url, cpuThrottleRate = 1) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  if (cpuThrottleRate > 1) {
    try {
      const client = await page.context().newCDPSession(page);
      await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottleRate });
    } catch (e) {
      console.warn(`CDP CPU throttling rate ${cpuThrottleRate}x not supported:`, e.message);
    }
  }

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200); // Allow hero reveal to settle

  const results = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const spacer = document.getElementById('scroll-spacer');
      const maxScroll = spacer.offsetHeight - window.innerHeight;
      const durationMs = 8000;
      const deltas = [];
      const startTime = performance.now();
      let lastTime = startTime;

      function onFrame(now) {
        const delta = now - lastTime;
        deltas.push(delta);
        lastTime = now;

        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        // Smooth continuous scroll
        window.scrollTo(0, maxScroll * progress);

        if (progress < 1) {
          requestAnimationFrame(onFrame);
        } else {
          // Sort deltas for p95 calculation
          deltas.sort((a, b) => a - b);
          const p95Index = Math.floor(deltas.length * 0.95);
          const p95 = deltas[p95Index] || 16.6;
          const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
          const max = deltas[deltas.length - 1];
          const fps = 1000 / avg;
          resolve({
            frameCount: deltas.length,
            p95: Number(p95.toFixed(2)),
            avg: Number(avg.toFixed(2)),
            max: Number(max.toFixed(2)),
            fps: Number(fps.toFixed(1)),
          });
        }
      }

      requestAnimationFrame(onFrame);
    });
  });

  await page.close();
  return results;
}

server.listen(4175, async () => {
  console.log('Benchmark server listening on http://localhost:4175');
  let browser;
  try {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
    });

    console.log('\n======================================================');
    console.log('RUNNING SCRIPTED 8-SECOND SCROLL (0 -> 1) BENCHMARK');
    console.log('======================================================');

    console.log('\n1. Default Tier (Desktop Tier 0 - Full Post-Processing):');
    const tier0Stats = await runScrollBenchmark(browser, 'http://localhost:4175/?tier=0', 1);
    console.log(`   Frames Recorded: ${tier0Stats.frameCount}`);
    console.log(`   Average Frame Time: ${tier0Stats.avg} ms (~${tier0Stats.fps} FPS)`);
    console.log(`   p95 Frame Time: ${tier0Stats.p95} ms`);
    console.log(`   Max Frame Time: ${tier0Stats.max} ms`);

    console.log('\n2. Mobile Tier (Tier 2 with 4x CPU Throttling):');
    const tier2Stats = await runScrollBenchmark(browser, 'http://localhost:4175/?tier=2', 4);
    console.log(`   Frames Recorded: ${tier2Stats.frameCount}`);
    console.log(`   Average Frame Time: ${tier2Stats.avg} ms (~${tier2Stats.fps} FPS)`);
    console.log(`   p95 Frame Time: ${tier2Stats.p95} ms`);
    console.log(`   Max Frame Time: ${tier2Stats.max} ms`);

    await browser.close();
  } catch (err) {
    console.error('Benchmark failed:', err);
  } finally {
    server.close();
  }
});
