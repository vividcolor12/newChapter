import { chromium } from 'playwright';
import fs from 'fs';
import { convertInPage } from './generate-jsx.mjs';

const URL = 'https://theirmood.com/card/vzUGuBO4E1';
const OUT = 'out/missing';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const opens = [];
page.on('popup', (p) => opens.push(p.url()));
page.on('dialog', (d) => { opens.push('dialog:' + d.message().slice(0, 40)); d.accept(); });
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (/\.(mp3|m4a|ogg|wav|aac)(\?|$)/i.test(u)) console.log('AUDIO REQ', u);
  route.continue();
});

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForSelector('.overlay-color-purple', { timeout: 20_000 }).catch(() => {});
await page.waitForTimeout(400);

const early = await page.evaluate(() => {
  const overlay = document.querySelector('.overlay-color-purple');
  const audios = [...document.querySelectorAll('audio, video, source')].map((a) => ({
    tag: a.tagName, src: a.currentSrc || a.src, cls: a.className, attrs: [...a.attributes].map((x) => [x.name, x.value.slice(0, 200)]),
  }));
  const anims = overlay ? [...overlay.querySelectorAll('*')].slice(0, 40).map((el) => {
    const cs = getComputedStyle(el);
    return { cls: String(el.className).slice(0, 80), anim: cs.animationName, dur: cs.animationDuration, delay: cs.animationDelay };
  }).filter((x) => x.anim && x.anim !== 'none') : [];
  const countdown = document.querySelector('.countdown')?.innerText?.replace(/\s+/g, ' ');
  const dday = document.querySelector('.dday-text')?.innerText?.replace(/\s+/g, ' ');
  return { overlayHtml: overlay ? overlay.outerHTML.length : 0, overlayVisible: overlay ? getComputedStyle(overlay).display : null, audios, anims, countdown, dday, now: Date.now() };
});
fs.writeFileSync(`${OUT}/early.json`, JSON.stringify(early, null, 2));
const opening = await page.evaluate(convertInPage, '.overlay-color-purple');
fs.writeFileSync(`${OUT}/opening.jsx.txt`, opening?.jsx || 'NONE');
await page.screenshot({ path: `${OUT}/opening.png` });
console.log('early overlay', early.overlayHtml, 'visible', early.overlayVisible, 'audios', early.audios.length, 'anims', early.anims.length);
console.log('countdown', early.countdown, '|', early.dday);

await page.waitForFunction(() => {
  const o = document.querySelector('.overlay-color-purple');
  if (!o) return true;
  const cs = getComputedStyle(o);
  return cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0' || o.getBoundingClientRect().height === 0;
}, null, { timeout: 40_000 }).catch(() => console.log('overlay did not hide'));
await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
await page.waitForTimeout(600);

const late = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { sel, cls: String(el.className).slice(0, 120), display: cs.display, pos: cs.position, parent: String(el.parentElement?.className).slice(0, 80) };
  };
  return {
    audio: [...document.querySelectorAll('audio')].map((a) => ({ src: a.currentSrc || a.src, paused: a.paused, loop: a.loop, autoplay: a.autoplay })),
    floating: pick('.floating-menu-btn'),
    flower: pick('.floatingBox'),
    music: [...document.querySelectorAll('button, a')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top < 90 && r.right > 300 && r.width < 80 && r.height < 80 && r.width > 10;
    }).map((el) => ({ tag: el.tagName, cls: String(el.className).slice(0, 80), html: el.outerHTML.slice(0, 400) })),
    video: document.querySelector('#section-video')?.innerHTML.slice(0, 500) || 'MISSING',
    sections: [...document.querySelectorAll('[id^="section-"], .ending-v2-area')].map((el) => el.id || el.className),
    countdown: document.querySelector('.countdown')?.innerText?.replace(/\s+/g, ' '),
    dday: document.querySelector('.dday-text')?.innerText?.replace(/\s+/g, ' '),
    now: new Date().toISOString(),
  };
});
fs.writeFileSync(`${OUT}/late.json`, JSON.stringify(late, null, 2));
console.log(JSON.stringify({ audio: late.audio, floating: late.floating, flower: late.flower, music: late.music.map((m) => m.cls), video: late.video.slice(0, 120), countdown: late.countdown, dday: late.dday }, null, 1));

for (const [name, sel] of [['menu', '.floating-menu-btn'], ['flower', '.floatingBox'], ['music', '.skip-btn']]) {
  const hit = await page.evaluate((s) => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, sel);
  await page.waitForTimeout(800);
  const popped = await page.evaluate(convertInPage, '.popup-stack > *, .popup-wrapper, .drawer, [class*="menu-panel"], [class*="drawer"]');
  console.log('click', name, hit, 'popup', popped ? popped.jsx.slice(0, 80).replace(/\n/g, ' ') : 'none');
  if (popped) fs.writeFileSync(`${OUT}/${name}.popup.jsx.txt`, popped.jsx);
  await page.keyboard.press('Escape').catch(() => {});
  await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn, .close-btn, .x_button')?.click());
  await page.waitForTimeout(300);
}

const floatJsx = await page.evaluate(convertInPage, '.floating-menu-btn');
const flowerJsx = await page.evaluate(convertInPage, '.floatingBox');
fs.writeFileSync(`${OUT}/floating-menu.jsx.txt`, floatJsx?.jsx || 'NONE');
fs.writeFileSync(`${OUT}/floating-flower.jsx.txt`, flowerJsx?.jsx || 'NONE');

const navi = [];
for (const label of ['네이버지도', '티맵', '카카오내비']) {
  const before = opens.length;
  const href = await page.evaluate((text) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes(text));
    if (!btn) return null;
    const a = btn.closest('a');
    btn.click();
    return a?.href || btn.getAttribute('onclick') || 'clicked';
  }, label);
  await page.waitForTimeout(500);
  page.on('dialog', () => {});
  navi.push({ label, href, newOpens: opens.slice(before) });
}
fs.writeFileSync(`${OUT}/navi.json`, JSON.stringify({ navi, opens }, null, 2));
console.log('navi', JSON.stringify(navi), 'opens', opens);

await browser.close();
