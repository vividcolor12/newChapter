import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://theirmood.com/card/vzUGuBO4E1';
const browser = await chromium.launch({ headless: true });

async function fresh() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
  await page.waitForFunction(() => {
    const o = document.querySelector('.overlay-color-purple');
    return !o || getComputedStyle(o).display === 'none' || getComputedStyle(o).visibility === 'hidden' || o.getBoundingClientRect().height === 0;
  }, null, { timeout: 30_000 }).catch(() => console.log('overlay still visible'));
  await page.waitForTimeout(800);
  return page;
}

const blurState = (page) => page.evaluate(() => [...document.querySelectorAll('.blur-active')].map((e) => `${e.tagName.toLowerCase()}.${e.className}`));

const page = await fresh();
const floating = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.floating-menu-btn, .floatingBox, [class*="floating"]')];
  return els.map((e) => ({ cls: String(e.className), parent: String(e.parentElement?.className), html: e.outerHTML.slice(0, 3000) }));
});
const phoneKids = await page.evaluate(() => {
  const phone = document.querySelector('.phone');
  return [...phone.children].map((c) => `${c.tagName.toLowerCase()}.${String(c.className)} ${[...c.attributes].filter((a) => a.name.startsWith('data-v')).map((a) => a.name)}`);
});
await page.screenshot({ path: 'out/floating-origin.png' });
console.log('phone children', JSON.stringify(phoneKids, null, 1));
console.log('floating', floating.map((f) => `${f.cls} <- ${f.parent}`).join('\n'));
console.log('blur idle', await blurState(page));

const checks = {
  viewer: ['.gallGridWrapper .item'],
  contact: ['#section-intro button'],
  copy: ['#section-account .list-head', '#section-account .holder'],
};
const blur = {};
for (const [k, steps] of Object.entries(checks)) {
  const p = await fresh();
  for (const s of steps) { await p.evaluate((q) => document.querySelector(q).click(), s); await p.waitForTimeout(800); }
  blur[k] = await blurState(p);
  await p.close();
}
console.log('blur on popup', JSON.stringify(blur, null, 1));
fs.writeFileSync('out/floating.json', JSON.stringify({ floating, phoneKids, blur }, null, 2));
await browser.close();
