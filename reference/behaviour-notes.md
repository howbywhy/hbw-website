# Behaviour notes

Observed on the live public site and preserved via recovered HTML/CSS/JS.

## Persistent HBW environment

The cream canvas, hand-drawn `#hbw-logo-svg` mark (`.hbw-signature`), and centre pill (`.hbw-floatnav`) persist across routes. Page content enters over/beside that canvas rather than replacing it with a new layout.

## Home

- Cream full-viewport canvas
- Large HBW mark, displacement filter on the SVG
- Practice statement (`.hbw-description`): heading + body
- Left Selected Works rail (`.folder-tab-container`), acid yellow, internally scrollable project covers with captions
- Centre pill reads the current destination; hover expands the tray (Home / Projects / Studio / Collections / Manifesto)
- Newsletter popup markup present (Klaviyo runtime not recovered)
- Idle screensaver (hotkey `S` in recovered script)

## Selected Works rail

- Fixed left, ~360px on 1920 desktop (live computed)
- Project cards: Bounce (external, coming soon), SUB:3, Bar Closed, KOJA
- Overlay logos (SVG) on covers
- Leave animation before navigating to a project (`LEAVE_NAV_DELAY_MS = 460`)

## Navigation

- Small centre pill, `position: fixed`, z-index `99998`
- Expanded hover / focus-within tray with sliding pill highlight
- Current destination label on the menu button
- Hidden on `/intake/start`

## Project pages (SUB:3 is the fidelity test)

- Horizontal spread: `.project-gallery` > `.project-gallery__track` > `.hbw-hscroll__item`
- Grab/drag + wheel, inertia (`friction: 0.965`)
- Next-spread peek from track layout
- Counter (01 / n) from recovered gallery JS
- Project panels: Idea / Shift / System / Outcome on yellow/black/cream fields (`.project-descriptions.yellow` etc.)
- Films via Dropbox `raw=1` `<video>` tags
- Not a vertical case-study page

## Projects index

- Scrolling project covers over the persistent mark
- Fixed intake CTA (`→ Share your project` → `/intake/start`)
- Fixed `© How by why`
- Scroll-progress rail on the right (desktop)

## Collections

- `.archive-gallery` spatial cluster, varied scale/rotation/depth
- Drag-to-rotate (WebGL world in recovered script)
- Tap / lightbox behaviour
- Fallback copy if WebGL is unavailable
- Not masonry

## Studio / Manifesto

- Entering-panel architecture (swipe/slide onto the persistent canvas)
- Studio: philosophy + how we work + contact `mark@hbw.works`
- Manifesto: mirrored panel relationship; return to Studio
- Leave animation ~460ms before navigation

## Transitions

Live site uses Swup. Recovered scripts listen for `page:swup-complete` and friends, and **fall back to `location.href`** when `window.swup` is missing. The local baseline uses full page loads plus those leave animations. In-page SPA morphing is therefore **approximate** (see fidelity report).
