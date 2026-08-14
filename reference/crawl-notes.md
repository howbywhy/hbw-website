# Crawl notes

Source: `https://www.hbw.works/`  
Crawled: 2026-08-14  
Method: sitemap + recursive HTML/CSS/script URL extraction.

## Routes discovered

From `https://www.hbw.works/sitemap.xml`:

| Route | Title |
|---|---|
| `/` | HBW — Clarity for brands at a turning point |
| `/projects` | Projects — HBW |
| `/studio` | Studio — HBW |
| `/collections` | Collections — HBW |
| `/manifesto` | Manifesto — HBW |
| `/projects/sub-3` | SUB:3 — HBW |
| `/projects/koja` | KOJA — HBW |
| `/projects/bar-closed` | Bar Closed — HBW |
| `/projects/our-boy-roy` | Our Boy Roy — HBW |
| `/projects/chris-sisarich` | Chris Sisarich — HBW |
| `/projects/bistro-nido` | Bistro Nido — HBW |

Also fetched (not in sitemap, linked from Projects):

| Route | Title |
|---|---|
| `/intake/start` | Hello. Hiya. Welcome |

`robots.txt` disallows `/log-in/` and `/sign-up/` (Webflow auth; not reconstructed).

## Public stack observed

- Webflow-hosted HTML/CSS (`cdn.prod.website-files.com`, site id `66587cf3c4f4a7905421e299`)
- Webflow runtime JS chunks + jQuery 3.5.1 (recovered into `reference/`, **not loaded** by the local app)
- Large custom inline JS/CSS for: float nav, folder-tab Selected Works, project horizontal gallery, collections WebGL world, studio/manifesto panel swipe, screensaver, rainbow favicon, newsletter popup
- Swup-style page events (`page:swup-complete`, `swup:page:view`). Recovered scripts fall back to `window.location.href` when Swup is absent.
- Klaviyo onsite (`company_id=RUYTQB`) — HTTP 403 from the crawler
- Dropbox `raw=1` video files for project films

## Fonts (source verified)

| Family | Files | Usage |
|---|---|---|
| Geist | `Geist-Regular.woff2` / `.otf` | Interface / body (`--hbw-font`) |
| Visual | `Visual-Regular.woff2` / `.otf` | Display (Webflow `@font-face`) |
| Neuebit | `NeueBit-Regular.woff2` / `.woff` | Display/UI (Webflow `@font-face`) |

Relative `url("Geist.woff2")` in custom CSS 404s on the live host; the actual files are on the Webflow CDN and are used locally.

## Colour (computed on live home)

- Cream canvas: `rgb(242, 236, 222)`
- Text: `#333` / `rgb(51, 51, 51)`
- Acid yellow (Selected Works rail): `rgb(252, 250, 155)`
- Black / white via CSS variables `--black`, `--white`

## Files written by the crawler

- `reference/pages/*.html` — raw live HTML
- `reference/css/` — Webflow shared CSS + per-page inline CSS
- `reference/scripts-recovered/` — inline + remote JS
- `reference/crawl-inventory.json` — full URL graph
- `reference/sitemap.xml`, `reference/robots.txt`
- `reference/downloaded/` — binary originals (gitignored; copies live in `/public`)

## Internal links not in sitemap

Home Selected Works includes an external Bounce Padel Club link (`https://www.bouncepadel.com.au/`, coming soon). No additional HBW project CMS routes were found beyond the six `/projects/...` URLs.
