import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');

const TARGET_URL = 'https://theirmood.com/card/vzUGuBO4E1';
const VIEWPORT = { width: 390, height: 844 };
const DEVICE_SCALE = 2;

function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

function writeJson(name, data) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2), 'utf8');
}

function classifyResource(url, contentType = '') {
  const u = url.toLowerCase();
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('font') || /\.(woff2?|ttf|otf|eot)(\?|$)/.test(u)) return 'font';
  if (ct.includes('image') || /\.(png|jpe?g|gif|webp|svg|avif|ico)(\?|$)/.test(u)) return 'image';
  if (ct.includes('css') || /\.css(\?|$)/.test(u)) return 'css';
  if (ct.includes('javascript') || /\.js(\?|$)/.test(u)) return 'js';
  return 'other';
}

async function scrollPage(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const height = Math.max(
      document.body?.scrollHeight || 0,
      document.documentElement?.scrollHeight || 0,
    );
    const step = Math.max(400, window.innerHeight);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await delay(350);
    }
    window.scrollTo(0, 0);
    await delay(400);
  });
}

async function main() {
  ensureOut();
  const network = [];
  const seen = new Set();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  page.on('response', async (response) => {
    try {
      const url = response.url();
      if (seen.has(url)) return;
      seen.add(url);
      const headers = response.headers();
      const contentType = headers['content-type'] || '';
      network.push({
        url,
        status: response.status(),
        contentType,
        type: classifyResource(url, contentType),
      });
    } catch {
      // ignore response race on close
    }
  });

  try {
    console.log(`Navigating to ${TARGET_URL} ...`);
    await page.goto(TARGET_URL, {
      waitUntil: 'networkidle',
      timeout: 90_000,
    });

    console.log('Scrolling to trigger lazy content...');
    await scrollPage(page);

    const meta = await page.evaluate((vp) => {
      const h = Math.max(
        document.body?.scrollHeight || 0,
        document.documentElement?.scrollHeight || 0,
      );
      return {
        title: document.title,
        url: location.href,
        viewport: vp,
        pageHeight: h,
        capturedAt: new Date().toISOString(),
      };
    }, VIEWPORT);
    writeJson('meta.json', meta);
    console.log(`Page title: ${meta.title}, height: ${meta.pageHeight}px`);

    console.log('Capturing full-page screenshot...');
    await page.screenshot({
      path: path.join(OUT, 'full.png'),
      fullPage: true,
    });

    console.log('Capturing scroll segment screenshots...');
    const height = meta.pageHeight || VIEWPORT.height;
    let i = 0;
    for (let y = 0; y < height; y += 800) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUT, `scroll-${i}.png`),
      });
      i += 1;
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    console.log('Extracting sections...');
    const sections = await page.evaluate(() => {
      const selectors = [
        'section',
        'article',
        'main > div',
        '[class*="section"]',
        '[class*="Section"]',
        '[data-section]',
      ];
      const nodes = [];
      const seenEl = new Set();
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => {
          if (seenEl.has(el)) return;
          seenEl.add(el);
          const rect = el.getBoundingClientRect();
          const absTop = rect.top + window.scrollY;
          nodes.push({
            tag: el.tagName,
            id: el.id || null,
            className: (el.className?.toString?.() || '').slice(0, 200),
            text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120),
            height: Math.round(rect.height),
            top: Math.round(absTop),
          });
        });
      }
      nodes.sort((a, b) => a.top - b.top);
      return nodes.slice(0, 80);
    });
    writeJson('sections.json', sections);

    console.log('Extracting design tokens...');
    const tokens = await page.evaluate(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel) || document.body;
        const s = getComputedStyle(el);
        return {
          selector: sel,
          color: s.color,
          backgroundColor: s.backgroundColor,
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
        };
      };
      return {
        body: pick('body'),
        h1: pick('h1'),
        h2: pick('h2'),
        titleCandidate: pick(
          'h1, h2, [class*="title"], [class*="Title"], [class*="name"], [class*="Name"]',
        ),
      };
    });
    writeJson('tokens.json', tokens);

    const html = await page.content();
    fs.writeFileSync(path.join(OUT, 'dom-snapshot.html'), html, 'utf8');

    const byType = network.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
    writeJson('network.json', { summary: byType, items: network });

    console.log('Done. Artifacts written to out/');
    console.log(`Network resources: ${network.length}`, byType);
  } catch (err) {
    writeJson('error.json', {
      message: err?.message || String(err),
      stack: err?.stack,
      at: new Date().toISOString(),
    });
    console.error('Analyze failed:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
