import { chromium } from 'playwright';
import fs from 'fs';
import { convertInPage } from './generate-jsx.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('dialog', (d) => d.accept());
const reqs = [];
page.on('request', (r) => reqs.push(r.url()));
await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForTimeout(6000);
await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
await page.waitForTimeout(400);

await page.evaluate(() => document.querySelector('.floatingBox')?.click());
await page.waitForTimeout(800);
const flower = await page.evaluate(convertInPage, '.popup-stack > *');
fs.writeFileSync('out/missing/flower.popup.jsx.txt', flower?.jsx || 'NONE');
console.log('flower popup', (flower?.jsx || 'NONE').slice(0, 400));
await page.screenshot({ path: 'out/missing/flower-popup.png' });
await page.evaluate(() => document.querySelector('.close-btn, .x_button, .pop-alert button')?.click());

await page.evaluate(() => document.querySelector('.floating-menu-btn')?.click());
await page.waitForTimeout(400);
const drawer = await page.evaluate(() => {
  const el = document.querySelector('.drawer-screen');
  return el ? el.outerHTML : 'NONE';
});
fs.writeFileSync('out/missing/drawer.html', drawer);
console.log('drawer bytes', drawer.length);

for (const label of ['네이버지도', '티맵', '카카오내비']) {
  const n = reqs.length;
  await page.evaluate((text) => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === text)?.click(), label);
  await page.waitForTimeout(500);
  console.log(label, reqs.slice(n).filter((u) => !/google|analytics|sentry|nrbe|pstatic/.test(u)).slice(0, 8));
}
await browser.close();
