import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://theirmood.com/card/vzUGuBO4E1';
const browser = await chromium.launch({ headless: true });

async function fresh() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const reqs = [];
  page.on('request', (r) => reqs.push(r.url()));
  page.on('dialog', (d) => d.accept());
  await page.addInitScript(() => {
    window.__opens = [];
    const orig = window.open;
    window.open = function (u) { window.__opens.push(String(u)); try { return orig.apply(this, arguments); } catch { return null; } };
    const assign = location.assign.bind(location);
    location.assign = (u) => { window.__opens.push('assign:' + u); };
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  return { page, reqs };
}

const a = await fresh();
const timing = await a.page.evaluate(async () => {
  const t0 = performance.now();
  const samples = [];
  for (let i = 0; i < 16; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    const o = document.querySelector('.overlay-color-purple');
    const cs = o ? getComputedStyle(o) : null;
    samples.push({ t: Math.round(performance.now() - t0), display: cs?.display || 'gone', opacity: cs?.opacity || '-', h: o ? Math.round(o.getBoundingClientRect().height) : 0 });
    if (!o || cs.display === 'none' || cs.opacity === '0') break;
  }
  const sound = document.querySelector('.sound');
  const chain = [];
  for (let n = sound; n && chain.length < 6; n = n.parentElement) chain.push(`${n.tagName}.${String(n.className).slice(0, 60)}`);
  return { samples, chain, soundHtml: sound?.parentElement?.outerHTML.slice(0, 800) || 'none' };
});
fs.writeFileSync('out/missing/timing.json', JSON.stringify(timing, null, 2));
console.log(JSON.stringify(timing.samples));
console.log('sound chain', timing.chain.join(' < '));
await a.page.close();

const b = await fresh();
await b.page.waitForTimeout(7000);
await b.page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
await b.page.waitForTimeout(400);
const flower = await b.page.evaluate(() => {
  const el = document.querySelector('.floatingBox');
  const before = location.href;
  el?.click();
  return {
    href: location.href === before ? 'same' : location.href,
    opens: window.__opens,
    popup: document.querySelector('.popup-stack, .sketch-popup, .popup-wrapper')?.className || null,
    hash: location.hash,
  };
});
console.log('flower click', JSON.stringify(flower));
await b.page.close();

for (const label of ['네이버지도', '티맵', '카카오내비']) {
  const c = await fresh();
  await c.page.waitForTimeout(6500);
  await c.page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
  const before = c.reqs.length;
  await c.page.evaluate((text) => {
    const btn = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(text));
    btn?.click();
  }, label);
  await c.page.waitForTimeout(600);
  const extra = await c.page.evaluate(() => window.__opens);
  const req = c.reqs.slice(before).filter((u) => /tmap|nmap|kakao|navi|map\.naver|intent/i.test(u));
  console.log(label, JSON.stringify({ extra, req }));
  await c.page.close();
}

const menu = await fresh();
await menu.page.waitForTimeout(6500);
await menu.page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
await menu.page.evaluate(() => document.querySelector('.floating-menu-btn')?.click());
await menu.page.waitForTimeout(500);
const items = await menu.page.evaluate(() => [...document.querySelectorAll('.drawer-body a, .drawer-body button, .drawer-tabbar button, .drawer-tabbar a, .menu-scroll a')].map((el) => `${el.tagName}.${String(el.className).slice(0, 40)} ${el.textContent.trim().slice(0, 30)}`));
fs.writeFileSync('out/missing/menu-items.json', JSON.stringify(items, null, 2));
console.log('menu items', items.length, items.slice(0, 25));
await browser.close();
