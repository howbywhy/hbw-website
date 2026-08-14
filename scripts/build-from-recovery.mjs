#!/usr/bin/env node
/**
 * Organise crawled assets into /public, rewrite recovered HTML/CSS,
 * extract unique runtime CSS/JS, and emit reference manifests.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INV = JSON.parse(fs.readFileSync(path.join(ROOT, "reference/crawl-inventory.json"), "utf8"));
const PUBLIC = path.join(ROOT, "public");
const REC = path.join(ROOT, "src/recovered");
const MAX_GIT_BYTES = 90 * 1024 * 1024;

const PAGE_FILES = {
  "/": "home.html",
  "/projects": "projects.html",
  "/studio": "studio.html",
  "/collections": "collections.html",
  "/manifesto": "manifesto.html",
  "/intake/start": "intake__start.html",
  "/projects/sub-3": "projects__sub-3.html",
  "/projects/koja": "projects__koja.html",
  "/projects/bar-closed": "projects__bar-closed.html",
  "/projects/our-boy-roy": "projects__our-boy-roy.html",
  "/projects/chris-sisarich": "projects__chris-sisarich.html",
  "/projects/bistro-nido": "projects__bistro-nido.html",
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sha12(buf) {
  return crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12);
}

function origNameFromUrl(url, fallbackUrl) {
  for (const candidate of [url, fallbackUrl]) {
    if (!candidate) continue;
    try {
      const u = new URL(candidate);
      const last = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "");
      if (last && last !== "file" && last !== "inline" && last.includes(".")) return last;
    } catch {}
  }
  return "asset";
}

function classifyPublicDir(url, filename) {
  const n = (filename + " " + url).toLowerCase();
  if (/\.(woff2?|ttf|otf|eot)$/.test(filename)) return "fonts";
  if (/hbw-computer-illo|hbw-brand-partner|favicon|webclip|hbw-logo|hbw-mark|signature/.test(n))
    return "identity";
  if (/sub3|sub-3|tccweb-sub3|tccwebr2-sub3|skubar/.test(n)) return "projects/sub3";
  if (/koja/.test(n)) return "projects/koja";
  if (/closed|hbwxclosed/.test(n)) return "projects/closed";
  if (/our-boy|ourboy|obr-|obr_|mortadella/.test(n)) return "projects/our-boy-roy";
  if (/sisarich|hbwcs|chris-sisarich/.test(n)) return "projects/chris-sisarich";
  if (/nido|bistro/.test(n)) return "projects/bistro-nido";
  if (/bounce/.test(n)) return "projects/bounce";
  if (/shampooch|mochi|tyg_|option2|archive|collection/.test(n)) return "collections";
  if (/studio|about/.test(n) && /website-files/.test(url)) return "studio";
  return "global";
}

function uniqueFilename(dir, name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext).replace(/[^a-zA-Z0-9._-]+/g, "-");
  let candidate = base + ext;
  let i = 2;
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base}-${i}${ext}`;
    i += 1;
  }
  return candidate;
}

function rewriteUrls(text, urlMap) {
  let out = text;
  const keys = [...urlMap.keys()].sort((a, b) => b.length - a.length);
  for (const from of keys) {
    const to = urlMap.get(from);
    if (!to || from === to) continue;
    out = out.split(from).join(to);
  }
  return out;
}

function scriptHint(src, file) {
  const head = src.slice(0, 800);
  if (/__HBW_PROJECT_GALLERY_SECTION_B__/.test(head)) return "project-gallery-b";
  if (/__HBW_PROJECT_GALLERY/.test(head) || /hbw-hscroll/.test(src.slice(0, 2000)))
    return "project-gallery";
  if (/data-archive-world-init|archive-gallery/.test(head)) return "collections-world";
  if (/__HBW_ABOUT_SWIPE_BOUND__/.test(head)) return "studio-swipe";
  if (/manifesto|__HBW_MANIFESTO/.test(head) || /about-contents/.test(head) && /manifesto/.test(file))
    return file.includes("manifesto") ? "manifesto-swipe" : "panel-swipe";
  if (/hbw-floatnav|mountFloatNav/.test(head)) return "floatnav";
  if (/FOLDER_TAB|folder-tab/.test(head)) return "folder-tab";
  if (/hbwRainbowFavicon/.test(head)) return "rainbow-favicon";
  if (/HOTKEY_CODE.*KeyS|hbw-ss-active/.test(head)) return "screensaver";
  if (/scroll-progress/.test(head)) return "scroll-progress";
  if (/popup-overlay|klaviyo/.test(head)) return "newsletter-popup";
  if (/hbwDescriptionFade|__hbwDescriptionFade/.test(head)) return "description-fade";
  if (/email-input/.test(head)) return "email-form";
  if (/prefers-reduced-motion[\s\S]*hbw-body-fade/.test(head) || /hbw\.body\.sessionInit/.test(src))
    return "body-fade-init";
  if (/hbw-body-fade-pending/.test(head) && /finish\(/.test(src)) return "body-fade-finish";
  if (/hbwSetVH|--vh/.test(head)) return "vh";
  if (/hbw-route-home/.test(head)) return "route-class";
  if (/contextmenu/.test(head)) return "protect-media";
  if (/getElementsByTagName\('video'\)/.test(head)) return "video-playsinline";
  if (/w-mod-js/.test(head)) return "webflow-touch-detect";
  if (/intake/.test(file) && src.length > 2000) return "intake";
  if (/projects-inline-17/.test(file) || /hbw-projects/.test(head)) return "projects-index";
  return "script-" + sha12(src).slice(0, 8);
}

// --- 1. Map crawled assets into public/ ---
const urlMap = new Map();
const manifestRows = [];
ensureDir(PUBLIC);

for (const a of INV.assets) {
  const url = a.url || a.originalUrl;
  if (!url) continue;
  const filename = origNameFromUrl(url, a.finalUrl);
  const type = a.type || "other";
  // Recovered Webflow/jQuery runtimes stay in /reference, not the app.
  if (type === "js" && /webflow|jquery|klaviyo/i.test(filename + url)) {
    manifestRows.push({
      filename,
      originalUrl: url,
      localPath: a.localPath || "",
      type,
      dimensions: "",
      project: "reference",
      usage: "Webflow/jQuery runtime — not loaded by the reconstructed app",
      status: "LOCAL",
      notes: "kept in reference/ only",
    });
    continue;
  }

  if (a.status !== "LOCAL" || !a.localPath) {
    urlMap.set(url, url);
    if (a.finalUrl && a.finalUrl !== url) urlMap.set(a.finalUrl, a.finalUrl);
    manifestRows.push({
      filename,
      originalUrl: url,
      localPath: "",
      type,
      dimensions: "",
      project: classifyPublicDir(url, filename),
      usage: "referenced in recovered HTML/CSS",
      status: a.status === "REMOTE REFERENCE" ? "REMOTE REFERENCE" : "UNRESOLVED",
      notes: a.notes || `HTTP ${a.httpStatus || "?"}`,
    });
    continue;
  }

  const src = path.join(ROOT, a.localPath);
  if (!fs.existsSync(src)) {
    manifestRows.push({
      filename,
      originalUrl: url,
      localPath: "",
      type,
      dimensions: "",
      project: classifyPublicDir(url, filename),
      usage: "crawled but missing on disk",
      status: "UNRESOLVED",
      notes: "file missing after crawl",
    });
    continue;
  }

  const bytes = a.bytes || fs.statSync(src).size;
  const overLimit = bytes > MAX_GIT_BYTES;
  const dirRel = classifyPublicDir(url, filename);
  const destDir = path.join(PUBLIC, dirRel);
  ensureDir(destDir);

  if (overLimit) {
    urlMap.set(url, url);
    if (a.finalUrl && a.finalUrl !== url) urlMap.set(a.finalUrl, url);
    manifestRows.push({
      filename,
      originalUrl: url,
      localPath: a.localPath,
      type,
      dimensions: "",
      project: dirRel,
      usage: "too large for GitHub; keep Dropbox URL in the app",
      status: "REMOTE REFERENCE",
      notes: `${(bytes / 1e6).toFixed(1)}MB > 90MB git limit`,
    });
    continue;
  }

  const destName = uniqueFilename(destDir, filename);
  const dest = path.join(destDir, destName);
  fs.copyFileSync(src, dest);
  const pub = "/" + path.relative(PUBLIC, dest).replace(/\\/g, "/");
  urlMap.set(url, pub);
  if (a.finalUrl && a.finalUrl !== url) urlMap.set(a.finalUrl, pub);
  // also map without query
  try {
    const naked = (a.finalUrl || url).split("?")[0];
    if (!urlMap.has(naked)) urlMap.set(naked, pub);
  } catch {}

  manifestRows.push({
    filename: destName,
    originalUrl: url,
    localPath: "public" + pub,
    type,
    dimensions: "",
    project: dirRel,
    usage: "served by reconstructed app",
    status: "LOCAL",
    notes: `${(bytes / 1024).toFixed(0)} KB`,
  });
}

// Font convenience copies for relative @font-face url("Geist.woff2")
const geist = manifestRows.find((r) => /Geist-Regular\.woff2/i.test(r.filename) && r.status === "LOCAL");
if (geist) {
  fs.copyFileSync(path.join(ROOT, geist.localPath), path.join(PUBLIC, "Geist.woff2"));
  fs.copyFileSync(path.join(ROOT, geist.localPath), path.join(PUBLIC, "fonts/Geist.woff2"));
  urlMap.set("Geist.woff2", "/fonts/Geist.woff2");
  urlMap.set("/Geist.woff2", "/fonts/Geist.woff2");
  urlMap.set("/projects/Geist.woff2", "/fonts/Geist.woff2");
  urlMap.set("/intake/Geist.woff2", "/fonts/Geist.woff2");
}

// --- 2. Unique CSS ---
const cssDir = path.join(ROOT, "reference/css/inline");
const cssUnique = new Map();
for (const f of fs.readdirSync(cssDir).filter((x) => x.endsWith(".css")).sort()) {
  const buf = fs.readFileSync(path.join(cssDir, f));
  const h = sha12(buf);
  if (!cssUnique.has(h)) cssUnique.set(h, { file: f, text: buf.toString("utf8") });
}

const webflowCssPath = path.join(
  ROOT,
  "reference/css/66587cf3c4f4a7905421e299/css/hbw-d99eae.webflow.shared.c5807c079.min.css"
);
let webflowCss = fs.readFileSync(webflowCssPath, "utf8");
webflowCss = rewriteUrls(webflowCss, urlMap);

const customCss = [...cssUnique.values()]
  .map((c) => `/* from ${c.file} */\n${rewriteUrls(c.text, urlMap)}`)
  .join("\n\n");

ensureDir(path.join(ROOT, "src/styles"));
fs.writeFileSync(path.join(ROOT, "src/styles/webflow.css"), webflowCss);
fs.writeFileSync(path.join(ROOT, "src/styles/hbw-custom.css"), customCss);

// --- 3. Unique JS ---
const jsDir = path.join(ROOT, "reference/scripts-recovered/inline");
const jsUnique = new Map();
for (const f of fs.readdirSync(jsDir).filter((x) => x.endsWith(".js")).sort()) {
  const buf = fs.readFileSync(path.join(jsDir, f));
  const h = sha12(buf);
  if (!jsUnique.has(h)) jsUnique.set(h, { file: f, text: buf.toString("utf8"), bytes: buf.length });
}

const ORDER = [
  "webflow-touch-detect",
  "route-class",
  "vh",
  "body-fade-init",
  "protect-media",
  "video-playsinline",
  "body-fade-finish",
  "description-fade",
  "folder-tab",
  "newsletter-popup",
  "scroll-progress",
  "rainbow-favicon",
  "screensaver",
  "floatnav",
  "email-form",
  "project-gallery-b",
  "project-gallery",
  "projects-index",
  "studio-swipe",
  "manifesto-swipe",
  "panel-swipe",
  "collections-world",
  "intake",
];

const runtimeDir = path.join(PUBLIC, "runtime");
ensureDir(runtimeDir);
const scriptManifest = [];
for (const rec of [...jsUnique.values()]) {
  const hint = scriptHint(rec.text, rec.file);
  rec.hint = hint;
}
const sorted = [...jsUnique.values()].sort((a, b) => {
  const ia = ORDER.indexOf(a.hint);
  const ib = ORDER.indexOf(b.hint);
  const oa = ia === -1 ? 999 : ia;
  const ob = ib === -1 ? 999 : ib;
  if (oa !== ob) return oa - ob;
  return a.file.localeCompare(b.file);
});

let n = 0;
for (const rec of sorted) {
  n += 1;
  const name = `${String(n).padStart(2, "0")}-${rec.hint}.js`;
  const rewritten = rewriteUrls(rec.text, urlMap);
  fs.writeFileSync(path.join(runtimeDir, name), rewritten);
  scriptManifest.push({
    file: `/runtime/${name}`,
    hint: rec.hint,
    source: rec.file,
    bytes: rec.bytes,
  });
}
ensureDir(path.join(REC, "runtime"));
fs.writeFileSync(path.join(REC, "runtime/scripts.json"), JSON.stringify(scriptManifest, null, 2));

// --- 4. Rewritten page HTML (body inner) ---
ensureDir(path.join(REC, "html"));
const cheerioNotUsed = true;
function extractBodyInner(html) {
  const m = html.match(/<body([^>]*)>([\s\S]*)<\/body>/i);
  if (!m) return { attrs: "", inner: html };
  return { attrs: m[1], inner: m[2] };
}
function stripRuntimeScripts(inner) {
  // Keep JSON-LD; drop executable inline scripts (loaded via /runtime)
  return inner
    .replace(/<script(?![^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script[^>]+src=["'][^"']+["'][^>]*><\/script>/gi, "");
}

const pagesOut = {};
for (const [route, file] of Object.entries(PAGE_FILES)) {
  const raw = fs.readFileSync(path.join(ROOT, "reference/pages", file), "utf8");
  const { attrs, inner } = extractBodyInner(raw);
  let body = rewriteUrls(inner, urlMap);
  body = stripRuntimeScripts(body);
  const titleM = raw.match(/<title>([^<]*)<\/title>/i);
  const htmlClassM = raw.match(/<html[^>]*class=["']([^"']*)["']/i);
  const dest = path.join(REC, "html", file);
  fs.writeFileSync(dest, body);
  pagesOut[route] = {
    file: `src/recovered/html/${file}`,
    title: titleM ? titleM[1] : "HBW",
    bodyAttrs: attrs.trim(),
    htmlClass: htmlClassM ? htmlClassM[1] : "",
  };
}
fs.writeFileSync(path.join(REC, "pages.json"), JSON.stringify(pagesOut, null, 2));

// Extract HBW mark SVG from home HTML if present
const home = fs.readFileSync(path.join(REC, "html", "home.html"), "utf8");
const svgM = home.match(/<svg id="hbw-logo-svg"[\s\S]*?<\/svg>/);
if (svgM) {
  ensureDir(path.join(PUBLIC, "identity"));
  fs.writeFileSync(path.join(PUBLIC, "identity/hbw-mark.svg"), svgM[0]);
}

// --- 5. Manifest markdown ---
function mdEscape(s) {
  return String(s || "").replace(/\|/g, "\\|");
}
const md = [
  "# Asset manifest",
  "",
  "Recovered from the public site `https://www.hbw.works/` on " + INV.crawledAt + ".",
  "",
  "Status: **LOCAL** (in `/public` or `/reference`), **REMOTE REFERENCE** (URL kept), **UNRESOLVED** (could not retrieve).",
  "",
  "| filename | original URL | local path | type | dimensions | project | usage | status | notes |",
  "|---|---|---|---|---|---|---|---|---|",
];
for (const r of manifestRows) {
  md.push(
    `| ${mdEscape(r.filename)} | ${mdEscape(r.originalUrl)} | ${mdEscape(r.localPath)} | ${mdEscape(r.type)} | ${mdEscape(r.dimensions)} | ${mdEscape(r.project)} | ${mdEscape(r.usage)} | ${mdEscape(r.status)} | ${mdEscape(r.notes)} |`
  );
}
fs.writeFileSync(path.join(ROOT, "reference/asset-manifest.md"), md.join("\n") + "\n");
fs.writeFileSync(
  path.join(ROOT, "reference/url-map.json"),
  JSON.stringify(Object.fromEntries(urlMap), null, 2)
);

const counts = {};
for (const r of manifestRows) counts[r.status] = (counts[r.status] || 0) + 1;
console.log("public assets organised");
console.log("manifest rows", manifestRows.length, counts);
console.log("unique css", cssUnique.size, "unique js", jsUnique.size);
console.log("pages", Object.keys(pagesOut));
console.log("scripts", scriptManifest.map((s) => s.file).join("\n"));
