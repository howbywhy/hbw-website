# Brief for Cursor — health check and independent audit

Paste this whole file as your first message. Work in
`/Users/markblackler/Documents/GitHub/hbw-website`.

---

You are auditing the How by Why studio site: Next.js 16 (App Router,
Turbopack), React 19, TypeScript, Sanity CMS, deployed on Vercel at
www.hbw.works. Nine pages — `/`, `/practice` (About), and seven projects at
`/projects/<slug>`. Nothing else is a page.

I want two things: **run every check this repo has and report honestly**, then
**audit it yourself and tell me what you would do differently.**

## Part one — run everything

```bash
npm install
npx tsc --noEmit                 # typecheck
npm test                         # 187 unit tests
npm run build                    # must compile clean
npx next start -p 4409 &         # the browser checks need a running build
npm run qa                       # 94 browser checks — opens a Chrome window, this is deliberate
```

CMS checks (these hit Sanity over the network and need no token):

```bash
npm run test:sck-cms
npm run test:closed-cms
npm run test:koja-cms
npm run test:chris-cms
npm run test:sub3-cms
npm run test:obr-cms
npm run test:studio-cms
```

Everything should pass. `npm run qa` has three verdicts — pass, fail, and
**unmeasured** — and the runner exits non-zero on unmeasured as well as fail.
That is on purpose: a check that measured nothing is not a check that passed.
If you see `----` rows, treat them as failures and say which.

Read `qa/README.md` and `qa/lib.mjs` before judging the harness. Two checks
matter most:

- `smooth` scrolls every page in a **real** Chrome window and counts dropped
  frames. It cannot run headless and the comment explains why.
- `brisk` measures how **long** moves take — landing, opening About, opening a
  project — and times the nav separately, because the work is deliberately
  held until the chrome arrives.

## Part two — the unresolved problem

**The owner reports the site feels laggy in Chrome on an M-series Mac. No
instrument I have reproduces it.** Specifically: opening About over an open
project, and scrolling the work line on the front page.

Measured on that machine, against production, in a real Chrome window with a
real GPU:

- 0–1 dropped frames per ~450 while scrolling, median frame 8.3ms on a 120Hz
  screen
- INP 40–64ms on the About interaction (Chrome calls ≤200ms good)
- No long tasks; one 50ms long-animation-frame, 31ms of it rendering
- 1.2s from press to fully settled for About, 1.6s for a project
- At rest: 60–90ms of work per 4 seconds, no animations, no video decoding

So either the perception is of something these metrics do not capture, or my
instruments are wrong. **Assume the owner is right and I am missing it.**

### Dead ends — do not repeat these

1. **Headless Chrome lies about performance.** It rasterises in software and
   reported a clean 17ms frame on a page dropping one frame in five. Every
   performance measurement must use `headless: false`.
2. **Counting `requestAnimationFrame` callbacks lies too.** rAF runs on the
   main thread and ticks at full rate while the compositor drops frames. I
   built a check on this before realising.
3. **`content-visibility: hidden` on the covered gallery or work line makes it
   worse** — measured, 40ms → 72ms.
4. Three times I reported a fault that was my own probe: counting `<img>` on a
   page that is mostly `<video>`; treating a deliberately source-less image as
   failed; treating an element 14,000px off-screen to the right as visible.
   **Check your probe before you believe it.**

### Already fixed, so look past these

A full-window `backdrop-filter: blur(34px)` running every frame; the gallery
band rendering every frame at full size; `sizes` overstating widths by 2–3×;
up to five films decoding at once; the work line loading behind the gallery
that covers it; a film still decoding under the About sheet; the base
animation durations (halved).

### Where I would look next, if it helps

- Compositor layer promotion and overdraw: five full-window grounds stack when
  About is over a project.
- The work line prints three times (186 cells) so it can wrap seamlessly; the
  wrap teleports the scroll position by a full turn. Does that fight trackpad
  momentum?
- Scroll-linked work in `src/components/site/Work.tsx` — the seam wrap, the
  project watcher, the `hbw:over` dispatch.
- Anything that reads layout during scroll (forced synchronous layout).
- Chrome's own tracing: `Rasterize`, `Commit`, `IOSurfaceImageBacking` — the
  last one named the biggest problem I found all week.

## Part three — audit it yourself

Do not take my word for any of the above. In particular:

1. **Is the harness honest?** Pick two or three checks, break the thing each
   one guards, and confirm it fails. Every check in here was supposed to be
   proved that way; tell me if one cannot fail.
2. **Dead code.** `npx knip` still reports ~120 unused exports. I removed the
   files and CSS; the exports are mostly in the poster tool. Say which are
   genuinely dead and which knip is wrong about.
3. **What would you do differently?** Architecture, state, the CMS boundary,
   the stylesheet (11,800 lines in one file), the seven near-identical CMS
   verifiers (~1,090 lines between them), the fact that adding a project
   touches five files.
4. **Anything that is wrong and nobody has noticed.** Accessibility, SEO,
   error handling, the Sanity schema, security of the API routes.

## House rules

- Measure before you claim. Every performance assertion needs a number and the
  command that produced it.
- If you find a fault, prove it by making it happen; if you fix one, prove the
  fix by making the old version fail.
- Comments in this codebase explain *why*, often with the failure that caused
  the rule. Match that; do not write comments that restate the code.
- Do not change a design decision to make a test pass. Two projects
  deliberately give a portrait card to a sequence that opens on a landscape
  film; a test that called that a bug was wrong, not the site.
- Report what you could not determine as plainly as what you could.

Further reading in `docs/`: `lag-audit-2026-10-19.md` is the performance
investigation, `speed-and-improvements-2026-10-19.md` is the ranked list,
`audit-2026-10-18.md` is the earlier codebase audit.
