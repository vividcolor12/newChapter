import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.join(path.resolve(__dirname, '..'), 'src', 'styles', 'origin.css');

const TRIGGERS = process.argv[2] === 'all' ? [
  ['#section-intro button'],
  ['.interview-open-btn'],
  ['.sketch-map'],
  ['#section-guestbook button'],
  ['#section-guestbook .open-all'],
  ['#section-account .head, #section-account [class*="head"]', '#section-account .holder'],
  ['#section-rsvp button'],
  ['.gallGridWrapper .item'],
] : [
  ['#section-guestbook .open-all'],
  ['#section-account .head, #section-account [class*="head"]', '#section-account .holder'],
];

function dumpRules() {
  const out = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const base = sheet.href || location.href;
    for (const r of rules) {
      if (r.type === CSSRule.IMPORT_RULE) continue;
      out.push(r.cssText.replace(/url\((["']?)([^)"']+)\1\)/g, (m, q, u) => {
        if (/^(data:|#)/.test(u)) return m;
        try { return `url("${new URL(u, base).href}")`; } catch { return m; }
      }));
    }
  }
  return out;
}

async function main() {
  const existing = new Set(fs.readFileSync(CSS, 'utf8').split('\n'));
  const added = [];
  const browser = await chromium.launch({ headless: true });
  for (const steps of TRIGGERS) {
    const sel = steps.join(' -> ');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForSelector('.popup-wrapper .close-btn', { timeout: 10_000 }).catch(() => {});
    await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
    await page.waitForTimeout(800);
    await page.evaluate(() => { navigator.clipboard.writeText = async () => {}; });
    let clicked = true;
    for (const s of steps) {
      clicked = clicked && await page.evaluate((q) => {
        const el = document.querySelector(q);
        if (!el) return false;
        el.click();
        return true;
      }, s);
      await page.waitForTimeout(1200);
    }
    const rules = await page.evaluate(dumpRules);
    let n = 0;
    for (const r of rules) {
      if (!existing.has(r)) { existing.add(r); added.push(r); n += 1; }
    }
    console.log(sel.slice(0, 40).padEnd(42), clicked ? 'clicked' : 'NOT FOUND', 'new rules', n);
    await ctx.close();
  }
  await browser.close();
  fs.appendFileSync(CSS, `\n${added.join('\n')}`);
  console.log('appended', added.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
