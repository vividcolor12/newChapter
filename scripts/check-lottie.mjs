import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failed = [];
page.on('requestfailed', (r) => { if (/lottie|bodymovin|v2.json/.test(r.url())) failed.push(r.url() + ' ' + r.failure()?.errorText); });
page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const n = await page.evaluate(() => document.querySelectorAll('.opening_text svg').length);
console.log('svg', n, 'failed', failed);
await browser.close();
