import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(path.resolve(__dirname, '..'), 'out', 'verify');

const ORIGIN_SECTIONS = [
  ['hero', '.main-screen-section'],
  ['invitation', 'section[data-v-244400fe]'],
  ['profile', 'section[data-v-e784f9aa]'],
  ['calendar', 'section[data-v-5abd3df4]'],
  ['dday', 'section[data-v-1025a444]'],
  ['timeline', 'section[data-v-99341f54]'],
  ['interview', 'section[data-v-d8d39138]'],
  ['midBanner', 'section.mid-banner-v6'],
  ['location', 'section[data-v-6bb576ad]'],
  ['notice', 'section[data-v-db62f1d8]'],
  ['gallery', 'section[data-v-24d61f37]'],
  ['guestbook', 'section[data-v-2a9d6a30]'],
  ['account', 'section[data-v-a76b5a42]'],
  ['rsvp', 'section[data-v-6fea5739]'],
  ['photoShare', 'section[data-v-1a64dd82]'],
  ['frame1', '#section-middle-image2 section'],
  ['frame2', '#section-middle-image3 section'],
  ['frame3', '#section-middle-image4 section'],
  ['saveTheDate', 'section.mid-banner-v20'],
  ['ending', 'section[data-v-57912525]'],
];
const CLONE_SECTIONS = [
  ['hero', 'section.hero'],
  ['invitation', 'section.invitation'],
  ['profile', 'section.profile'],
  ['calendar', 'section.calendar'],
  ['dday', 'section.dday'],
  ['timeline', 'section.timeline'],
  ['interview', 'section.interview'],
  ['midBanner', 'section.mid-banner-v6'],
  ['location', 'section.location'],
  ['notice', 'section.notice'],
  ['gallery', 'section.gallery'],
  ['guestbook', 'section.guestbook'],
  ['account', 'section.account'],
  ['rsvp', 'section.rsvp'],
  ['photoShare', 'section.photo-share'],
  ['frame1', 'section.mid-banner-v8 >> nth=0'],
  ['frame2', 'section.mid-banner-v8 >> nth=1'],
  ['frame3', 'section.mid-banner-v8 >> nth=2'],
  ['saveTheDate', 'section.mid-banner-v20'],
  ['ending', 'section.ending'],
];

const FORCE_VISIBLE = `
  .overlay-color-purple, .popup-wrapper { display: none !important; }
  [data-aos], .fade-up { opacity: 1 !important; transform: none !important; transition: none !important; }
  img[loading="lazy"] { content-visibility: visible; }
`;

async function measure(browser, name, url, sections) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForSelector('.popup-wrapper .close-btn', { timeout: 8_000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: FORCE_VISIBLE });
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
    const d = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await d(200); }
  });
  await page.waitForLoadState('networkidle');
  const rows = {};
  for (const [key, sel] of sections) {
    const loc = page.locator(sel).first();
    if (!(await loc.count())) { rows[key] = null; continue; }
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const box = await loc.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { h: Math.round(r.height), text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
    });
    rows[key] = box;
    await loc.screenshot({ path: path.join(OUT, `sec-${name}-${key}.png`) }).catch(() => {});
  }
  await page.close();
  return rows;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const origin = await measure(browser, 'origin', 'https://theirmood.com/card/vzUGuBO4E1', ORIGIN_SECTIONS);
  const clone = await measure(browser, 'clone', 'http://127.0.0.1:5173/', ORIGIN_SECTIONS);
  await browser.close();
  const table = ORIGIN_SECTIONS.map(([key]) => ({
    key,
    originH: origin[key]?.h ?? null,
    cloneH: clone[key]?.h ?? null,
    diff: origin[key] && clone[key] ? clone[key].h - origin[key].h : null,
  }));
  fs.writeFileSync(path.join(OUT, 'section-diff.json'), JSON.stringify({ table, origin, clone }, null, 2));
  console.table(table);
}

main().catch((e) => { console.error(e); process.exit(1); });
