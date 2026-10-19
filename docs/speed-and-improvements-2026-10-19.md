# The site, what would make it quicker, and what I'd change next

Measured on this Mac in Chrome. Load figures are on a throttled 4 Mb/s
connection with 80ms latency — a decent phone on mobile data, not café wifi.
Smoothness figures are from a real GPU at the 2× scale of this screen.

## Every page the site has

Nine, and that is all of them.

| | |
|---|---|
| `/` | The work |
| `/practice` | About |
| `/projects/made-by-madelen` | Made by Madelen, 2026 |
| `/projects/sck` | SCK, 2025 |
| `/projects/sub-3` | SUB:3, 2025 |
| `/projects/bar-closed` | CLOSED, 2024 |
| `/projects/koja` | KOJA, 2024 |
| `/projects/chris-sisarich` | Chris Sisarich, 2024 |
| `/projects/our-boy-roy` | Our Boy Roy, 2022 |

Plus `/robots.txt` and `/sitemap.xml` for crawlers, six API routes that serve
no page (subscribe, share, email, place, the sequence feed, and the Sanity
rebuild webhook), and one redirect, `/projects/closed` → `/projects/bar-closed`.

About also opens as a sheet over any page; it is the same content as
`/practice`, which is the version written to be found and linked.

## Where it stands

| | Front page | A project |
|---|---|---|
| Weight | 1.50MB | 3.2–4.5MB |
| HTML over the wire | 37KB gzipped | 37KB gzipped |
| JavaScript | 0.52MB | 0.52MB |
| LCP at 4 Mb/s | 2.17s | 1.10–2.81s |
| Frames dropped while scrolling | 0 in ~430 | 0 in ~500 |

Smoothness is now solved and guarded. **Load is the remaining weak point, and
it is almost entirely one thing.**

## What would make it quicker, biggest first

**1. Stop loading the work line behind an open gallery.** *Saves roughly 2–3MB
on every project page — more than half.*

A project page is the gallery, which covers the whole window. Behind it sits
the work line: 186 cells, of which about 71 download. Not one of them can be
seen. They no longer load *eagerly*, but `loading="lazy"` defers nothing when
the elements sit at the height of the window, so they come down anyway and
compete with the pictures the visitor is waiting for.

The fix is to not render the strip's images at all while a gallery covers it,
and render them as it closes. The care needed is in the closing transition —
the strip has to be there, with pictures, as the gallery lifts. Half a day,
and it is the single biggest thing left.

**2. Give the films a WebM.** *Saves roughly 30–40% of video bytes in Chrome
and Firefox, which is most visitors.*

Two of fifty films have one. The heaviest file on the site is a 3.5MB MP4.
VP9 or AV1 at the same quality is meaningfully smaller, and the markup already
prefers a WebM source when it is there. It is an encode pass and a re-seed,
no code. Half a day, mostly waiting for ffmpeg.

**3. Print the work line twice instead of three times.** *Saves about a third
of 186 cells, ~7MB of decoded bitmap and 200 DOM nodes.*

Three turns exist so the loop can wrap without a seam. Two may be enough —
the reader is held on the middle turn, and the third is scenery behind the
scenery. This touches the one mechanism that makes the endless scroll work,
so it wants a careful look and a real test rather than a quick edit. Half a
day, with a meaningful chance the answer is "three is needed".

**4. Serve the strip's thumbnails already grey.** *Saves ~15% on 186 images
and removes 199 CSS filters.*

Sanity can desaturate on request (`sat=-100`). A grey JPEG is smaller than a
colour one, and the filter disappears with it. The catch: cells go colour on
hover, so it means two renditions per cell and a swap. Worth doing only if
we also decide hover-to-colour is worth keeping. A day.

**5. Preload the two frames either side of the gallery's window.** *Fixes a
visible flaw rather than saving bytes.*

A hard flick through the band can briefly leave a column blank. This is
pre-existing — identical before and after this week's work — and is load
latency, not the render window; widening the window does not change it.
Marking the frames just outside the window `eager` would cover it. An hour.

## What I'd change next, beyond speed

**Finish the project registry.** Adding a project still touches five files —
the catalogue, the CMS registry, the shipped experience, a content module and
a seed script — and `generateStaticParams` reads the shipped catalogue, so a
CMS-only project gets no page at all. Made by Madelen took most of a day for
what should be an afternoon. This is the `studio/project-registry` branch;
roughly half a day to finish.

**Collapse the six CMS verifiers into one.** They are near-identical copies,
1,090 lines between them. One verifier driven by the registry would be about
200 and would mean a seventh project is verified by existing rather than by
someone remembering to copy a file.

**Made by Madelen has no logotype.** It is recorded by name in the test that
guards it, so it is a known gap rather than a silent one. It needs the real
vector from you — I was not going to draw a client's mark.

**Decide what happens to Talk.** The article we wrote is still in Sanity, and
the schema, loader and page are in git history at `b441c6a`. Bringing it back
is an afternoon. Leaving it is fine. What is not fine is forgetting it is
there.

**CLOSED's published preview image has drifted** from the shipped record —
Sanity holds a 1920×1080 where the catalogue expects 1080×1350. Harmless
today because the card is drawn from the sequence, but the verifier reports it
on every run, and a reported-but-ignored gap is exactly how a stale assertion
survived for weeks earlier this week.

**There is no `npm run lint`** and no ESLint config. Typecheck and the tests
carry everything.

**`hbw-index.css` is 13,400 lines in one file.** It reads well and is heavily
commented. Splitting it by room — bar, gallery, sheet, catalogue — would not
change a pixel and would make finding the rule that owns a behaviour something
other than a grep.

## One pattern worth naming

Every performance bug this week was the same shape: **a rule keyed to
something that was true when it was written and quietly stopped being true.**
"The first project", when the first project was long. A flag that drew every
frame, from when pages had no width of their own. One `sizes` figure, from
when the frames were all a similar shape. Each was correct and well commented
on the day it was written.

The new `smooth` check watches the outcome rather than any of those rules,
which is why it would have caught all three. Where we can, the same move is
worth making elsewhere: assert what the visitor gets, not how we got there.
