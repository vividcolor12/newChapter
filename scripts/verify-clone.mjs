import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(path.resolve(__dirname, '..'), 'out', 'verify');
const TARGETS = {
  origin: {
    url: 'https://theirmood.com/card/vzUGuBO4E1',
    grid: '.gallGridWrapper',
    banners: '[id^="section-middle-image2"], [id^="section-middle-image5"]',
    ending: 'section[data-v-57912525]',
  },
  clone: {
    url: 'http://127.0.0.1:5173/',
    grid: '.gallGridWrapper',
    banners: '.mid-banner-v8, .mid-banner-v20',
    ending: 'section.ending',
  },
};

async function run(browser, name, t) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(t.url, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.evaluate(async () => {
    const d = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await d(300); }
  });
  await page.waitForSelector('.overlay-color-purple', { state: 'hidden', timeout: 20_000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
  await page.waitForTimeout(800);

  const info = await page.evaluate((sel) => {
    const g = document.querySelector(sel.grid);
    const gr = g.getBoundingClientRect();
    const items = [...g.children].map((c) => {
      const r = c.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top - gr.top), Math.round(r.width), Math.round(r.height)];
    });
    const banners = [...document.querySelectorAll(sel.banners)].map((b) => Math.round(b.getBoundingClientRect().height));
    const e = document.querySelector(sel.ending);
    return { gridHeight: Math.round(gr.height), items, banners, endingHeight: Math.round(e.getBoundingClientRect().height) };
  }, t);

  await page.locator(t.grid).screenshot({ path: path.join(OUT, `${name}-grid.png`) });
  const bannerEls = page.locator(t.banners);
  for (let i = 0; i < (await bannerEls.count()); i++) {
    await bannerEls.nth(i).screenshot({ path: path.join(OUT, `${name}-banner-${i}.png`) });
  }
  await page.locator(t.ending).screenshot({ path: path.join(OUT, `${name}-ending.png`) });

  await page.evaluate((sel) => document.querySelector(sel).children[4].click(), t.grid);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `${name}-viewer.png`) });
  info.viewerCount = await page.evaluate(() => document.querySelector('.func-wrap .count')?.innerText.replace(/\s+/g, ''));
  await page.evaluate(() => document.querySelector('.func-wrap .swiper-button-next').click());
  await page.waitForTimeout(1000);
  info.viewerCountAfterNext = await page.evaluate(() => document.querySelector('.func-wrap .count')?.innerText.replace(/\s+/g, ''));
  await ctx.close();
  return info;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const result = {};
  for (const [name, t] of Object.entries(TARGETS)) result[name] = await run(browser, name, t);
  await browser.close();
  const same = JSON.stringify(result.origin.items) === JSON.stringify(result.clone.items);
  console.log(JSON.stringify({ gridItemsIdentical: same, ...result }, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); });
