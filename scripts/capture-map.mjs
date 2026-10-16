import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(path.resolve(__dirname, '..'), 'public', 'assets', 'location');

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForSelector('.overlay-color-purple', { state: 'hidden', timeout: 20_000 }).catch(() => {});
  await page.waitForSelector('.popup-wrapper .close-btn', { timeout: 10_000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
  await page.waitForTimeout(1000);
  await page.addStyleTag({ content: '[data-aos]{opacity:1!important;transform:none!important;transition:none!important}' });
  const map = page.locator('#naver-map');
  await map.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(2500);
  const info = await map.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const chain = [];
    for (let n = el; n; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.opacity !== '1' || c.visibility !== 'visible' || c.transform !== 'none') chain.push({ cls: n.className?.toString().slice(0, 50), opacity: c.opacity, vis: c.visibility, tf: c.transform });
    }
    return { rect: r.toJSON(), hit: hit?.outerHTML.slice(0, 200), tiles: el.querySelectorAll('img').length, chain };
  });
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: path.join(DIR, 'map-viewport.png') });
  await map.screenshot({ path: path.join(DIR, 'map.png') });
  await browser.close();
  console.log('saved map.png');
}

main().catch((e) => { console.error(e); process.exit(1); });
