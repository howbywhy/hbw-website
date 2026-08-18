/**
 * Drive desktop + mobile walkthroughs and encode recordings.
 * Uses hbw-site-qa Chrome + ffmpeg-static. Does not set hbw.entered so the intro plays.
 */
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { loadConfig } from '/Users/markblackler/Documents/GitHub/HBW-Site-QA/src/core/config.mjs';
import { launchBrowser } from '/Users/markblackler/Documents/GitHub/HBW-Site-QA/src/browser/launch.mjs';
import { sleep } from '/Users/markblackler/Documents/GitHub/HBW-Site-QA/src/browser/session.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'recordings');
const require = createRequire('/Users/markblackler/Documents/GitHub/hbw-website/package.json');

function ffmpegPath() {
  try {
    return require('ffmpeg-static');
  } catch {
    return null;
  }
}

async function startCapture(page, dir) {
  mkdirSync(dir, { recursive: true });
  const client = await page.createCDPSession();
  let n = 0;
  const frames = [];
  client.on('Page.screencastFrame', async ({ data, sessionId }) => {
    const file = join(dir, `f-${String(n).padStart(5, '0')}.jpg`);
    n += 1;
    frames.push(file);
    writeFileSync(file, Buffer.from(data, 'base64'));
    await client.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await client.send('Page.startScreencast', { format: 'jpeg', quality: 72, everyNthFrame: 1 });
  return {
    frames,
    async stop() {
      await client.send('Page.stopScreencast').catch(() => {});
    },
  };
}

function encode(dir, dest, fps = 12) {
  const bin = ffmpegPath();
  if (!bin) return false;
  const r = spawnSync(
    bin,
    ['-y', '-framerate', String(fps), '-i', join(dir, 'f-%05d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-pix_fmt', 'yuv420p', dest],
    { encoding: 'utf8' }
  );
  if (r.status !== 0) {
    console.error(r.stderr);
    return false;
  }
  return true;
}

async function click(page, sel) {
  await page.waitForSelector(sel, { timeout: 8000 });
  await page.click(sel);
}

async function evalClick(page, expr) {
  await page.evaluate((src) => {
    const el = eval(src);
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, buttons: 1 }));
  }, expr);
}

async function nativeClick(page, sel) {
  await page.waitForSelector(sel, { timeout: 8000 });
  await page.$eval(sel, (el) => el.click());
}

async function hoverProject(page, id) {
  await page.evaluate((projectId) => {
    const el = document.querySelector(`[data-hbw-project="${projectId}"]`);
    if (!el) return;
    el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    el.focus();
  }, id);
}

async function wheelGallery(page, times) {
  await page.evaluate((n) => {
    const stage = document.querySelector('.hbw-project-view');
    if (!stage) return;
    const dir = n < 0 ? -1 : 1;
    const count = Math.abs(n);
    for (let i = 0; i < count; i++) {
      stage.dispatchEvent(new WheelEvent('wheel', { deltaY: 280 * dir, bubbles: true, cancelable: true }));
    }
  }, times);
}

async function enterMake(page) {
  await page.waitForSelector('.hbw-arrive__path, .hbw-poster-toolbar', { timeout: 8000 });
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.hbw-arrive__path')].find((n) =>
      (n.textContent || '').includes('Make')
    );
    btn?.click();
  });
  await page.waitForSelector('.hbw-poster-toolbar', { timeout: 8000 });
  await sleep(1200);
}

async function clickZone(page, side) {
  await page.evaluate((which) => {
    const stage = document.querySelector('.hbw-project-view');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const x = which === 'right' ? r.left + r.width * 0.82 : r.left + r.width * 0.18;
    const y = r.top + r.height * 0.5;
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1 };
    stage.dispatchEvent(new PointerEvent('pointerdown', opts));
    stage.dispatchEvent(new PointerEvent('pointerup', { ...opts }));
  }, side);
}

async function scrollArchive(page) {
  await page.evaluate(async () => {
    const layer = document.querySelector('.hbw-projects.is-open');
    if (!layer) return;
    const max = Math.max(0, layer.scrollHeight - layer.clientHeight);
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      layer.scrollTop = (max * i) / steps;
      await new Promise((resolve) => setTimeout(resolve, 140));
    }
  });
}

async function scrollStageVertical(page, to) {
  await page.evaluate(async (target) => {
    const stage = document.querySelector('.hbw-project-view');
    if (!stage) return;
    const dest = target === 'end' ? stage.scrollHeight : target === 'mid' ? Math.min(stage.scrollHeight, 720) : 0;
    const start = stage.scrollTop;
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      stage.scrollTop = start + ((dest - start) * i) / steps;
      await new Promise((resolve) => setTimeout(resolve, 110));
    }
  }, to);
}

async function openVisual(page) {
  await page.waitForSelector('.hbw-home-strip, .hbw-arrive__path', { timeout: 8000 });
  await sleep(400);
  await page.evaluate(() => {
    const browse = [...document.querySelectorAll('.hbw-arrive__path')].find((n) =>
      (n.textContent || '').includes('Browse')
    );
    if (browse) browse.click();
    else document.querySelector('.hbw-nav-projects__hit')?.click();
  });
  await page.waitForFunction(() => document.querySelector('.hbw-home')?.classList.contains('is-browse'), {
    timeout: 12000,
  });
  const needsVisual = await page.evaluate(() => !document.querySelector('.hbw-projects.is-visual'));
  if (needsVisual) {
    await click(page, 'button[aria-label="Visual"]');
    await page.waitForSelector('.hbw-projects.is-visual', { timeout: 8000 });
  }
}

async function desktop(page) {
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hbw-home-strip');
  await sleep(2200);
  await openVisual(page);
  await sleep(3000);
  await scrollArchive(page);
  await sleep(1400);
  await page.evaluate(() => {
    document.querySelector('[data-hbw-project="sub-3"]')?.scrollIntoView({ block: 'start' });
  });
  await sleep(1600);
  await evalClick(page, 'document.querySelector(\'.hbw-browse__cell[data-hbw-project="sub-3"]\')');
  await page.waitForSelector('.hbw-project-view.is-active, .hbw-project-view.is-assembling', { timeout: 8000 });
  await sleep(2200);
  await wheelGallery(page, 5);
  await sleep(1200);
  await wheelGallery(page, 6);
  await sleep(1100);
  await wheelGallery(page, -8);
  await sleep(1400);
  await click(page, '.hbw-nav-projects__hit');
  await page.waitForFunction(() => document.querySelector('.hbw-home')?.classList.contains('is-browse'), {
    timeout: 8000,
  });
  await sleep(1600);
  await click(page, 'button[aria-label="Index"]');
  await page.waitForSelector('.hbw-browse__row[data-hbw-project="koja"]', { timeout: 8000 });
  await sleep(1800);
  await evalClick(page, 'document.querySelector(\'.hbw-browse__row[data-hbw-project="koja"]\')');
  await page.waitForSelector('.hbw-project-view.is-active, .hbw-project-view.is-assembling', { timeout: 8000 });
  await sleep(2000);
  await click(page, '.hbw-home-strip__exit');
  await sleep(1800);
}

async function mobile(page) {
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hbw-home-strip');
  await sleep(2000);
  await openVisual(page);
  await sleep(3000);
  await scrollArchive(page);
  await sleep(1200);
  await page.evaluate(() => {
    document.querySelector('[data-hbw-project="sub-3"]')?.scrollIntoView({ block: 'start' });
  });
  await sleep(1400);
  await evalClick(page, 'document.querySelector(\'.hbw-browse__cell[data-hbw-project="sub-3"]\')');
  await page.waitForSelector('.hbw-project-view.is-active, .hbw-project-view.is-assembling', { timeout: 8000 });
  await sleep(2000);
  await scrollStageVertical(page, 'mid');
  await sleep(1100);
  await scrollStageVertical(page, 'end');
  await sleep(1200);
  await scrollStageVertical(page, 'start');
  await sleep(1200);
  await click(page, '.hbw-nav-projects__hit');
  await page.waitForFunction(() => document.querySelector('.hbw-home')?.classList.contains('is-browse'), {
    timeout: 8000,
  });
  await sleep(1400);
  await click(page, 'button[aria-label="Index"]');
  await page.waitForSelector('.hbw-browse__row[data-hbw-project="koja"]', { timeout: 8000 });
  await sleep(1600);
  await evalClick(page, 'document.querySelector(\'.hbw-browse__row[data-hbw-project="koja"]\')');
  await page.waitForSelector('.hbw-project-view.is-active, .hbw-project-view.is-assembling', { timeout: 8000 });
  await sleep(1800);
  await click(page, '.hbw-home-strip__exit');
  await sleep(1600);
}

const config = await loadConfig('/Users/markblackler/Documents/GitHub/HBW-Site-QA/configs/hbw/site.config.js');
config.session.sessionStorage = {};
const browser = await launchBrowser(config);
mkdirSync(OUT, { recursive: true });

const desk = await browser.newPage();
await desk.setViewport({ width: 1440, height: 900 });
const dCap = await startCapture(desk, join(OUT, 'desktop-frames'));
await desktop(desk);
await sleep(400);
await dCap.stop();
const deskMp4 = join(OUT, 'hbw-desktop.mp4');
const deskOk = encode(join(OUT, 'desktop-frames'), deskMp4);
console.log(deskOk ? `desktop ${deskMp4}` : `desktop frames ${dCap.frames.length} (encode failed)`);
if (deskOk) rmSync(join(OUT, 'desktop-frames'), { recursive: true, force: true });

const mob = await browser.newPage();
await mob.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const mCap = await startCapture(mob, join(OUT, 'mobile-frames'));
await mobile(mob);
await sleep(400);
await mCap.stop();
const mobMp4 = join(OUT, 'hbw-mobile.mp4');
const mobOk = encode(join(OUT, 'mobile-frames'), mobMp4);
console.log(mobOk ? `mobile ${mobMp4}` : `mobile frames ${mCap.frames.length} (encode failed)`);
if (mobOk) rmSync(join(OUT, 'mobile-frames'), { recursive: true, force: true });

await browser.close();
