import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(path.resolve(__dirname, '..'), 'out', 'sections');

const SECTIONS = {
  hero: '.main-screen-section',
  invitation: 'section[data-v-244400fe]',
  profile: 'section[data-v-e784f9aa]',
  calendar: 'section[data-v-5abd3df4]',
  dday: 'section[data-v-1025a444]',
  timeline: 'section[data-v-99341f54]',
  interview: 'section[data-v-d8d39138]',
  location: 'section[data-v-6bb576ad]',
  notice: 'section[data-v-db62f1d8]',
  gallery: 'section[data-v-24d61f37]',
  guestbook: 'section[data-v-2a9d6a30]',
  account: 'section[data-v-a76b5a42]',
  rsvp: 'section[data-v-6fea5739]',
  photoShare: 'section[data-v-1a64dd82]',
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'networkidle', timeout: 90_000 });
  await page.evaluate(async () => {
    const d = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await d(200); }
  });

  const globalCss = await page.evaluate(() => {
    const out = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      const walk = (list, media) => {
        for (const r of list) {
          if (r.cssRules && !r.selectorText) { walk(r.cssRules, r.conditionText || media); continue; }
          const t = r.cssText || '';
          if (/\.(ft-gowundodum|gowundodum|theme_emp_color_purple|theme_|eng_title|ko_title|bg_theme_white)\b/.test(t) && !t.includes('data-v-')) {
            out.push(media ? `@media ${media}{${t}}` : t);
          }
        }
      };
      walk(rules, null);
    }
    return out;
  });
  fs.writeFileSync(path.join(OUT, '_global.css'), globalCss.join('\n'));

  for (const [key, sel] of Object.entries(SECTIONS)) {
    const data = await page.evaluate((s) => {
      const root = document.querySelector(s);
      if (!root) return null;
      const scopes = new Set();
      [root, ...root.querySelectorAll('*')].forEach((el) => {
        for (const a of el.attributes) if (a.name.startsWith('data-v-')) scopes.add(a.name.replace(/-s$/, ''));
      });
      const css = [];
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        const walk = (list, media) => {
          for (const r of list) {
            if (r.cssRules && !r.selectorText) { walk(r.cssRules, r.conditionText || media); continue; }
            const t = r.cssText || '';
            if ([...scopes].some((sc) => t.includes(`[${sc}]`))) css.push(media ? `@media ${media}{${t}}` : t);
          }
        };
        walk(rules, null);
      }
      const html = root.outerHTML
        .replace(/<!---->/g, '')
        .replace(/ data-v-[0-9a-f]+(-s)?=""/g, '')
        .replace(/<path [^>]{200,}?>/g, '<path …>')
        .replace(/>\s+</g, '><');
      return { html, css: css.map((c) => c.replace(/\[data-v-[0-9a-f]+\]/g, '')) };
    }, sel);
    if (!data) { console.log('missing', key); continue; }
    fs.writeFileSync(path.join(OUT, `${key}.html`), data.html);
    fs.writeFileSync(path.join(OUT, `${key}.css`), data.css.join('\n'));
    console.log(key, 'html', data.html.length, 'css rules', data.css.length);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
