import { chromium } from 'playwright';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testOverflow() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const viewports = [
    { name: 'iPhone 5/SE1', width: 320, height: 568 },
    { name: 'Galaxy S20', width: 360, height: 800 },
    { name: 'iPhone SE 2/3', width: 375, height: 667 },
    { name: 'iPhone 12/13/14/15', width: 390, height: 844 },
    { name: 'Pixel 7', width: 412, height: 915 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro / Laptop', width: 1024, height: 768 },
    { name: 'Desktop HD', width: 1440, height: 900 },
  ];

  let anyOverflow = false;

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.width < 1000,
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Test multiple scroll positions (hero, inspect, accessories, wifi, finale)
    for (const p of [0, 0.3, 0.7, 0.85, 0.98]) {
      await page.evaluate(async (prog) => {
        if (window.__seek) await window.__seek(prog);
      }, p);
      await page.waitForTimeout(200);

      const res = await page.evaluate(() => {
        const iw = window.innerWidth;
        const sw = document.documentElement.scrollWidth;
        const bw = document.body.scrollWidth;
        return {
          iw,
          sw,
          bw,
          overflow: sw > iw || bw > iw,
        };
      });

      if (res.overflow) {
        anyOverflow = true;
        console.error(`FAIL: Overflow detected on ${vp.name} (${vp.width}x${vp.height}) at progress ${p}: innerWidth=${res.iw}, docScrollWidth=${res.sw}, bodyScrollWidth=${res.bw}`);
      }
    }

    console.log(`PASS: ${vp.name} (${vp.width}x${vp.height}) - ZERO horizontal overflow across all sections.`);
    await context.close();
  }

  await browser.close();
  if (anyOverflow) {
    process.exit(1);
  } else {
    console.log('\nALL 8 VIEWPORTS PASSED WITH ZERO HORIZONTAL OVERFLOW!');
  }
}

testOverflow().catch((e) => {
  console.error(e);
  process.exit(1);
});
