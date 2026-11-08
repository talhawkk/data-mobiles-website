import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../public');

fs.mkdirSync(publicDir, { recursive: true });

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

server.listen(4174, async () => {
  console.log('OG generator server listening on http://localhost:4174');
  let browser;
  try {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
    });

    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });

    await page.goto('http://localhost:4174', { waitUntil: 'networkidle' });
    // Wait for preloader to finish and hero reveal sweep
    await page.waitForTimeout(2800);

    const rawBuffer = await page.screenshot({ type: 'png' });
    const ogPath = path.join(publicDir, 'og-image.png');

    // Compress to PNG under 200 kB using sharp
    await sharp(rawBuffer)
      .png({
        compressionLevel: 9,
        palette: true,
        quality: 65,
        effort: 9,
      })
      .toFile(ogPath);

    const stats = fs.statSync(ogPath);
    const sizeKb = stats.size / 1024;
    console.log(`Successfully generated og-image.png: ${ogPath}`);
    console.log(`Image size: ${sizeKb.toFixed(1)} kB (Budget: < 200 kB) -> ${sizeKb < 200 ? 'PASS' : 'FAIL'}`);

    // Also copy to dist/og-image.png
    fs.copyFileSync(ogPath, path.join(distDir, 'og-image.png'));

    await browser.close();
  } catch (err) {
    console.error('Failed to generate OG image:', err);
  } finally {
    server.close();
  }
});
