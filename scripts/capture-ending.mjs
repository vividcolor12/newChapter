import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const ASSETS = path.join(ROOT, 'public', 'assets', 'midBanner');
const ORIGIN = 'https://theirmood.com/card/vzUGuBO4E1';
const STATIC = ['/app/mCard/midBanner/v8/handwrite_text_black.png', '/app/mCard/midBanner/v20/save_the_date.png'];

async function main() {
  fs.mkdirSync(ASSETS, { recursive: true });
  for (const p of STATIC) {
    const res = await fetch(new URL(p, ORIGIN));
    fs.writeFileSync(path.join(ASSETS, path.basename(p)), Buffer.from(await res.arrayBuffer()));
    console.log('saved', path.basename(p), res.status);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto(ORIGIN, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.evaluate(async () => {
    const d = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await d(250); }
  });
  const result = await page.evaluate(() => {
    const sec = document.querySelector('section[data-v-57912525]');
    const scope = 'data-v-57912525';
    const css = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      const walk = (list, media) => {
        for (const r of list) {
          if (r.cssRules && !r.selectorText) { walk(r.cssRules, r.conditionText || media); continue; }
          if ((r.cssText || '').includes(scope)) css.push(media ? `@media ${media}{${r.cssText}}` : r.cssText);
        }
      };
      walk(rules, null);
    }
    const r = sec?.getBoundingClientRect();
    const afterEnding = [];
    let n = sec?.parentElement?.nextElementSibling;
    while (n && afterEnding.length < 5) { afterEnding.push(n.outerHTML.slice(0, 800)); n = n.nextElementSibling; }
    return { html: sec?.outerHTML.slice(0, 4000), rect: r?.toJSON(), css, afterEnding };
  });
  fs.writeFileSync(path.join(OUT, 'ending.json'), JSON.stringify(result, null, 2), 'utf8');
  await browser.close();
  console.log('written out/ending.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
