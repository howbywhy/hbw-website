# qa

Browser checks for the things `npm test` cannot see: what moves, in what
order, and whether a page is quiet.

These live in the repo rather than in a scratch directory because they assert
*this* repo's own internals — `data-settling`, `--enter-work`, `hbw-arrive`,
`.hbw-lamp`. When a selector or a token changes, the check that depends on it
should change in the same commit. An earlier set of these lived outside the
repo and was lost; nothing recorded what it had been guarding.

## Running them

They do not build or start anything, on purpose. Measuring a site while it is
being rebuilt underneath you has produced two confident, wrong conclusions
here — a 625px regression that was not real, and a set of sequencing failures
that were the build rather than the site.

```bash
npm run build
npx next start -p 4409 &
npm run qa                    # everything
npm run qa -- engine twice    # just these
QA_URL=https://… npm run qa   # somewhere else
```

Chrome is found at `$CHROME`, then `$PUPPETEER_EXECUTABLE_PATH`, then the
macOS default. `puppeteer-core` downloads no browser.

Exit code is non-zero if anything **failed** or anything went **unmeasured**.

## What each one guards

| check | the rule it holds |
| --- | --- |
| `console` | every listed page answers, loads everything it asks for, and logs nothing |
| `sequence` | each project serves a sequence, and every file it names resolves |
| `worknav` | the nav is Work and About; Work runs one ending wherever it is pressed |
| `engine` | the nav leads: nothing arrives until the bar has stopped |
| `sheetwait` | About does not paint until the bar has stopped |
| `twice` | nothing in a gallery arrives, stops, and arrives again |
| `roomwait` | a new room waits for the nav; a hand-over keeps the panel it has |

## The one rule about writing them

**A check that can only pass is worse than no check.**

Every fault these were written for had survived a green run:

- `engine` reported six of ten scenes green while measuring nothing at all,
  and an inert nav gate lived behind that for weeks.
- `sheetwait` had both branches of a ternary return `100`, so a fully hidden
  panel read as fully shown — and it clicked a link that opened no sheet.
- A catalogue mark-fit check passed on marks of zero size.

So `ok()` takes three verdicts, not two: pass, fail, and **unmeasured**. A
scene where nothing moved did not pass; it failed to look. The runner exits
non-zero on it, which is the only reason the gap gets noticed.

When you add a check, break the thing it guards and watch it fail before you
trust it. Each one here has been through that — but a proof goes stale, so
record what you broke and check it still breaks.

Two of these had rotted, found by someone auditing the harness rather than
the site. `twice` was said to fail when the `data-over` qualifier came off
the lamp's wipe-in; that rule is no longer what causes a second arrival, so
the documented break proves nothing now. Worse, with the Next press taken
out, `twice` watched an empty gallery for three seconds and passed: nothing
arrived twice because nothing arrived at all. It counts what it watched now
and reports unmeasured when that is nothing.

`links` had a row whose verdict was the literal `true` — it printed outward
URLs and passed whatever they were. `sequence` worked from a hand-written
list of six projects that Made by Madelen had already fallen off, so that
project's frames went unchecked for a week; it reads the sitemap now.

One more thing the harness was doing to itself. A check closes its own
browser on the way out, which does not happen when it throws on the way
through — so one failure left a Chrome behind, the next check started under
more pressure, and far enough into a thirteen-check run the suite began
failing with "detached Frame" at whichever check was unlucky. It moved
between runs, which is exactly how a harness fault disguises itself as a
flaky site. `lib.mjs` tracks every browser it opens and the runner shuts
them after each check, so one falling over cannot take the rest with it.

The proofs that currently hold: removing the Next press makes `twice` report
unmeasured on all four scenes; putting the pre-October durations back makes
all three `brisk` budgets fail; checking out the gallery as it stood before
the band was windowed makes `smooth` fail on Made by Madelen at 6.7%.

## Not here

Generic crawls — link reachability across every route, overflow, responsive
counts across breakpoints — already exist in `HBW-Site-QA`, a separate CLI
built for exactly that. Its HBW config is stale: it points at the old
`hbw-website` repo, the old `.hbw-home-strip` selector and port 3000.

## smooth — the one that opens a window

Every other check here runs headless. `smooth` does not, and cannot: headless
Chrome rasterises in software and skips most of what makes a page feel slow.
It reported a clean seventeen millisecond frame on a project page that was
dropping one frame in five on the machine in front of us.

So a Chrome window appears for about a minute when the suite runs. It scrolls
the front page and all seven projects, counts the gap between frames, and
fails a page where more than four per cent of frames take longer than 33ms or
where the ninety-ninth percentile passes 50ms. It reports *unmeasured* — which
the runner treats as a failure — when nothing scrolled, when there were too
few frames to judge, or when no window could be opened at all.

Frame rate is machine-dependent, so the budget is loose on purpose: the worst
page measured 19% before it was fixed and every page measures 0% after.
Anything in between is worth a morning.

    npm run qa -- smooth
