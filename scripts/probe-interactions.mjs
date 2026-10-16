import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertInPage } from './generate-jsx.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(path.resolve(__dirname, '..'), 'out', 'interactions');
const URL_ORIGIN = 'https://theirmood.com/card/vzUGuBO4E1';

async function freshPage(browser, record) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://theirmood.com' });
  const page = await ctx.newPage();
  let loaded = false;
  await page.route('**/*', (route) => {
    const req = route.request();
    if (loaded && req.isNavigationRequest() && req.frame() === page.mainFrame()) {
      record.navigation = req.url();
      return route.abort();
    }
    return route.continue();
  });
  page.on('dialog', async (d) => { record.dialogs = [...(record.dialogs || []), d.message()]; await d.dismiss().catch(() => {}); });
  ctx.on('page', async (p) => { record.newWindow = p.url(); await p.close().catch(() => {}); });
  await page.addInitScript(() => {
    window.__probe = { opens: [], clips: [] };
    const origOpen = window.open;
    window.open = (u, ...rest) => { window.__probe.opens.push(String(u)); return null; };
    void origOpen;
    if (navigator.clipboard) {
      navigator.clipboard.writeText = async (t) => { window.__probe.clips.push(t); };
    }
    document.execCommand = ((orig) => function (cmd, ...a) {
      if (cmd === 'copy') window.__probe.clips.push(String(document.getSelection() || document.activeElement?.value || ''));
      return orig.call(this, cmd, ...a);
    })(document.execCommand);
  });
  await page.goto(URL_ORIGIN, { waitUntil: 'networkidle', timeout: 90_000 });
  loaded = true;
  await page.waitForSelector('.popup-wrapper .close-btn', { timeout: 10_000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('.popup-wrapper .close-btn')?.click());
  await page.waitForSelector('.overlay-color-purple', { state: 'hidden', timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(600);
  return { ctx, page };
}

function listTargets() {
  const container = document.querySelector('#section-main').parentElement;
  const isPointer = (el) => getComputedStyle(el).cursor === 'pointer' || ['BUTTON', 'A'].includes(el.tagName);
  const inner = [...container.querySelectorAll('*')].filter((el) => isPointer(el) && !(el.parentElement && isPointer(el.parentElement)) && !el.closest('.gallGridWrapper') && !el.closest('#naver-map'));
  const fixed = [...document.body.querySelectorAll('*')].filter((el) => {
    if (container.contains(el) || el.closest('.popup-stack')) return false;
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return c.position === 'fixed' && r.width > 0 && r.height > 0 && r.width < 200;
  });
  const describe = (el, kind, i) => {
    el.setAttribute('data-probe-id', `${kind}-${i}`);
    const block = el.closest('[id^="section-"], .ending-v2-area');
    return {
      id: `${kind}-${i}`, kind, tag: el.tagName.toLowerCase(), cls: el.className?.toString().slice(0, 80),
      text: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      href: el.getAttribute('href'), block: block?.id || block?.className || null,
    };
  };
  return [...inner.map((el, i) => describe(el, 'inner', i)), ...fixed.map((el, i) => describe(el, 'fixed', i))];
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const first = await freshPage(browser, {});
  const targets = await first.page.evaluate(listTargets);
  const fixedHtml = await first.page.evaluate(() => {
    const container = document.querySelector('#section-main').parentElement;
    return [...document.body.querySelectorAll('[data-probe-id^="fixed"]')].map((el) => ({ id: el.dataset.probeId, html: el.outerHTML.slice(0, 3000), container: container.contains(el) }));
  });
  fs.writeFileSync(path.join(OUT, 'fixed.json'), JSON.stringify(fixedHtml, null, 2));
  await first.ctx.close();
  console.log('targets', targets.length);

  const results = [];
  for (const t of targets) {
    const record = { ...t };
    const { ctx, page } = await freshPage(browser, record);
    try {
      await page.evaluate(listTargets);
      const before = await page.evaluate((blockId) => {
        const b = blockId && (document.getElementById(blockId) || document.querySelector(`.${blockId}`));
        return b ? b.outerHTML : '';
      }, t.block);
      await page.evaluate((id) => {
        const el = document.querySelector(`[data-probe-id="${id}"]`);
        el.scrollIntoView({ block: 'center' });
        el.click();
      }, t.id);
      await page.waitForTimeout(1200);
      const after = await page.evaluate((blockId) => {
        const b = blockId && (document.getElementById(blockId) || document.querySelector(`.${blockId}`));
        const stack = document.querySelector('.popup-stack');
        const popup = stack && [...stack.children].find((c) => c.tagName !== 'TEMPLATE');
        if (popup) popup.setAttribute('data-probe-popup', '1');
        return {
          block: b ? b.outerHTML : '',
          popupClass: popup ? `${popup.tagName.toLowerCase()}.${popup.className}` : null,
          opens: window.__probe.opens, clips: window.__probe.clips,
          bodyOverflow: document.body.style.overflow,
        };
      }, t.block);
      record.blockChanged = before !== after.block;
      record.popupClass = after.popupClass;
      record.opens = after.opens;
      record.clips = after.clips;
      if (after.popupClass) {
        const conv = await page.evaluate(convertInPage, '[data-probe-popup="1"]');
        record.popupJsxFile = `${t.id}.popup.jsx.txt`;
        fs.writeFileSync(path.join(OUT, record.popupJsxFile), conv.jsx);
        await page.screenshot({ path: path.join(OUT, `${t.id}.popup.png`) });
      }
      if (record.blockChanged && t.block) {
        const conv = await page.evaluate(convertInPage, `#${t.block}`);
        if (conv) {
          record.blockJsxFile = `${t.id}.block.jsx.txt`;
          fs.writeFileSync(path.join(OUT, record.blockJsxFile), conv.jsx);
        }
      }
    } catch (e) {
      record.error = e.message.slice(0, 200);
    }
    results.push(record);
    console.log(t.id.padEnd(10), (t.block || '').padEnd(22), t.text.padEnd(24), '=>',
      record.popupClass || '', record.blockChanged ? '[block changed]' : '', record.navigation || '', (record.opens || []).join(' '), (record.clips || []).join(' '), (record.dialogs || []).join(' '), record.error || '');
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
