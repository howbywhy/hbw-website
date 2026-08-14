#!/usr/bin/env node
/**
 * Crawl https://www.hbw.works/ and recover the public dependency graph.
 * Writes HTML, CSS, JS, fonts, images, and a JSON inventory into /reference.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REF = path.join(ROOT, "reference");
const PAGES = path.join(REF, "pages");
const CSS_DIR = path.join(REF, "css");
const JS_DIR = path.join(REF, "scripts-recovered");
const ASSET_DIR = path.join(REF, "downloaded");

const BASE = "https://www.hbw.works";
const ROUTES = [
  "/",
  "/projects",
  "/studio",
  "/collections",
  "/manifesto",
  "/intake/start",
  "/projects/sub-3",
  "/projects/koja",
  "/projects/bar-closed",
  "/projects/our-boy-roy",
  "/projects/chris-sisarich",
  "/projects/bistro-nido",
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

fs.mkdirSync(PAGES, { recursive: true });
fs.mkdirSync(CSS_DIR, { recursive: true });
fs.mkdirSync(JS_DIR, { recursive: true });
fs.mkdirSync(ASSET_DIR, { recursive: true });

const seen = new Map(); // url -> { localPath, status, type, bytes, notes }
const queue = [];
const htmlByRoute = {};

function classify(url, contentType = "") {
  const u = url.split("?")[0].toLowerCase();
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("text/css") || u.endsWith(".css")) return "css";
  if (ct.includes("javascript") || u.endsWith(".js") || u.endsWith(".mjs")) return "js";
  if (ct.includes("font") || /\.(woff2?|ttf|otf|eot)$/.test(u)) return "font";
  if (ct.includes("svg") || u.endsWith(".svg")) return "svg";
  if (ct.includes("gif") || u.endsWith(".gif")) return "gif";
  if (/\.(mp4|webm|mov|m4v)$/.test(u) || ct.includes("video")) return "video";
  if (ct.includes("image") || /\.(png|jpe?g|webp|avif|ico|bmp)$/.test(u)) return "image";
  if (ct.includes("html")) return "html";
  return "other";
}

function safeName(url) {
  try {
    const u = new URL(url);
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith("/")) p += "index";
    p = p.replace(/^\//, "").replace(/[^a-zA-Z0-9._/-]/g, "_");
    if (u.search) p += "_" + Buffer.from(u.search).toString("hex").slice(0, 16);
    return p || "index";
  } catch {
    return "unknown_" + Buffer.from(url).toString("hex").slice(0, 16);
  }
}

function localFor(url, type) {
  const name = safeName(url);
  if (type === "css") return path.join(CSS_DIR, name);
  if (type === "js") return path.join(JS_DIR, name);
  return path.join(ASSET_DIR, name);
}

async function fetchBuf(url, referer = BASE) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "*/*",
      Referer: referer,
    },
    redirect: "follow",
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    ok: res.ok,
    status: res.status,
    url: res.url,
    contentType: res.headers.get("content-type") || "",
    buf,
  };
}

function extractUrlsFromCss(css, baseUrl) {
  const out = [];
  const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let m;
  while ((m = re.exec(css))) {
    let raw = m[2].trim();
    if (!raw || raw.startsWith("data:") || raw.startsWith("#")) continue;
    try {
      out.push(new URL(raw, baseUrl).href);
    } catch {}
  }
  const importRe = /@import\s+(?:url\()?['"]?([^'")\s]+)['"]?\)?/gi;
  while ((m = importRe.exec(css))) {
    try {
      out.push(new URL(m[1].trim(), baseUrl).href);
    } catch {}
  }
  return out;
}

function extractFromHtml(html, pageUrl) {
  const urls = [];
  const attrs = [
    /<(?:link|script|img|source|video|audio|iframe)[^>]+(?:href|src)=["']([^"']+)["']/gi,
    /srcset=["']([^"']+)["']/gi,
    /poster=["']([^"']+)["']/gi,
    /content=["'](https?:\/\/[^"']+)["']/gi,
  ];
  for (const re of attrs) {
    let m;
    while ((m = re.exec(html))) {
      const val = m[1];
      if (re.source.includes("srcset")) {
        for (const part of val.split(",")) {
          const u = part.trim().split(/\s+/)[0];
          if (u && !u.startsWith("data:")) {
            try {
              urls.push(new URL(u, pageUrl).href);
            } catch {}
          }
        }
      } else if (val && !val.startsWith("data:") && !val.startsWith("javascript:")) {
        try {
          urls.push(new URL(val, pageUrl).href);
        } catch {}
      }
    }
  }
  // inline style urls
  const styleRe = /style=["'][^"']*url\(([^)]+)\)[^"']*["']/gi;
  let m;
  while ((m = styleRe.exec(html))) {
    const raw = m[1].replace(/['"]/g, "").trim();
    if (raw && !raw.startsWith("data:")) {
      try {
        urls.push(new URL(raw, pageUrl).href);
      } catch {}
    }
  }
  // background images in style tags
  const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  for (const block of styleBlocks) {
    urls.push(...extractUrlsFromCss(block, pageUrl));
  }
  // Dropbox / video urls in attributes or text
  const dropbox = html.match(/https?:\/\/(?:www\.)?dropbox\.com\/[^\s"'<>]+/gi) || [];
  urls.push(...dropbox);
  const dl = html.match(/https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mov|m4v)(?:\?[^\s"'<>]*)?/gi) || [];
  urls.push(...dl);
  return [...new Set(urls)];
}

function extractInlineScripts(html, routeSlug) {
  const scripts = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  let i = 0;
  while ((m = re.exec(html))) {
    const body = m[1].trim();
    if (!body) continue;
    i += 1;
    const typeMatch = m[0].match(/type=["']([^"']+)["']/i);
    const type = typeMatch ? typeMatch[1] : "text/javascript";
    const fname = `${routeSlug.replace(/\//g, "_") || "home"}-inline-${String(i).padStart(2, "0")}.${type.includes("json") ? "json" : "js"}`;
    fs.writeFileSync(path.join(JS_DIR, "inline", fname), body);
    scripts.push({ file: `reference/scripts-recovered/inline/${fname}`, type, bytes: body.length });
  }
  return scripts;
}

function extractInlineCss(html, routeSlug) {
  const blocks = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  let i = 0;
  while ((m = re.exec(html))) {
    const body = m[1].trim();
    if (!body) continue;
    i += 1;
    const fname = `${routeSlug.replace(/\//g, "_") || "home"}-inline-${String(i).padStart(2, "0")}.css`;
    fs.writeFileSync(path.join(CSS_DIR, "inline", fname), body);
    blocks.push({ file: `reference/css/inline/${fname}`, bytes: body.length });
  }
  return blocks;
}

async function enqueue(url, from, kindHint) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return;
  // skip analytics noise
  if (/google-analytics|googletagmanager|facebook\.net|hotjar|segment\.com/.test(url)) return;
  if (seen.has(url)) return;
  seen.set(url, { status: "QUEUED", from, kindHint });
  queue.push(url);
}

async function downloadAsset(url) {
  const rec = seen.get(url) || {};
  try {
    const res = await fetchBuf(url);
    const type = classify(res.url, res.contentType);
    rec.originalUrl = url;
    rec.finalUrl = res.url;
    rec.httpStatus = res.status;
    rec.contentType = res.contentType;
    rec.type = type;
    rec.bytes = res.buf.length;

    if (!res.ok) {
      rec.status = "UNRESOLVED";
      rec.notes = `HTTP ${res.status}`;
      seen.set(url, rec);
      return;
    }

    // Dropbox preview pages — keep as remote reference if HTML
    if (/dropbox\.com/.test(url) && type === "html") {
      rec.status = "REMOTE REFERENCE";
      rec.notes = "Dropbox HTML/preview; not a direct media file";
      seen.set(url, rec);
      return;
    }

    const dest = localFor(res.url, type);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, res.buf);
    rec.localPath = path.relative(ROOT, dest);
    rec.status = "LOCAL";
    seen.set(url, rec);

    if (type === "css") {
      const css = res.buf.toString("utf8");
      for (const u of extractUrlsFromCss(css, res.url)) {
        await enqueue(u, url, "css-url");
      }
    }
  } catch (err) {
    rec.status = "UNRESOLVED";
    rec.notes = String(err.message || err);
    rec.originalUrl = url;
    seen.set(url, rec);
  }
}

async function crawlPage(route) {
  const url = route === "/" ? BASE + "/" : BASE + route;
  console.log("PAGE", url);
  const res = await fetchBuf(url);
  const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "__");
  const htmlPath = path.join(PAGES, slug + ".html");
  fs.writeFileSync(htmlPath, res.buf);
  htmlByRoute[route] = {
    url,
    finalUrl: res.url,
    httpStatus: res.status,
    bytes: res.buf.length,
    localPath: path.relative(ROOT, htmlPath),
  };
  const html = res.buf.toString("utf8");
  fs.mkdirSync(path.join(JS_DIR, "inline"), { recursive: true });
  fs.mkdirSync(path.join(CSS_DIR, "inline"), { recursive: true });
  htmlByRoute[route].inlineScripts = extractInlineScripts(html, slug);
  htmlByRoute[route].inlineCss = extractInlineCss(html, slug);

  const links =
    [...html.matchAll(/href=["'](\/[^"']+)["']/g)].map((m) => m[1].split(/[?#]/)[0]) || [];
  htmlByRoute[route].internalLinks = [...new Set(links)];

  for (const u of extractFromHtml(html, url)) {
    await enqueue(u, url, "html");
  }
}

async function main() {
  // sitemap extra routes
  try {
    const sm = await fetchBuf(BASE + "/sitemap.xml");
    fs.writeFileSync(path.join(REF, "sitemap.xml"), sm.buf);
    const locs = [...sm.buf.toString("utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      const u = new URL(m[1].trim());
      return u.pathname || "/";
    });
    for (const p of locs) {
      if (!ROUTES.includes(p === "" ? "/" : p)) ROUTES.push(p === "" ? "/" : p);
    }
  } catch (e) {
    console.warn("sitemap fail", e);
  }

  try {
    const rb = await fetchBuf(BASE + "/robots.txt");
    fs.writeFileSync(path.join(REF, "robots.txt"), rb.buf);
  } catch {}

  for (const route of ROUTES) {
    try {
      await crawlPage(route);
    } catch (e) {
      console.error("page fail", route, e);
      htmlByRoute[route] = { error: String(e) };
    }
  }

  // also try common extras
  for (const extra of ["/favicon.ico", "/404", "/intake", "/intake/start"]) {
    try {
      const res = await fetchBuf(BASE + extra);
      if (res.ok && extra !== "/intake/start") {
        const dest = path.join(PAGES, extra.replace(/\//g, "_").replace(/^_/, "") + ".html");
        if (res.contentType.includes("html")) fs.writeFileSync(dest, res.buf);
        else {
          const t = classify(res.url, res.contentType);
          const d = localFor(res.url, t);
          fs.mkdirSync(path.dirname(d), { recursive: true });
          fs.writeFileSync(d, res.buf);
          seen.set(res.url, {
            originalUrl: BASE + extra,
            finalUrl: res.url,
            status: "LOCAL",
            type: t,
            bytes: res.buf.length,
            localPath: path.relative(ROOT, d),
          });
        }
      }
      if (res.ok && extra === "/intake/start") {
        /* already crawled */
      }
    } catch {}
  }

  console.log("Queued assets:", queue.length);
  // download with concurrency
  const conc = 8;
  let i = 0;
  async function worker() {
    while (i < queue.length) {
      const url = queue[i++];
      process.stdout.write(`  asset ${i}/${queue.length}\r`);
      await downloadAsset(url);
    }
  }
  await Promise.all(Array.from({ length: conc }, () => worker()));

  const inventory = {
    crawledAt: new Date().toISOString(),
    source: BASE,
    pages: htmlByRoute,
    assets: [...seen.entries()].map(([url, rec]) => ({ url, ...rec })),
  };
  fs.writeFileSync(path.join(REF, "crawl-inventory.json"), JSON.stringify(inventory, null, 2));

  const counts = {};
  for (const a of inventory.assets) {
    const k = `${a.status || "?"} / ${a.type || "?"}`;
    counts[k] = (counts[k] || 0) + 1;
  }
  console.log("\nDone.", counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
