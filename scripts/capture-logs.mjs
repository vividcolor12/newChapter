import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(path.resolve(__dirname, '..'), 'out', 'runtime-logs.ndjson');
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
];

async function main() {
  fs.writeFileSync(LOG, '');
  const browser = await chromium.launch({ headless: true });
  for (const viewport of VIEWPORTS) {
    const page = await (await browser.newContext({ viewport })).newPage();
    await page.route('**/ingest/**', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      fs.appendFileSync(LOG, `${JSON.stringify({ viewport: viewport.width, ...body })}\n`);
      await route.fulfill({ status: 204 });
    });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const d = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await d(200); }
    });
    await page.locator('.gallGridWrapper .item').nth(4).scrollIntoViewIfNeeded();
    await page.locator('.gallGridWrapper .item').nth(4).click();
    await page.waitForTimeout(800);
    await page.locator('.func-wrap .swiper-button-next').click();
    await page.waitForTimeout(800);
    await page.locator('.func-wrap .swiper-button-prev').click();
    await page.waitForTimeout(800);
    await page.locator('.func-wrap .swiper-button-prev').click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(path.dirname(LOG), `viewer-${viewport.width}.png`) });
    await page.locator('.gallery-viewer .close').click();
    await page.waitForTimeout(300);
    await page.locator('.gallGridWrapper').screenshot({ path: path.join(path.dirname(LOG), `grid-${viewport.width}.png`) });
    fs.appendFileSync(LOG, `${JSON.stringify({ viewport: viewport.width, message: 'viewer closed', viewerOpen: await page.locator('.gallery-viewer').count() })}\n`);
  }
  await browser.close();
  console.log(fs.readFileSync(LOG, 'utf8'));
}

main().catch((e) => { console.error(e); process.exit(1); });
