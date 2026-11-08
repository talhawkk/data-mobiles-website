import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const recordingsDir = path.resolve(__dirname, '../recordings');

fs.mkdirSync(recordingsDir, { recursive: true });

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
  console.log('Video recording server listening on http://localhost:4174');

  let browser;
  try {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
    });

    const context = await browser.newContext({
      recordVideo: {
        dir: recordingsDir,
        size: { width: 1280, height: 720 },
      },
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    await page.goto('http://localhost:4174', { waitUntil: 'networkidle' });

    console.log('Recording preloader and hero...');
    // Allow preloader to finish and reveal hero
    await page.waitForTimeout(2200);

    // Hero pause
    await page.waitForTimeout(1200);

    console.log('Recording smooth scroll through entire site...');

    // Smoothly scroll through timeline from 0 to 1 in steps
    // 100 steps with smooth interpolations
    const steps = [
      // Hero to Open (0.00 -> 0.25)
      { target: 0.10, duration: 800 },
      { target: 0.20, duration: 800 },
      { target: 0.28, duration: 800 },
      // Inspect: screen, battery, port, camera, board (0.28 -> 0.52)
      { target: 0.31, duration: 600 }, // Screen
      { target: 0.35, duration: 600 }, // Battery
      { target: 0.40, duration: 600 }, // Port
      { target: 0.45, duration: 600 }, // Camera
      { target: 0.50, duration: 800 }, // Board
      // Rebuild: Fixed (0.52 -> 0.66)
      { target: 0.58, duration: 700 },
      { target: 0.65, duration: 900 },
      // Accessories (0.66 -> 0.78)
      { target: 0.72, duration: 1000 },
      { target: 0.77, duration: 800 },
      // WiFi (0.78 -> 0.90)
      { target: 0.82, duration: 800 },
      { target: 0.86, duration: 1000 },
      // Contact (0.90 -> 1.00)
      { target: 0.94, duration: 800 },
      { target: 1.00, duration: 1000 },
    ];

    let currentProgress = 0;
    for (const step of steps) {
      const fromProg = currentProgress;
      const toProg = step.target;
      const subSteps = 12;
      const interval = step.duration / subSteps;

      for (let i = 1; i <= subSteps; i++) {
        const p = fromProg + (toProg - fromProg) * (i / subSteps);
        await page.evaluate((prog) => {
          const spacer = document.getElementById('scroll-spacer');
          const maxScroll = spacer.offsetHeight - window.innerHeight;
          window.scrollTo(0, maxScroll * prog);
          if (window.__DATA_DEBUG__ && window.__DATA_DEBUG__.masterTl) {
            window.__DATA_DEBUG__.masterTl.progress(prog);
          }
        }, p);
        await page.waitForTimeout(interval);
      }
      currentProgress = toProg;
    }

    // Pause on Contact section
    console.log('Pausing on contact section...');
    await page.waitForTimeout(1500);

    console.log('Finishing recording...');
    const video = page.video();
    await page.close();
    await context.close();

    const videoPath = await video.path();
    const finalWebmPath = path.join(recordingsDir, 'DATA-site-preview.webm');
    
    // Copy/rename to permanent file
    if (fs.existsSync(finalWebmPath)) fs.unlinkSync(finalWebmPath);
    fs.copyFileSync(videoPath, finalWebmPath);

    const stats = fs.statSync(finalWebmPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`Video recorded successfully!`);
    console.log(`Path: ${finalWebmPath}`);
    console.log(`Size: ${sizeMB} MB`);

    // Post-process with Python OpenCV to trim initial blank frames and produce compressed MP4s
    console.log('Trimming initial blank/preloader frames to start directly at Hero...');
    const { execSync } = await import('node:child_process');
    try {
      execSync(`python -c "
import cv2, os

input_path = '${finalWebmPath.replace(/\\/g, '/')}'
output_720p = 'D:/Work/Website/recordings/DATA-site-preview.mp4'
output_compact = 'D:/Work/Website/recordings/DATA-site-preview-compact.mp4'

cap = cv2.VideoCapture(input_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

start_frame = int(9.6 * fps)
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out_720 = cv2.VideoWriter(output_720p, fourcc, fps, (w, h))
out_comp = cv2.VideoWriter(output_compact, fourcc, 24.0, (960, 540))

cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
count = 0
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    out_720.write(frame)
    frame_comp = cv2.resize(frame, (960, 540), interpolation=cv2.INTER_AREA)
    out_comp.write(frame_comp)
    count += 1

cap.release()
out_720.release()
out_comp.release()
print('Trimmed MP4 created: 720p (' + str(round(os.path.getsize(output_720p)/(1024*1024), 2)) + ' MB), Compact (' + str(round(os.path.getsize(output_compact)/(1024*1024), 2)) + ' MB)')
"`, { stdio: 'inherit' });
    } catch (e) {
      console.warn('Trim step skipped:', e.message);
    }

    await browser.close();
  } catch (err) {
    console.error('Recording error:', err);
  } finally {
    server.close();
  }
});
