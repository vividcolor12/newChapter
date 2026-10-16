import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(path.resolve(__dirname, '..'), 'out');
const ORIGIN = 'https://theirmood.com/card/vzUGuBO4E1';

function collectCss(scopes) {
  const acc = {};
  for (const s of scopes) acc[s] = [];
  const all = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list, media) => {
      for (const r of list) {
        if (r.cssRules && !r.selectorText) { walk(r.cssRules, r.conditionText || media); continue; }
        const t = r.cssText || '';
        all.push(t);
        for (const s of scopes) if (t.includes(s)) acc[s].push(media ? `@media ${media}{${t}}` : t);
      }
    };
    walk(rules, null);
  }
  acc.swiper = all.filter((t) => /\.swiper(-|\b)/.test(t) && !t.includes('data-v-')).slice(0, 80);
  acc.rootVars = all.filter((t) => /^(:root|html|\.bg_theme_white)\b/.test(t)).map((t) => t.slice(0, 1500));
  return acc;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  await page.goto(ORIGIN, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.evaluate(async () => {
    const d = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await d(250); }
  });
  await page.waitForSelector('.overlay-color-purple', { state: 'hidden', timeout: 20_000 }).catch(async () => {
    await page.mouse.click(195, 400);
    await page.waitForSelector('.overlay-color-purple', { state: 'hidden', timeout: 20_000 }).catch(() => {});
  });
  console.log('overlay visible:', await page.locator('.overlay-color-purple').isVisible().catch(() => false));

  const result = {};
  result.banners = await page.evaluate(() =>
    [...document.querySelectorAll('[id^="section-middle-image"]')].map((el) => ({ id: el.id, html: el.outerHTML.slice(0, 5000) })),
  );
  result.htmlFontSize = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);

  result.scrollInfo = await page.evaluate(() => {
    const el = document.querySelectorAll('.gallGridWrapper .item')[4];
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, scrollY, bodyOverflow: getComputedStyle(document.body).overflow, htmlOverflow: getComputedStyle(document.documentElement).overflow };
  });
  console.log('scrollInfo', result.scrollInfo);
  await page.waitForTimeout(500);
  await page.mouse.click(result.scrollInfo.x, Math.min(Math.max(result.scrollInfo.y, 10), 830));
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('.gallGridWrapper .item')[4].click());
  await page.waitForSelector('section[data-v-f266128e]', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log('viewer:', await page.locator('section[data-v-f266128e]').count());

  result.popupHtml = await page.evaluate(() => {
    const s = document.querySelector('.popup-stack');
    return s ? s.outerHTML.slice(0, 6000) : null;
  });
  result.popupComputed = await page.evaluate(() => {
    const root = document.querySelector('section[data-v-f266128e]');
    if (!root) return null;
    const out = [];
    const sels = ['.popup-stack', '.popup-stack section[data-v-f266128e]', '.inner', '.head', '.close', '.image-container', '.swiper', '.swiper-slide-active', '.swiper-slide-active img', '.image-guard', '.func-wrap', '.count', '.swiper-button-prev'];
    for (const sel of sels) {
      const el = sel.startsWith('.popup-stack') ? document.querySelector(sel) : root.querySelector(sel);
      if (!el) { out.push({ sel, missing: true }); continue; }
      const c = getComputedStyle(el);
      out.push({
        sel, rect: el.getBoundingClientRect().toJSON(), position: c.position, top: c.top, zIndex: c.zIndex,
        display: c.display, flexDirection: c.flexDirection, justify: c.justifyContent, align: c.alignItems,
        padding: c.padding, margin: c.margin, bg: c.backgroundColor, color: c.color, font: c.font, gap: c.gap,
        objectFit: c.objectFit, width: c.width, height: c.height, maxHeight: c.maxHeight, overflow: c.overflow,
      });
    }
    return out;
  });
  result.css = await page.evaluate(collectCss, ['data-v-f266128e', 'data-v-9742d2b2', 'data-v-0bb1fb6e', 'data-v-2902f24b']);
  await page.screenshot({ path: path.join(OUT, 'origin-popup.png') });

  fs.writeFileSync(path.join(OUT, 'popup.json'), JSON.stringify(result, null, 2), 'utf8');
  if (result.popupHtml && result.popupHtml.includes('swiper-button-next')) {
    await page.locator('.popup-stack .swiper-button-next').click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    result.afterNext = await page.evaluate(() => document.querySelector('.popup-stack .count')?.innerText);
  }

  fs.writeFileSync(path.join(OUT, 'popup.json'), JSON.stringify(result, null, 2), 'utf8');
  await browser.close();
  console.log('written out/popup.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
