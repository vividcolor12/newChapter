import { chromium } from 'playwright';
import fs from 'fs';

const OUT = 'out/verify-popups';
fs.mkdirSync(OUT, { recursive: true });
const logs = [];

const CASES = [
  ['inner-0', ['#section-intro button']],
  ['inner-12', ['.interview-open-btn']],
  ['inner-14', ['.sketch-map']],
  ['inner-23', ['#section-guestbook button:not(.write):not(.open-all)']],
  ['inner-25', ['#section-guestbook .open-all']],
  ['inner-27', ['#section-account .list-head', '#section-account .holder']],
  ['inner-40', ['#section-rsvp button']],
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.route('**/ingest/**', async (route) => {
  logs.push(route.request().postData());
  await route.fulfill({ status: 204 });
});
const page = await ctx.newPage();
const dialogs = [];
page.on('dialog', (d) => { dialogs.push(d.message()); d.accept(); });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });

for (const [id, steps] of CASES) {
  for (const s of steps) {
    await page.evaluate((q) => document.querySelector(q).click(), s);
    await page.waitForTimeout(700);
  }
  const popup = await page.evaluate(() => {
    const el = document.querySelector('.popup-stack > *');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { cls: el.className, w: Math.round(r.width), h: Math.round(r.height), bodyOverflow: document.body.style.overflow };
  });
  await page.screenshot({ path: `${OUT}/${id}.png` });
  const closed = await page.evaluate(() => {
    const c = document.querySelector('.popup-stack .close-btn, .popup-stack .x_button, .popup-stack .pop-alert button');
    c?.click();
    return !!c;
  });
  await page.waitForTimeout(300);
  const gone = await page.evaluate(() => !document.querySelector('.popup-stack'));
  console.log(id, JSON.stringify(popup), 'closeBtn', closed, 'closed', gone);
}

const tl = [];
const state = () => page.evaluate(() => [...document.querySelectorAll('.timeline-v2 .slide')].findIndex((s) => getComputedStyle(s).display !== 'none'));
await page.evaluate(() => document.querySelector('.timeline-v2 .action-btn').click());
tl.push(await state());
const nav = (n) => page.evaluate((i) => {
  const s = [...document.querySelectorAll('.timeline-v2 .slide')].find((x) => getComputedStyle(x).display !== 'none');
  s.querySelectorAll('.nav-btn')[i].click();
}, n);
await nav(0); tl.push(await state());
await page.evaluate(() => document.querySelector('.timeline-v2 .action-btn').click());
for (let i = 0; i < 6; i += 1) { await nav(1); tl.push(await state()); }
console.log('timeline sequence', tl.join(','), '(expected 1,0,2,3,4,5,5,5)');

await page.evaluate(() => document.querySelector('#section-guestbook .remove').click());
await page.evaluate(() => document.querySelector('button[data-v-76006afa]').click());
console.log('dialogs', JSON.stringify(dialogs));

fs.writeFileSync('out/runtime-logs.ndjson', `${logs.join('\n')}\n`);
console.log('logs', logs.length);
await browser.close();
