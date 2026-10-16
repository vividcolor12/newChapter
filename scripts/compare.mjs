import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(path.resolve(__dirname, '..'), 'out');
const ORIGIN = 'https://theirmood.com/card/vzUGuBO4E1';
const CLONE = 'http://127.0.0.1:5173/';
const SCOPES = ['data-v-71ec9210', 'data-v-716e9524', 'data-v-f266128e', 'data-v-9742d2b2'];

async function open(browser, url) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.evaluate(async () => {
    const d = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await d(250);
    }
  });
  return page;
}

function outline() {
  const leaf = [...document.querySelectorAll('section, [class*="section"], [class*="Wrapper"], [class*="banner"], [class*="Banner"]')];
  return leaf
    .map((el) => {
      const r = el.getBoundingClientRect();
      const dv = [...el.attributes].find((a) => a.name.startsWith('data-v-'));
      return {
        tag: el.tagName,
        dv: dv ? dv.name : null,
        cls: (el.className?.toString?.() || '').slice(0, 80),
        top: Math.round(r.top + scrollY),
        h: Math.round(r.height),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      };
    })
    .filter((n) => n.h > 0)
    .sort((a, b) => a.top - b.top);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const result = {};

  const o = await open(browser, ORIGIN);
  await o.keyboard.press('Escape').catch(() => {});
  result.originOutline = await o.evaluate(outline);

  result.originCss = await o.evaluate((scopes) => {
    const acc = {};
    for (const s of scopes) acc[s] = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      const walk = (list, media) => {
        for (const r of list) {
          if (r.cssRules && !r.selectorText) { walk(r.cssRules, r.conditionText || media); continue; }
          const t = r.cssText || '';
          for (const s of scopes) if (t.includes(s)) acc[s].push(media ? `@media ${media}{${t}}` : t);
        }
      };
      walk(rules, null);
    }
    return acc;
  }, SCOPES);

  result.originGallery = await o.evaluate(() => {
    const g = document.querySelector('.gallGridWrapper');
    if (!g) return null;
    const cs = getComputedStyle(g);
    const parent = g.closest('section') || g.parentElement;
    return {
      parentHtml: parent.outerHTML.replace(/<img[^>]*>/g, '').slice(0, 3000),
      grid: {
        cols: cs.gridTemplateColumns, rows: cs.gridAutoRows, tRows: cs.gridTemplateRows,
        gap: cs.gap, flow: cs.gridAutoFlow, width: g.getBoundingClientRect().width,
      },
      items: [...g.children].map((c) => {
        const r = c.getBoundingClientRect();
        return { span: c.dataset.isSpan, x: Math.round(r.left), y: Math.round(r.top - g.getBoundingClientRect().top), w: Math.round(r.width), h: Math.round(r.height) };
      }),
    };
  });

  result.originMidBanner = await o.evaluate(() => {
    const t = document.querySelector('.handwrite-text-img');
    if (!t) return null;
    let root = t;
    for (let i = 0; i < 4 && root.parentElement; i++) root = root.parentElement;
    return { html: root.outerHTML.slice(0, 4000), rect: root.getBoundingClientRect().toJSON() };
  });

  result.originOverlay = await o.evaluate(() => {
    const ov = document.querySelector('.overlay-color-purple');
    if (!ov) return null;
    const c = getComputedStyle(ov);
    return { html: ov.outerHTML.slice(0, 1500), position: c.position, zIndex: c.zIndex, opacity: c.opacity, rect: ov.getBoundingClientRect().toJSON() };
  });
  await o.locator('.gallGridWrapper .item').nth(4).dispatchEvent('click');
  await o.waitForTimeout(1200);
  result.originPopup = await o.evaluate(() => {
    const s = document.querySelector('section[data-v-f266128e]');
    if (!s) return null;
    const pick = (sel) => {
      const el = s.querySelector(sel) || (sel === 'self' ? s : null);
      if (!el) return null;
      const c = getComputedStyle(el);
      return { sel, rect: el.getBoundingClientRect().toJSON(), position: c.position, bg: c.backgroundColor, display: c.display, padding: c.padding, height: c.height, objectFit: c.objectFit };
    };
    return {
      self: pick('self'),
      parts: ['.inner', '.head', '.close', '.image-container', '.swiper-slide-active img', '.func-wrap', '.count'].map(pick),
    };
  });
  await o.screenshot({ path: path.join(OUT, 'origin-popup.png') });
  await o.keyboard.press('Escape').catch(() => {});

  const c = await open(browser, CLONE);
  result.cloneOutline = await c.evaluate(outline);

  fs.writeFileSync(path.join(OUT, 'compare.json'), JSON.stringify(result, null, 2), 'utf8');
  await browser.close();
  console.log('written out/compare.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
