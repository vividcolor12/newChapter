import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.join(path.resolve(__dirname, '..'), 'src', 'styles', 'origin.css');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'networkidle', timeout: 90_000 });
  const used = await page.evaluate(() => {
    const set = new Set();
    document.querySelectorAll('*').forEach((el) => {
      getComputedStyle(el).fontFamily.split(',').forEach((f) => set.add(f.trim().replace(/^["']|["']$/g, '').toLowerCase()));
    });
    return [...set];
  });
  await browser.close();
  used.push('swiper-icons', 'pretendard', 'pretendard variable', 'inter');

  const rules = fs.readFileSync(CSS, 'utf8').split('\n');
  const before = rules.join('\n').length;
  const kept = rules.filter((r) => {
    if (!r.startsWith('@font-face')) return true;
    const m = r.match(/font-family:\s*([^;]+);/);
    const fam = m ? m[1].trim().replace(/^["']|["']$/g, '').toLowerCase() : '';
    return used.includes(fam);
  });
  const out = kept.join('\n');
  fs.writeFileSync(CSS, out);
  console.log('used families', used.join(' | '));
  console.log('bytes', before, '->', out.length, 'rules', rules.length, '->', kept.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
