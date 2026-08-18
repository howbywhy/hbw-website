import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "mobile-continue");
const BASE = "http://127.0.0.1:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ffmpegPath() {
  try {
    return require("ffmpeg-static");
  } catch {
    return null;
  }
}

function encode(dir, dest, fps) {
  const bin = ffmpegPath();
  if (!bin) return false;
  const r = spawnSync(
    bin,
    [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      join(dir, "f-%05d.jpg"),
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-pix_fmt",
      "yuv420p",
      dest,
    ],
    { encoding: "utf8" }
  );
  if (r.status !== 0) {
    console.error(r.stderr);
    return false;
  }
  return true;
}

async function startCapture(page, dir) {
  mkdirSync(dir, { recursive: true });
  const client = await page.createCDPSession();
  let n = 0;
  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    const file = join(dir, `f-${String(n).padStart(5, "0")}.jpg`);
    n += 1;
    writeFileSync(file, Buffer.from(data, "base64"));
    await client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await client.send("Page.startScreencast", { format: "jpeg", quality: 78, everyNthFrame: 1 });
  return {
    async stop() {
      await client.send("Page.stopScreencast").catch(() => {});
    },
  };
}

const SNAP = `(() => {
  const root = document.querySelector(".hbw-project-view.is-active");
  const track = document.querySelector(".hbw-project-view.is-active .hbw-project-view__track");
  const outro = document.querySelector(".hbw-project-view.is-active .hbw-outro");
  const preview = document.querySelector(".hbw-project-view.is-active .hbw-outro__preview");
  const media = preview?.querySelector("img");
  const mvs = [...document.querySelectorAll(".hbw-project-view.is-active .hbw-mv")];
  const suffix = document.querySelector(".hbw-mark-context")?.textContent?.trim() || "";
  const identity = document.querySelector(".hbw-home-strip__mark")?.innerText.replace(/\\s+/g, " ").trim() || "";
  const box = (n) => {
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  return {
    phase: root?.className || "",
    slug: document.querySelector(".hbw-home")?.getAttribute("data-hbw-project") || "",
    identity,
    suffix,
    scrollTop: root?.scrollTop ?? null,
    trackTransform: track ? getComputedStyle(track).transform : null,
    trackInline: track?.style.transform || "",
    outro: outro
      ? {
          ...box(outro),
          name: outro.querySelector(".hbw-outro__name")?.textContent?.trim() || "",
          idea: outro.querySelector(".hbw-outro__idea")?.textContent?.trim() || "",
          ideaDisplay: outro.querySelector(".hbw-outro__idea") ? getComputedStyle(outro.querySelector(".hbw-outro__idea")).display : null,
          next: outro.getAttribute("data-hbw-next"),
          src: media?.currentSrc || media?.src || "",
          preview: box(preview),
          media: box(media),
          gapFromLast: mvs.length
            ? +(outro.getBoundingClientRect().y - mvs[mvs.length - 1].getBoundingClientRect().bottom).toFixed(1)
            : null,
          gapFromLastImage: (() => {
            const last = mvs[mvs.length - 1]?.querySelector("img, video");
            const name = outro.querySelector(".hbw-outro__name");
            if (!last || !name) return null;
            return +(name.getBoundingClientRect().y - last.getBoundingClientRect().bottom).toFixed(1);
          })(),
        }
      : null,
    items: mvs.map((el) => {
      const img = el.querySelector("img, video");
      const cs = getComputedStyle(el);
      const ics = img ? getComputedStyle(img) : null;
      return {
        id: el.dataset.hbwMv,
        current: el.classList.contains("is-current"),
        offsetTop: el.offsetTop,
        h: Math.round(el.getBoundingClientRect().height),
        transform: cs.transform,
        inlineTransform: el.style.transform || "",
        aspect: cs.aspectRatio,
        imgAspect: ics?.aspectRatio || null,
        imgTransform: ics?.transform || null,
        complete: img && "complete" in img ? img.complete : null,
        natural: img && "naturalHeight" in img ? img.naturalHeight : null,
      };
    }),
  };
})()`;

async function launch(w, h, mobile) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${w},${h}`, "--hide-scrollbars"],
    defaultViewport: {
      width: w,
      height: h,
      deviceScaleFactor: mobile ? 2 : 1,
      isMobile: mobile,
      hasTouch: mobile,
    },
  });
}

async function gotoEntered(page, path = "/") {
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.setItem("hbw.entered.v2", "1");
    } catch {}
  });
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.addStyleTag({
    content: "nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }",
  });
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 12000 });
  await page.waitForSelector(".hbw-mark-by", { timeout: 12000 });
  await sleep(240);
}

async function openFromBrowse(page, id) {
  await page.click(".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 8000 });
  await sleep(400);
  await page.waitForSelector(`[data-hbw-project="${id}"]`, { timeout: 8000 });
  await page.click(`[data-hbw-project="${id}"]`);
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(700);
}

async function waitActive(page, slug) {
  await page.waitForFunction(
    (id) =>
      document.querySelector(".hbw-home")?.getAttribute("data-hbw-project") === id &&
      document.querySelector(".hbw-project-view.is-active"),
    { timeout: 20000 },
    slug
  );
  await sleep(520);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {};

  const browser = await launch(390, 844, true);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoEntered(page, "/");
  await openFromBrowse(page, "sub-3");

  const before = await page.evaluate(SNAP);
  report.open = {
    slug: before.slug,
    identity: before.identity,
    trackTransform: before.trackTransform,
    transforms: before.items.filter((x) => x.transform && x.transform !== "none").map((x) => x.id),
    incomplete: before.items.filter((x) => x.complete === false).map((x) => x.id),
    first: before.items[0],
  };

  const framesDir = join(OUT, "frames-sub3");
  const rec = await startCapture(page, framesDir);

  const drift = [];
  for (let step = 0; step < 18; step++) {
    await page.$eval(".hbw-project-view.is-active", (el) => el.scrollBy({ top: 90, behavior: "auto" }));
    await sleep(90);
    const now = await page.evaluate(SNAP);
    const moved = now.items
      .map((it) => {
        const first = before.items.find((x) => x.id === it.id);
        return first
          ? {
              id: it.id,
              dOffset: it.offsetTop - first.offsetTop,
              dH: it.h - first.h,
              transform: it.transform,
              complete: it.complete,
            }
          : null;
      })
      .filter((x) => x && (x.dOffset !== 0 || x.dH !== 0 || (x.transform && x.transform !== "none")));
    if (moved.length) drift.push({ step, scrollTop: now.scrollTop, moved });
    if (step === 6) {
      await page.screenshot({ path: join(OUT, "390-mid-project.png") });
      report.mid = await page.evaluate(SNAP);
    }
  }

  await page.screenshot({ path: join(OUT, "390-scrolled.png") });

  await page.$eval(".hbw-project-view.is-active", (el) => {
    const items = el.querySelectorAll(".hbw-mv");
    const last = items[items.length - 1];
    if (last) el.scrollTop = last.offsetTop - 24;
  });
  await sleep(250);
  await page.screenshot({ path: join(OUT, "390-final-movement.png") });
  report.final = await page.evaluate(SNAP);

  await page.$eval(".hbw-project-view.is-active", (el) => {
    const outro = el.querySelector(".hbw-outro");
    if (outro) el.scrollTop = Math.max(0, outro.offsetTop - 520);
  });
  await sleep(250);
  await page.screenshot({ path: join(OUT, "390-next-entering.png") });
  report.entering = await page.evaluate(SNAP);

  await page.$eval(".hbw-project-view.is-active", (el) => {
    const outro = el.querySelector(".hbw-outro");
    if (outro) el.scrollTop = outro.offsetTop - 8;
  });
  await sleep(400);
  await page.screenshot({ path: join(OUT, "390-next-visible.png") });
  report.visible = await page.evaluate(SNAP);

  await sleep(900);
  report.paused = await page.evaluate(SNAP);

  const tap = await page.evaluate(() => {
    const el = document.querySelector(".hbw-project-view.is-active .hbw-outro__preview");
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(120, r.height / 2) };
  });
  await page.touchscreen.tap(tap.x, tap.y);
    await sleep(80);
    await page.screenshot({ path: join(OUT, "390-ownership-mid.png") });
  report.midOwnership = await page.evaluate(SNAP);
  await waitActive(page, "koja");
  await page.screenshot({ path: join(OUT, "390-koja-settled.png") });
  report.koja = await page.evaluate(SNAP);

  await page.$eval(".hbw-project-view.is-active", (el) => el.scrollBy({ top: 420, behavior: "auto" }));
  await sleep(250);
  await page.screenshot({ path: join(OUT, "390-koja-scrolled.png") });
  report.kojaScrolled = await page.evaluate(SNAP);

  await rec.stop();
  encode(framesDir, join(OUT, "390-sub3-to-koja.mp4"), 12);

  await browser.close();

  async function nextHandoff(fromPath, fromSlug, toSlug, stillPrefix) {
    const b = await launch(390, 844, true);
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await gotoEntered(p, fromPath);
    await p.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
    await sleep(700);
    await p.$eval(".hbw-project-view.is-active", (el) => {
      const outro = el.querySelector(".hbw-outro");
      if (outro) el.scrollTop = outro.offsetTop - 8;
    });
    await sleep(350);
    await p.screenshot({ path: join(OUT, `${stillPrefix}-next.png`) });
    const beforeTap = await p.evaluate(SNAP);
    const hit = await p.evaluate(() => {
      const el = document.querySelector(".hbw-project-view.is-active .hbw-outro__preview");
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + Math.min(120, r.height / 2) };
    });
    const frames = join(OUT, `frames-${stillPrefix}`);
    const cap = await startCapture(p, frames);
    await p.touchscreen.tap(hit.x, hit.y);
    await sleep(180);
    await p.screenshot({ path: join(OUT, `${stillPrefix}-mid.png`) });
    await waitActive(p, toSlug);
    await p.screenshot({ path: join(OUT, `${stillPrefix}-settled.png`) });
    const after = await p.evaluate(SNAP);
    await cap.stop();
    encode(frames, join(OUT, `${stillPrefix}.mp4`), 12);
    await b.close();
    return {
      from: fromSlug,
      beforeIdentity: beforeTap.identity,
      beforeSlug: beforeTap.slug,
      nextName: beforeTap.outro?.name,
      nextSrc: beforeTap.outro?.src,
      afterIdentity: after.identity,
      afterSlug: after.slug,
      afterScroll: after.scrollTop,
      firstId: after.items[0]?.id,
    };
  }

  report.kojaClosed = await nextHandoff("/projects/koja", "koja", "bar-closed", "390-koja-closed");
  report.chrisRoy = await nextHandoff("/projects/chris-sisarich", "chris-sisarich", "our-boy-roy", "390-chris-roy");

  const deskBrowser = await launch(1440, 900, false);
  const desk = await deskBrowser.newPage();
  await desk.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await gotoEntered(desk, "/");
  await desk.screenshot({ path: join(OUT, "desktop-1440-make.png") });
  report.desktop = await desk.evaluate(() => {
    const how = document.querySelector(".hbw-mark-how .hbw-mark-word--rest")?.getBoundingClientRect();
    const by = document.querySelector(".hbw-mark-by .hbw-mark-word--rest")?.getBoundingClientRect();
    const why = document.querySelector(".hbw-mark-why .hbw-mark-word--rest")?.getBoundingClientRect();
    const tb = document.querySelector(".hbw-poster-toolbar")?.getBoundingClientRect();
    return {
      howX: how ? +how.x.toFixed(1) : null,
      byCx: by ? +(by.x + by.width / 2).toFixed(1) : null,
      whyRight: why ? +why.right.toFixed(1) : null,
      toolbar: tb
        ? { x: +tb.x.toFixed(1), y: +tb.y.toFixed(1), w: +tb.width.toFixed(1), h: +tb.height.toFixed(1) }
        : null,
    };
  });
  await desk.click(".hbw-mark-by");
  await desk.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 8000 });
  await sleep(400);
  await desk.click('[data-hbw-project="sub-3"]');
  await desk.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(800);
  await desk.screenshot({ path: join(OUT, "desktop-1440-sub3.png") });
  report.desktopView = await desk.evaluate(() => {
    const mv = document.querySelector(".hbw-project-view.is-active .hbw-mv");
    const track = document.querySelector(".hbw-project-view.is-active .hbw-project-view__track");
    const r = mv?.getBoundingClientRect();
    return {
      trackDisplay: track ? getComputedStyle(track).display : null,
      mvW: r ? +r.width.toFixed(1) : null,
      mvH: r ? +r.height.toFixed(1) : null,
      transform: track ? getComputedStyle(track).transform : null,
    };
  });
  await deskBrowser.close();

  const afterScroll = report.mid?.items || [];
  report.stability = {
    driftEvents: drift.length,
    driftSample: drift.slice(0, 8),
    midTransforms: afterScroll.filter((x) => x.transform && x.transform !== "none").map((x) => x.id),
    pausedNavigated: report.paused?.slug,
    pausedIdentity: report.paused?.identity,
  };

  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  try {
    copyFileSync(join(OUT, "390-mid-project.png"), join(OUT, "still-mid-project.png"));
  } catch {}
  console.log(
    JSON.stringify(
      {
        open: report.open,
        stability: report.stability,
        finalName: report.final?.items?.at?.(-1)?.id,
        entering: {
          identity: report.entering?.identity,
          nextY: report.entering?.outro?.y,
          gap: report.entering?.outro?.gapFromLast,
        },
        visible: {
          identity: report.visible?.identity,
          name: report.visible?.outro?.name,
          src: report.visible?.outro?.src,
          preview: report.visible?.outro?.preview,
          gap: report.visible?.outro?.gapFromLast,
          gapFromLastImage: report.visible?.outro?.gapFromLastImage,
        },
        paused: { slug: report.paused?.slug, identity: report.paused?.identity },
        midOwnership: { slug: report.midOwnership?.slug, identity: report.midOwnership?.identity, phase: report.midOwnership?.phase },
        koja: { slug: report.koja?.slug, identity: report.koja?.identity, scroll: report.koja?.scrollTop, first: report.koja?.items?.[0]?.id },
        kojaClosed: report.kojaClosed,
        chrisRoy: report.chrisRoy,
        desktop: report.desktop,
        desktopView: report.desktopView,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
