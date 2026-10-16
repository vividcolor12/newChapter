import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://theirmood.com/card/vzUGuBO4E1';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const urls = [];
page.on('request', (r) => {
  const u = r.url();
  if (/lottie|json|bgm|navi|tmap|nmap|kakaonavi/i.test(u)) urls.push(u);
});
const opened = [];
await page.exposeFunction('__opened', (u) => opened.push(u));
await page.addInitScript(() => {
  const orig = window.open;
  window.open = (u, ...rest) => { window.__opened(String(u)); return orig?.call(window, u, ...rest) || null; };
});
page.on('dialog', (d) => d.accept());
await page.goto(URL, { waitUntil: 'networkidle', timeout: 90_000 });
await page.waitForTimeout(500);

const bgm = await page.evaluate(() => document.querySelector('.bgm-wrapper')?.outerHTML || 'NONE');
fs.writeFileSync('out/missing/bgm.html', bgm);
console.log('bgm', bgm.slice(0, 600));

await page.waitForFunction(() => {
  const o = document.querySelector('.overlay-color-purple');
  return !o || getComputedStyle(o).display === 'none' || getComputedStyle(o).opacity === '0';
}, null, { timeout: 20000 }).catch(() => {});
await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
await page.waitForTimeout(500);

const before = await page.evaluate(() => document.body.innerText.length);
await page.evaluate(() => document.querySelector('.floating-menu-btn')?.click());
await page.waitForTimeout(700);
const menu = await page.evaluate(() => {
  const added = [...document.querySelectorAll('.drawer-clip, .menu, [class*="menu"], [class*="drawer"]')]
    .filter((el) => el.getBoundingClientRect().width > 0)
    .map((el) => `${el.tagName}.${String(el.className).slice(0, 100)} h=${Math.round(el.getBoundingClientRect().height)}`);
  const panel = document.querySelector('.drawer-clip.active');
  return { added: added.slice(0, 12), panel: panel ? panel.innerText.slice(0, 400) : null };
});
console.log('menu', JSON.stringify(menu, null, 1));
fs.writeFileSync('out/missing/menu.json', JSON.stringify(menu, null, 2));
await page.screenshot({ path: 'out/missing/menu.png' });

await page.evaluate(() => document.querySelector('.floating-menu-btn')?.click());
await page.waitForTimeout(400);
const flowerHref = await page.evaluate(() => {
  const a = document.querySelector('.floatingBox');
  return a ? { href: a.getAttribute('href'), target: a.target, html: a.outerHTML.slice(0, 200) } : null;
});
console.log('flower', JSON.stringify(flowerHref));
await page.evaluate(() => document.querySelector('.floatingBox')?.click());
await page.waitForTimeout(800);
console.log('opened after flower', opened);

for (const label of ['네이버지도', '티맵', '카카오내비']) {
  const n = opened.length;
  await page.evaluate((text) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(text))?.click(), label);
  await page.waitForTimeout(400);
  console.log(label, opened.slice(n));
}
console.log('urls', [...new Set(urls)].slice(0, 40));
await browser.close();
