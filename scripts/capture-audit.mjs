import { chromium } from 'playwright';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\talha_eleas4g\\.gemini\\antigravity-cli\\brain\\18aa50da-967d-4bad-84c2-eabedb39a9c6';

async function capture() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  // Desktop captures (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Desktop Hero
  await page.evaluate(async () => { if (window.__seek) await window.__seek(0.0); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'audit-1-desktop-hero.png') });

  // Desktop Inspect Board (p = 0.3)
  await page.evaluate(async () => { if (window.__seek) await window.__seek(0.3); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'audit-2-desktop-inspect-board.png') });

  // Desktop Finale with Atelier Address & About Us (p = 0.98)
  await page.evaluate(async () => { if (window.__seek) await window.__seek(0.98); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'audit-3-desktop-atelier-about.png') });
  await desktopContext.close();

  // Mobile captures (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mPage = await mobileContext.newPage();
  await mPage.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await mPage.waitForTimeout(1200);

  // Mobile Hero
  await mPage.evaluate(async () => { if (window.__seek) await window.__seek(0.0); });
  await mPage.waitForTimeout(500);
  await mPage.screenshot({ path: path.join(artifactDir, 'audit-4-mobile-hero.png') });

  // Mobile Inspect Board (p = 0.3)
  await mPage.evaluate(async () => { if (window.__seek) await window.__seek(0.3); });
  await mPage.waitForTimeout(500);
  await mPage.screenshot({ path: path.join(artifactDir, 'audit-5-mobile-inspect-board.png') });

  // Mobile Finale with Atelier Address & About Us (p = 0.98)
  await mPage.evaluate(async () => { if (window.__seek) await window.__seek(0.98); });
  await mPage.waitForTimeout(500);
  await mPage.screenshot({ path: path.join(artifactDir, 'audit-6-mobile-atelier-about.png') });
  await mobileContext.close();

  await browser.close();
  console.log('All 6 audit screenshots captured successfully in artifact directory.');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
