import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const outDir = path.resolve('test-results/fixes');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Testing checkpoints...');
  const checkpoints = [
    { p: 0.0, name: 'hero' },
    { p: 0.23, name: 'inspect-battery' },
    { p: 0.30, name: 'inspect-board' },
    { p: 0.37, name: 'inspect-camera' },
    { p: 0.44, name: 'inspect-port' },
    { p: 0.52, name: 'inspect-screen' },
    { p: 0.72, name: 'accessories' },
    { p: 0.85, name: 'wifi' },
    { p: 0.98, name: 'finale' },
  ];

  for (const cp of checkpoints) {
    await page.evaluate(async (p) => {
      if (window.__seek) {
        await window.__seek(p);
      }
    }, cp.p);
    await page.waitForTimeout(400);

    // Check visible inspect cards
    const visibleCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.inspect-label-card'));
      return cards
        .filter((c) => {
          const style = window.getComputedStyle(c);
          return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0.05;
        })
        .map((c) => ({
          id: c.dataset.id,
          opacity: window.getComputedStyle(c).opacity,
          display: window.getComputedStyle(c).display,
          title: c.querySelector('.display-title')?.textContent?.trim(),
        }));
    });

    // Check custom-cursor
    const cursorVisible = await page.evaluate(() => {
      const el = document.querySelector('.custom-cursor');
      if (!el) return false;
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden';
    });

    console.log(`p=${cp.p} (${cp.name}): visibleCards=${JSON.stringify(visibleCards)}, cursorVisible=${cursorVisible}`);

    if (cp.name.startsWith('inspect-')) {
      if (visibleCards.length > 1) {
        console.error(`FAIL: More than 1 inspect card visible at p=${cp.p}! Cards:`, visibleCards);
      } else if (visibleCards.length === 1) {
        console.log(`PASS: Exactly 1 card visible: ${visibleCards[0].title}`);
      } else {
        console.warn(`WARNING: No card visible at p=${cp.p}`);
      }
    }

    if (cp.name === 'finale') {
      const overlap = await page.evaluate(() => {
        const btn = document.querySelector('.contact-cta-btn');
        const footer = document.querySelector('.finale-footer-bar');
        if (!btn || !footer) return false;
        const bRect = btn.getBoundingClientRect();
        const fRect = footer.getBoundingClientRect();
        return !(bRect.bottom < fRect.top || bRect.top > fRect.bottom || bRect.right < fRect.left || bRect.left > fRect.right);
      });
      console.log(`Finale button / footer overlap: ${overlap ? 'FAIL: OVERLAPPING!' : 'PASS: NO OVERLAP'}`);
    }

    const shotPath = path.join(outDir, `${cp.name}.png`);
    await page.screenshot({ path: shotPath });
  }

  // Check mobile viewport as well
  console.log('\nTesting Mobile Viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const cp of [
    { p: 0.0, name: 'mobile-hero' },
    { p: 0.30, name: 'mobile-inspect-board' },
    { p: 0.98, name: 'mobile-finale' }
  ]) {
    await page.evaluate(async (p) => {
      if (window.__seek) {
        await window.__seek(p);
      }
    }, cp.p);
    await page.waitForTimeout(400);

    const leaderLineHidden = await page.evaluate(() => {
      const svg = document.querySelector('.inspect-line-svg');
      if (!svg) return true;
      const s = window.getComputedStyle(svg);
      return s.display === 'none' || s.visibility === 'hidden';
    });

    console.log(`Mobile p=${cp.p} (${cp.name}): leaderLineHidden=${leaderLineHidden}`);
    await page.screenshot({ path: path.join(outDir, `${cp.name}.png`) });
  }

  console.log(`\nTotal Console Errors: ${errors.length}`);
  if (errors.length) console.error(errors);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
