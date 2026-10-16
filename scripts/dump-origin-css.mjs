import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out', 'sections');
const CSS_OUT = path.join(ROOT, 'src', 'styles', 'origin.css');

function dumpRules() {
  const out = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const base = sheet.href || location.href;
    for (const r of rules) {
      out.push(r.cssText.replace(/url\((["']?)([^)"']+)\1\)/g, (m, q, u) => {
        if (/^(data:|#)/.test(u)) return m;
        try { return `url("${new URL(u, base).href}")`; } catch { return m; }
      }));
    }
  }
  return out;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'networkidle', timeout: 90_000 });
  await page.evaluate(async () => {
    const d = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await d(200); }
  });
  await page.route('**/*', (route) =>
    route.request().isNavigationRequest() && route.request().frame() === page.mainFrame() ? route.abort() : route.continue(),
  );
  page.on('popup', (p) => p.close().catch(() => {}));
  await page.waitForSelector('.overlay-color-purple', { state: 'hidden', timeout: 20_000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
  await page.waitForTimeout(800);

  const wrapperChain = await page.evaluate(() => {
    const chain = [];
    let el = document.querySelector('#section-main');
    while (el && el !== document.documentElement) {
      chain.unshift({
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        cls: el.className?.toString() || undefined,
        dv: [...el.attributes].filter((a) => a.name.startsWith('data-v-')).map((a) => a.name),
        style: el.getAttribute('style') || undefined,
      });
      el = el.parentElement;
    }
    const main = document.querySelector('#section-main').parentElement;
    const children = [...main.children].map((c) => ({
      tag: c.tagName.toLowerCase(), id: c.id || undefined, cls: c.className?.toString(),
      dv: [...c.attributes].filter((a) => a.name.startsWith('data-v-')).map((a) => a.name),
      h: Math.round(c.getBoundingClientRect().height),
    }));
    return { chain, children, htmlClass: document.documentElement.className, bodyClass: document.body.className };
  });
  fs.writeFileSync(path.join(OUT, '_wrapper.json'), JSON.stringify(wrapperChain, null, 2));

  const cssBefore = await page.evaluate(dumpRules);
  console.log('rules before clicks', cssBefore.length);

  const buttons = await page.evaluate(() => {
    const main = document.querySelector('#section-main').parentElement;
    return [...main.querySelectorAll('button, [class*="btn"], .item, .more')]
      .map((el, i) => { el.setAttribute('data-probe', String(i)); return { i, text: (el.innerText || '').trim().slice(0, 30), cls: el.className?.toString().slice(0, 60) }; });
  });
  const popups = [];
  for (const b of buttons) {
    if (!b.text && !/item/.test(b.cls)) continue;
    if (/item/.test(b.cls) && b.i % 5 !== 0) continue;
    await page.evaluate((i) => document.querySelector(`[data-probe="${i}"]`)?.click(), b.i).catch(() => {});
    await page.waitForTimeout(900);
    const html = await page.evaluate(() => {
      const s = document.querySelector('.popup-stack');
      return s && s.children.length ? s.innerHTML.replace(/<!---->/g, '') : '';
    });
    if (html) popups.push({ button: b, html: html.replace(/<path [^>]{200,}?>/g, '<path …>').slice(0, 20000) });
    await page.evaluate(() => {
      const s = document.querySelector('.popup-stack');
      s?.querySelector('.close, .close-btn, [class*="close"], .btn-close')?.click();
    });
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  }
  fs.writeFileSync(path.join(OUT, '_popups.json'), JSON.stringify(popups, null, 2));

  const cssAfter = await page.evaluate(dumpRules).catch(() => []);
  console.log('rules after clicks', cssAfter.length, 'url', page.url());
  const merged = [...new Set([...cssBefore, ...cssAfter])];
  const css = merged.join('\n');
  fs.writeFileSync(CSS_OUT, css);
  console.log('buttons', buttons.length, 'popups', popups.length, 'css bytes', css.length);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
