import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, 'temporary screenshots');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const selector = process.argv[3] || 'body';
const label = process.argv[4] || 'section';

const existing = readdirSync(dir).filter(f => f.match(/^screenshot-\d+/));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const n = nums.length ? Math.max(...nums) + 1 : 1;
const outPath = join(dir, `screenshot-${n}-${label}.png`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
// Trigger all reveals
const ph = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < ph; y += 500) { await page.evaluate(yy => window.scrollTo(0,yy), y); await new Promise(r=>setTimeout(r,60)); }
await page.evaluate(() => { document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(e=>e.classList.add('visible')); document.querySelectorAll('.skill-fill').forEach(e=>{e.style.transform=`scaleX(${e.dataset.width||1})`;}); });
await new Promise(r => setTimeout(r, 400));
// Scroll to element
const el = await page.$(selector);
if (el) { await el.scrollIntoView(); await new Promise(r => setTimeout(r, 300)); }
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(`✅ Saved: temporary screenshots/screenshot-${n}-${label}.png`);
