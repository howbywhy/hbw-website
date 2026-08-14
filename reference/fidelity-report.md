# Fidelity report

Baseline reconstruction of `https://www.hbw.works/` (crawled 2026-08-14).  
Classification is honest: recovered source, visually checked, approximated, or missing.

## SOURCE VERIFIED

Recovered directly from live HTML/CSS/JS/assets.

- All public routes in the sitemap, plus `/intake/start`
- Webflow shared CSS (`hbw-d99eae.webflow.shared.c5807c079.min.css`)
- Custom inline CSS (float nav, folder tab, gallery, collections, panels)
- Custom inline JS listed in `src/recovered/runtime/scripts.json` / `public/runtime/`
- HBW hand-drawn mark (`#hbw-logo-svg` → `public/identity/hbw-mark.svg`)
- Fonts: Geist, Visual, Neuebit (Webflow CDN `@font-face`)
- Cream `#F2ECDE` / `rgb(242, 236, 222)`, text `#333`, acid yellow rail `rgb(252, 250, 155)`
- Project covers, srcset derivatives, GIFs
- Project films under 90MB (local copies in `/public/projects/...`)
- Selected Works markup and overlay SVGs (Bounce, SUB:3, Closed, KOJA)
- Idea / Shift / System / Outcome copy on SUB:3 and other project pages
- Collections item markup and archive-world script
- Studio / Manifesto panel markup and swipe scripts
- Intake start page markup

## VISUALLY VERIFIED

Checked against the live rendered site (desktop browser, 2026-08-14).

- Home: cream canvas, large HBW mark, centre pill, left yellow Selected Works rail, practice statement
- SUB:3: horizontal spread, acid-yellow Idea panel, photography, pill labelled SUB:3
- Collections: loose rotated cluster over the HBW mark, “Drag to rotate · Tap”
- Studio: persistent mark with entering copy panel (philosophy / how we work)
- Projects index: stacked covers, Share your project CTA, © How by why
- Pill nav destinations: Home, Projects, Studio, Collections, Manifesto

## APPROXIMATE

Could not be reproduced exactly. Not disguised.

| Element | Why |
|---|---|
| Swup page morphing | Webflow/Swup runtime is not loaded. Recovered scripts already fall back to full `location.href` after leave animations (~460ms). Enter/leave still run; mid-transition DOM swap does not. |
| Webflow Interactions (IX) | `webflow.*.js` recovered into `reference/` but omitted from the app. Layout and custom JS cover the visible behaviours; any IX-only micro-motion is missing. |
| Newsletter / Klaviyo submit | Popup markup + custom JS recovered. `klaviyo.cjs` returned HTTP 403. Subscribe may not complete without Klaviyo. |
| Rainbow favicon | Script recovered; canvas-drawn, not a static file. |
| Screensaver | Script recovered; not visually re-timed against live idle. |
| Collections WebGL lighting/feel | Same recovered shader/world script; GPU/browser differences possible. Cursor’s automated browser reported a WebGL fallback on one pass while a later screenshot showed the cluster — treat GPU path as environment-dependent. |

## UNRESOLVED

Missing or not shippable in git.

| Asset | Status | Notes |
|---|---|---|
| `https://www.hbw.works/Geist.woff2` (and `/projects/`, `/intake/` relatives) | 404 | Live custom CSS points at a relative file that is not hosted. **Actual Geist files were recovered from the Webflow CDN** and are used locally. |
| `https://cdn.prod.website-files.com/` (bare origin) | 403 | Preconnect only; not a file. |
| `https://static.klaviyo.com/onsite/js/klaviyo.cjs?company_id=RUYTQB` | 403 | Newsletter backend. |
| `HBWCSHOME-Website.mp4` (140.2MB) | REMOTE REFERENCE | Chris Sisarich; Dropbox URL kept in reconstructed HTML. Downloaded locally under `reference/downloaded/` but gitignored (GitHub 100MB limit). |
| `HBWCSIMAGES-Website.mp4` (332.6MB) | REMOTE REFERENCE | Same. |

No Helvetica / Switzer / IBM Plex Mono substitution was made.

## What was deliberately removed

- Webflow CMS runtime and jQuery (experience preserved via recovered custom JS + HTML)
- Live site is unchanged; this repo does not deploy over Webflow
