import { chromium } from 'playwright';
import fs from 'fs';

const OUT = 'out/verify-gaps';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const early = await page.evaluate(() => ({
  opening: !!document.querySelector('.overlay-color-purple'),
  openingH: Math.round(document.querySelector('.overlay-color-purple')?.getBoundingClientRect().height || 0),
  lottie: !!document.querySelector('.opening_text svg'),
  sound: !!document.querySelector('.sound'),
  menu: !!document.querySelector('.floating-menu-btn'),
  flower: !!document.querySelector('.floatingBox'),
  count: document.querySelector('.countdown')?.innerText.replace(/\s+/g, ' '),
}));
await page.screenshot({ path: `${OUT}/opening.png` });
await page.waitForTimeout(1300);
const later = await page.evaluate(() => document.querySelector('.countdown')?.innerText.replace(/\s+/g, ' '));
await page.waitForFunction(() => !document.querySelector('.overlay-color-purple'), null, { timeout: 8000 });
await page.waitForTimeout(300);
const after = await page.evaluate(() => ({
  opening: !!document.querySelector('.overlay-color-purple'),
  sound: document.querySelector('.sound')?.getBoundingClientRect().top,
  menu: Math.round(document.querySelector('.floating-menu-btn')?.getBoundingClientRect().bottom || 0),
  flower: Math.round(document.querySelector('.floatingBox')?.getBoundingClientRect().bottom || 0),
  audio: document.querySelector('audio')?.src,
}));
await page.screenshot({ path: `${OUT}/after.png` });

await page.evaluate(() => document.querySelector('#section-intro button')?.click());
await page.waitForTimeout(300);
const blur = await page.evaluate(() => document.querySelector('.container.blur-active') != null && !!document.querySelector('.popup-wrapper'));
await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
await page.waitForTimeout(200);

await page.evaluate(() => document.querySelector('.floating-menu-btn')?.click());
await page.waitForTimeout(300);
const menu = await page.evaluate(() => ({
  items: document.querySelectorAll('.section-item').length,
  open: !!document.querySelector('.drawer-screen'),
}));
await page.screenshot({ path: `${OUT}/menu.png` });
await page.evaluate(() => document.querySelector('.section-item')?.click());
await page.waitForTimeout(400);
const scrolled = await page.evaluate(() => Math.round(document.getElementById('section-intro')?.getBoundingClientRect().top || -1));

await page.evaluate(() => document.querySelector('.floatingBox')?.click());
await page.waitForTimeout(300);
const flowerPopup = await page.evaluate(() => document.querySelector('.send-btn')?.textContent || null);
await page.screenshot({ path: `${OUT}/flower.png` });

console.log(JSON.stringify({ early, later, changed: early.count !== later, after, blur, menu, scrolled, flowerPopup, errors }, null, 2));
await browser.close();
