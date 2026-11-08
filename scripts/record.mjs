import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

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
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
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
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    console.log('Navigating to local site...');
    await page.goto('http://localhost:4174/?tier=0', { waitUntil: 'networkidle' });

    console.log('Allowing preloader to reveal hero...');
    // Wait for preloader to wipe and reveal hero phone (approx 2.4s)
    await page.waitForTimeout(2500);

    // Hero admiration pause
    console.log('Showing Hero (2 seconds)...');
    await page.waitForTimeout(2000);

    // Smooth choreographed steps across the site (Total: ~18 seconds)
    const scriptSteps = [
      // 1. Act A: Open phone (0.00 -> 0.20)
      { target: 0.08, duration: 800 },
      { target: 0.14, duration: 800 },
      { target: 0.20, duration: 900 },

      // 2. Act B: Inspect 5 windows (0.20 -> 0.56)
      { target: 0.23, duration: 700 }, // 01 Battery
      { target: 0.27, duration: 500 },
      { target: 0.30, duration: 700 }, // 02 Board
      { target: 0.34, duration: 500 },
      { target: 0.37, duration: 700 }, // 03 Camera
      { target: 0.41, duration: 500 },
      { target: 0.44, duration: 700 }, // 04 Port
      { target: 0.48, duration: 500 },
      { target: 0.52, duration: 800 }, // 05 Screen & Lockscreen date
      { target: 0.56, duration: 500 },

      // 3. Act C: Rebuild (0.56 -> 0.66)
      { target: 0.59, duration: 700 },
      { target: 0.60, duration: 400 }, // Click moment & punch
      { target: 0.62, duration: 800 }, // Check mark drawing
      { target: 0.66, duration: 700 }, // "Fixed."

      // 4. Act D: Accessories (0.66 -> 0.80)
      { target: 0.68, duration: 800 }, // Case slides on
      { target: 0.70, duration: 600 },
      { target: 0.72, duration: 800 }, // Earbuds open 70 deg & orbit
      { target: 0.74, duration: 600 },
      { target: 0.76, duration: 700 }, // Charger brick
      { target: 0.78, duration: 800 }, // Cable & fast charge
      { target: 0.80, duration: 600 },

      // 5. Act E: Home WiFi (0.80 -> 0.91)
      { target: 0.83, duration: 800 }, // Home plan (1 LED, 10 Mbps)
      { target: 0.86, duration: 800 }, // Family plan (2 LEDs, 20 Mbps)
      { target: 0.89, duration: 900 }, // Max plan (3 LEDs, 50 Mbps, 40 pulses)
      { target: 0.91, duration: 500 },

      // 6. Act F: Finale & Footer (0.91 -> 1.00)
      { target: 0.94, duration: 800 }, // Pullback, wordmark, CTA
      { target: 0.97, duration: 800 },
      { target: 1.00, duration: 900 },
    ];

    let currentProgress = 0;
    for (const step of scriptSteps) {
      const fromProg = currentProgress;
      const toProg = step.target;
      const subSteps = 10;
      const interval = Math.max(16, step.duration / subSteps);

      for (let i = 1; i <= subSteps; i++) {
        const p = fromProg + (toProg - fromProg) * (i / subSteps);
        await page.evaluate(async (prog) => {
          if (window.__seek) {
            await window.__seek(prog);
          } else {
            const spacer = document.getElementById('scroll-spacer');
            const maxScroll = spacer.offsetHeight - window.innerHeight;
            window.scrollTo(0, maxScroll * prog);
          }
        }, p);
        await page.waitForTimeout(interval);
      }
      currentProgress = toProg;
    }

    // Finale pause so viewer can appreciate the poster-worthy ending
    console.log('Pausing on finale (2 seconds)...');
    await page.waitForTimeout(2000);

    console.log('Finalizing raw video recording...');
    const video = page.video();
    await page.close();
    await context.close();

    const rawVideoPath = await video.path();
    const tempWebmPath = path.join(recordingsDir, 'raw-capture.webm');
    if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
    fs.copyFileSync(rawVideoPath, tempWebmPath);

    console.log(`Raw video saved at ${tempWebmPath}`);

    // Process with Python + OpenCV to trim all blank preloader frames and produce compressed MP4s
    console.log('\nProcessing with Python + OpenCV to eliminate initial blank screen & compress for Claude.ai...');
    const pythonScript = `
import cv2, os, numpy as np

input_path = '${tempWebmPath.replace(/\\/g, '/')}'
output_720p = 'D:/Work/Website/recordings/DATA-showcase.mp4'
output_claude = 'D:/Work/Website/recordings/DATA-showcase-claude.mp4'

cap = cv2.VideoCapture(input_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

print(f"Total raw frames: {total_frames} at {fps:.1f} FPS")

# 1. Scan to find the exact frame where the Hero phone appears (brightness / content change)
# Preloader / blank screen has very low average brightness (< 1.5).
# When Hero phone is revealed, average brightness exceeds 4.0 and phone edges are visible.
start_frame = 0
frame_idx = 0
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean_val = np.mean(gray)
    # Check when hero phone or preloader wipe is active
    if mean_val > 4.5:
        # Found hero reveal point! Start 5 frames before for a clean opening
        start_frame = max(0, frame_idx - 5)
        print(f"Hero start detected at frame {start_frame} ({start_frame/fps:.2f}s)")
        break
    frame_idx += 1

# If not detected dynamically, fallback to 2.5s
if start_frame == 0:
    start_frame = int(2.4 * fps)
    print(f"Using default start frame {start_frame}")

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out_720 = cv2.VideoWriter(output_720p, fourcc, fps, (w, h))
out_claude = cv2.VideoWriter(output_claude, fourcc, 24.0, (960, 540))

cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
written_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    out_720.write(frame)

    # 960x540 for Claude (compact, highly compressed)
    frame_claude = cv2.resize(frame, (960, 540), interpolation=cv2.INTER_AREA)
    out_claude.write(frame_claude)
    written_count += 1

cap.release()
out_720.release()
out_claude.release()

size_720 = os.path.getsize(output_720p) / (1024 * 1024)
size_claude = os.path.getsize(output_claude) / (1024 * 1024)
duration_s = written_count / fps

print(f"\\nSUCCESSFULLY CREATED VIDEOS (Duration: {duration_s:.1f}s):")
print(f"1. 720p Master: {output_720p} ({size_720:.2f} MB)")
print(f"2. Claude.ai Optimized: {output_claude} ({size_claude:.2f} MB)")
`;

    execSync(`python -c "${pythonScript.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

    // Clean up temp file
    if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);

    await browser.close();
  } catch (err) {
    console.error('Recording error:', err);
  } finally {
    server.close();
  }
});
