import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await window.__seek(0.30);
  });
  await page.waitForTimeout(400);

  const cardInfo = await page.evaluate(() => {
    const card = document.querySelector('.inspect-label-card[data-id="board"]');
    const debug = window.__DATA_DEBUG__;
    const spacer = document.getElementById('scroll-spacer');
    const maxScroll = spacer.offsetHeight - window.innerHeight;
    return {
      scrollY: window.scrollY,
      maxScroll,
      tlProgress: debug.masterTl.progress(),
      stProgress: debug.masterTl.scrollTrigger.progress,
      classes: card ? card.className : null,
      display: card ? window.getComputedStyle(card).display : null,
      opacity: card ? window.getComputedStyle(card).opacity : null,
    };
  });
  console.log(cardInfo);
  await browser.close();
}

run();
