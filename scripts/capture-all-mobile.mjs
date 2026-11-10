import { chromium } from 'playwright';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\talha_eleas4g\\.gemini\\antigravity-cli\\brain\\18aa50da-967d-4bad-84c2-eabedb39a9c6';

const checkpoints = [
  { p: 0.0, name: 'm-01-hero' },
  { p: 0.12, name: 'm-02-teardown-peel' },
  { p: 0.23, name: 'm-03-inspect-battery' },
  { p: 0.30, name: 'm-04-inspect-board' },
  { p: 0.37, name: 'm-05-inspect-camera' },
  { p: 0.44, name: 'm-06-inspect-port' },
  { p: 0.52, name: 'm-07-inspect-screen' },
  { p: 0.68, name: 'm-08-acc-cases' },
  { p: 0.72, name: 'm-09-acc-earbuds' },
  { p: 0.75, name: 'm-10-acc-charger' },
  { p: 0.78, name: 'm-11-acc-cable' },
  { p: 0.85, name: 'm-12-wifi' },
  { p: 0.98, name: 'm-13-finale' },
];

async function capture() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  // 1. Standard iPhone (390x844)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Capture Mobile Menu Open state
  await page.click('#mobile-menu-toggle');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, 'm-00-menu-open.png') });
  await page.click('#mobile-drawer-close');
  await page.waitForTimeout(400);

  for (const cp of checkpoints) {
    await page.evaluate(async (p) => {
      if (window.__seek) await window.__seek(p);
    }, cp.p);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactDir, `${cp.name}.png`) });
  }
  await context.close();

  // 2. iPhone SE (375x667)
  const seContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const sePage = await seContext.newPage();
  await sePage.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await sePage.waitForTimeout(2000);

  for (const cp of [
    { p: 0.0, name: 'se-01-hero' },
    { p: 0.30, name: 'se-02-board' },
    { p: 0.85, name: 'se-03-wifi' },
    { p: 0.98, name: 'se-04-finale' },
  ]) {
    await sePage.evaluate(async (p) => {
      if (window.__seek) await window.__seek(p);
    }, cp.p);
    await sePage.waitForTimeout(400);
    await sePage.screenshot({ path: path.join(artifactDir, `${cp.name}.png`) });
  }
  await seContext.close();

  await browser.close();
  console.log('All mobile checkpoints captured successfully!');
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
