/**
 * Cold-load hydration check. No session origin. Fail on React hydration mismatches.
 */
import { loadConfig } from '/Users/markblackler/Documents/GitHub/HBW-Site-QA/src/core/config.mjs';
import { launchBrowser } from '/Users/markblackler/Documents/GitHub/HBW-Site-QA/src/browser/launch.mjs';
import { sleep } from '/Users/markblackler/Documents/GitHub/HBW-Site-QA/src/browser/session.mjs';

const routes = ['/', '/?layer=projects', '/projects/sub-3', '/projects/koja', '/projects/bar-closed', '/projects/our-boy-roy', '/projects/chris-sisarich', '/projects/bistro-nido', '/studio', '/manifesto'];

const config = await loadConfig('/Users/markblackler/Documents/GitHub/HBW-Site-QA/configs/hbw/site.config.js');
config.session.sessionStorage = {};
const browser = await launchBrowser(config);
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('console', (m) => {
  const text = m.text();
  if (/hydrat/i.test(text) || /did not match/i.test(text)) errors.push(`${page.url()} ${text}`);
});
page.on('pageerror', (e) => {
  const text = String(e.message || e);
  if (/hydrat/i.test(text)) errors.push(`${page.url()} ${text}`);
});

for (const path of routes) {
  await page.goto(`http://127.0.0.1:3000${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hbw-home-strip', { timeout: 20000 });
  await sleep(800);
  const origin = await page.evaluate(() => document.querySelector('.hbw-home')?.getAttribute('data-hbw-origin'));
  console.log(path, 'origin=' + origin, 'intro=' + (await page.evaluate(() => document.documentElement.classList.contains('hbw-intro'))));
}

const broken = await page.evaluate(async () => {
  const urls = [...document.querySelectorAll('img')].flatMap((img) => {
    const set = (img.srcset || '').split(',').map((p) => p.trim().split(' ')[0]).filter(Boolean);
    return [img.currentSrc || img.src, ...set];
  });
  const unique = [...new Set(urls)].filter(Boolean);
  const missing = [];
  for (const url of unique) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) missing.push(url + ' ' + res.status);
    } catch (e) {
      missing.push(url);
    }
  }
  return missing;
});

console.log('broken-media', broken.length ? broken.join('\n') : 'none');
console.log('hydration', errors.length ? errors.join('\n') : 'clean');
await browser.close();
if (errors.length) process.exit(1);
