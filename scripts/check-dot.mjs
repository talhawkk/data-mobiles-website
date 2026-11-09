import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  for (const p of [0.23, 0.30, 0.37, 0.44, 0.52]) {
    await page.evaluate(async (prog) => {
      await window.__seek(prog);
    }, p);
    await page.waitForTimeout(300);

    const res = await page.evaluate((prog) => {
      const debug = window.__DATA_DEBUG__;
      const id = prog === 0.23 ? 'battery' : prog === 0.30 ? 'board' : prog === 0.37 ? 'camera' : prog === 0.44 ? 'port' : 'screen';
      const partName = id === 'camera' ? 'cameraUnit' : id;
      const dot = debug.phone.getPartFacingDot(partName, debug.camera);
      const screenPos = debug.phone.getPartScreenPosition(partName, debug.camera, 1440, 900);
      const card = document.querySelector(`.inspect-label-card[data-id="${id}"]`);
      return {
        p: prog,
        id,
        partName,
        dot,
        screenPos,
        display: card ? window.getComputedStyle(card).display : null,
        opacity: card ? window.getComputedStyle(card).opacity : null,
        classes: card ? card.className : null,
      };
    }, p);
    console.log(res);
  }
  await browser.close();
}

run();
