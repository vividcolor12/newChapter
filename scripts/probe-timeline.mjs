import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'networkidle', timeout: 90_000 });
await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
await page.waitForTimeout(800);

const state = () => page.evaluate(() => {
  const slides = [...document.querySelectorAll('.timeline-v2 .slide')];
  return slides.map((s, i) => `${i}:${s.className.replace('slide ', '')}:${s.style.cssText || '-'}`).join(' ');
});
const click = async (label, fn) => {
  await page.evaluate(fn);
  const mid = await state();
  await page.waitForTimeout(900);
  console.log(label.padEnd(18), '\n   +0ms ', mid, '\n   +900ms', await state());
};

console.log('initial', await state());
await click('start', () => document.querySelector('.timeline-v2 .action-btn').click());
const visibleNav = (n) => `(() => { const s=[...document.querySelectorAll('.timeline-v2 .slide')].find(x=>getComputedStyle(x).display!=='none'); s.querySelectorAll('.nav-btn')[${n}].click(); })()`;
await click('prev on 1st', visibleNav(0));
await click('start again', () => document.querySelector('.timeline-v2 .action-btn')?.click());
for (let i = 0; i < 6; i += 1) await click(`next #${i + 1}`, visibleNav(1));
const disabled = await page.evaluate(() => [...document.querySelectorAll('.timeline-v2 .nav-btn')].map((b) => `${b.disabled ? 'D' : '-'}${b.className}`).join(' '));
console.log('nav buttons', disabled);
await browser.close();
