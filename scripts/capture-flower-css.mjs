import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('dialog', (d) => d.accept());
await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForTimeout(6000);
await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.floatingBox')?.click());
await page.waitForTimeout(800);
const hit = await page.evaluate(() => {
  const out = [];
  for (const sheet of document.styleSheets) {
    let list; try { list = [...sheet.cssRules]; } catch { continue; }
    for (const r of list) {
      if (/send-btn|names-row|410de070/.test(r.cssText)) out.push(r.cssText);
    }
  }
  const el = document.querySelector('.send-btn');
  const cs = el ? getComputedStyle(el) : null;
  return { n: out.length, sample: out.slice(0, 3), sheets: document.styleSheets.length, border: cs?.border, bg: cs?.backgroundColor };
});
fs.writeFileSync('out/missing/flower-css.json', JSON.stringify(hit, null, 2));
console.log('rules', hit.n, 'border', hit.border, 'sample0', (hit.sample[0] || '').slice(0, 180));
const CSS = 'src/styles/origin.css';
const existing = new Set(fs.readFileSync(CSS, 'utf8').split('\n'));
const added = hit.sample.length ? await page.evaluate(() => {
  const out = [];
  for (const sheet of document.styleSheets) {
    let list; try { list = sheet.cssRules; } catch { continue; }
    for (const r of list) if (/410de070|send-btn|names-row/.test(r.cssText)) out.push(r.cssText);
  }
  return out;
}) : [];
const fresh = added.filter((r) => !existing.has(r));
if (fresh.length) fs.appendFileSync(CSS, `\n${fresh.join('\n')}\n`);
console.log('fresh', fresh.length);
await browser.close();
