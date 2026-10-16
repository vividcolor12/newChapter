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
const MAX_DEPTH = 8;
const MAX_NODES = 400;

function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function main() {
  ensureOut();

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  console.log(`Opening headed browser: ${TARGET_URL}`);
  await page.goto(TARGET_URL, {
    waitUntil: 'networkidle',
    timeout: 90_000,
  });

  // Trigger lazy sections before dumping
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const height = Math.max(
      document.body?.scrollHeight || 0,
      document.documentElement?.scrollHeight || 0,
    );
    const step = Math.max(400, window.innerHeight);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await delay(250);
    }
    window.scrollTo(0, 0);
  });

  const { tree, sectionSummary, stats } = await page.evaluate(
    ({ maxDepth, maxNodes }) => {
      let nodeCount = 0;

      function dump(el, depth) {
        if (!el || nodeCount >= maxNodes || depth > maxDepth) return null;
        if (el.nodeType !== 1) return null;

        nodeCount += 1;
        const rect = el.getBoundingClientRect();
        const className = el.className?.toString?.() || '';
        const directText = [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .filter(Boolean)
          .join(' ')
          .slice(0, 80);

        const children = [];
        if (depth < maxDepth && nodeCount < maxNodes) {
          for (const child of el.children) {
            if (nodeCount >= maxNodes) break;
            const dumped = dump(child, depth + 1);
            if (dumped) children.push(dumped);
          }
        }

        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          className: className ? className.slice(0, 160) : undefined,
          role: el.getAttribute('role') || undefined,
          text: directText || undefined,
          box: {
            x: Math.round(rect.x),
            y: Math.round(rect.y + window.scrollY),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
          },
          childCount: el.children.length,
          children: children.length ? children : undefined,
        };
      }

      const root = dump(document.body, 0);

      const sectionCandidates = [
        ...document.querySelectorAll(
          'section, article, main > div, [class*="section"], [class*="Section"], [data-section]',
        ),
      ]
        .slice(0, 40)
        .map((el, i) => {
          const rect = el.getBoundingClientRect();
          return {
            index: i,
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: (el.className?.toString?.() || '').slice(0, 120),
            text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 100),
            height: Math.round(rect.height),
            top: Math.round(rect.top + window.scrollY),
          };
        })
        .sort((a, b) => a.top - b.top);

      return {
        tree: root,
        sectionSummary: sectionCandidates,
        stats: { nodeCount, maxDepth, maxNodes },
      };
    },
    { maxDepth: MAX_DEPTH, maxNodes: MAX_NODES },
  );

  const payload = {
    url: page.url(),
    title: await page.title(),
    viewport: VIEWPORT,
    stats,
    sectionSummary,
    tree,
    capturedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(OUT, 'dom-tree.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );

  console.log('\n=== Section candidates ===');
  for (const s of sectionSummary) {
    console.log(
      `[${s.index}] top=${s.top} h=${s.height} <${s.tag}> ${s.className || ''} | ${s.text || ''}`,
    );
  }
  console.log(`\nDOM tree dumped: out/dom-tree.json (${stats.nodeCount} nodes)`);
  console.log('Browser paused — use Playwright Inspector Resume/close when done.\n');

  await page.pause();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
