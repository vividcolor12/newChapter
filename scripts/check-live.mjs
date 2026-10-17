import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:4173/newChapter/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text().slice(0, 300)}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => logs.push(`fail ${r.url()} ${r.failure()?.errorText}`));
const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => e);
await page.waitForTimeout(1500);
const info = await page.evaluate(() => ({
  title: document.title,
  root: document.getElementById('root')?.innerText?.slice(0, 200) || '',
  rootHtml: document.getElementById('root')?.innerHTML?.slice(0, 180) || '',
  opening: !!document.querySelector('.overlay-color-purple'),
  body: document.body.innerText.slice(0, 180),
})).catch((e) => ({ evalError: String(e) }));
console.log(JSON.stringify({ status: res.status?.() || String(res), info, logs: logs.slice(0, 30) }, null, 2));
await page.screenshot({ path: 'out/live-check.png' }).catch(() => {});
await browser.close();
