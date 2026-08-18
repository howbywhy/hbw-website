# Engine audit

## 1. Surface

### Framework

| Fact | Value | Site |
|---|---|---|
| Framework | Next.js App Router | `package.json:16`, `src/app/` |
| Locked version | **16.3.1** | `package-lock.json` `node_modules/next` |
| Range in package.json | `^16.0.0` | `package.json:16` |
| React | **19.2.8** (`react`, `react-dom`) | `package-lock.json` |
| TypeScript | **5.9.3** | `package-lock.json` `node_modules/typescript` |
| Path alias | `@/*` → `./src/*` | `tsconfig.json:25–28` |
| Pages Router | none | no `pages/` directory |
| `src/app` only | yes | glob of `src/app/**/*.{ts,tsx}` |

`next.config.ts` sets `reactStrictMode: false` (`next.config.ts:4`) and `agentRules: false` (`next.config.ts:5`). Images are `unoptimized: true` (`next.config.ts:6–8`). `experimental.optimizePackageImports` lists `@phosphor-icons/react` (`next.config.ts:9–11`).

### Dependencies

| Package | Locked version | Used for in this repo |
|---|---|---|
| `next` | 16.3.1 | App Router, metadata, `redirect()`, Route Handlers, `next/navigation` (`usePathname`, `useRouter`) |
| `react` | 19.2.8 | Client components under `src/components/` |
| `react-dom` | 19.2.8 | `flushSync` in `src/components/home/HbwShell.tsx:5`; View Transitions via `document.startViewTransition` |
| `@phosphor-icons/react` | 2.1.10 | Icon set in `src/components/home/PosterTool.tsx:3–20` only |
| `typescript` | 5.9.3 (dev) | Compile-time types; `noEmit: true` (`tsconfig.json:12`) |
| `@types/node` | 22.20.1 (dev) | Node types for scripts / `fs` in `src/lib/recovered.ts` |
| `@types/react` | 19.2.18 (dev) | React types |
| `@types/react-dom` | 19.2.4 (dev) | DOM types |
| `ffmpeg-static` | 5.3.0 (dev) | Binary path in `scripts/optimize-project-videos.mjs:6`; also `reference/qa/*.mjs` and `reference/recordings/*.mjs`. **No import from `src/`.** |

No other runtime libraries (no GSAP, Framer Motion, Tailwind, CMS SDK, database client).

### Path aliases

```25:28:tsconfig.json
    "paths": {
      "@/*": [
        "./src/*"
```

No `jsconfig.json`.

### Deployment

| Item | Present? | Site |
|---|---|---|
| `vercel.json` | no | — |
| `next.config.ts` | yes | repo root |
| `middleware.ts` / `middleware.js` | no | — |
| `export const runtime` | no matches in `src/` | — |
| Edge runtime | not declared | — |
| `.vercel/project.json` | local only (`.gitignore:4` ignores `.vercel`) | `projectId` `prj_SgbzS4IFW3daCrPmkW8qntUt8fiU`, `orgId` `team_PDiOdAb0Lz8trJPJkHHtRQNR`, `projectName` `hbw-website` |
| `.vercelignore` | yes | excludes `reference`, `.next`, `node_modules`, `.env`, `.env.*` |

Redirect in Next config: `/intake/start` → `/studio`, `permanent: true` (`next.config.ts:12–14`). The same destination is also a server `redirect("/studio")` in `src/app/intake/start/page.tsx:4`.

### Environment variable names (values not recorded)

| Name | Read at |
|---|---|
| `HBW_EMAIL_PROVIDER` | `src/app/api/hbw/email/route.ts:20` — absence → HTTP 503 |
| `HBW_SHARE_PROVIDER` | `src/app/api/hbw/share/route.ts:4` — absence → HTTP 503 |
| `NEXT_PUBLIC_HBW_RECOGNISE` | `src/components/home/poster/recognise.ts:12–15` — `"1"` enables `recogniseStrokes` call path |

No `.env.example` in the repo. `.gitignore:5–7` ignores `.env` / `.env.*` and un-ignores `.env.example` (`!.env.example`), but that example file is not present.

### Two engines

The site is two UIs sharing one Next layout.

1. **Workspace (React).** Paths that `isWorkspacePathname` returns true for (`src/lib/workspace-routes.ts:29–32`): `/`, `/studio`, `/manifesto`, and migrated project slugs. `HbwShell` renders the chrome and returns `children` only when the path is **not** a workspace path (`src/components/home/HbwShell.tsx:1092`). Workspace pages often `return null`. Boot script `public/runtime/hbw-workspace-boot.js` (loaded from `src/app/layout.tsx:39`) adds `hbw-workspace` and `hbw-home-prototype` on those paths (`hbw-workspace-boot.js:16–21`).
2. **Recovered Webflow.** `/projects` index, `/collections`, and any `/projects/[slug]` that is **not** migrated. `RecoveredPage` injects HTML from `src/recovered/html/`. `HbwRuntime` (`src/components/HbwRuntime.tsx:20–26`) injects `/runtime/hbw-runtime.js`, `hbw-evolution-01.js`, `hbw-evolution-02.js` only when `!isWorkspacePathname`.

Migrated slugs (`src/lib/workspace-routes.ts:1–8`): `sub-3`, `koja`, `bar-closed`, `our-boy-roy`, `chris-sisarich`, `bistro-nido`. Same list duplicated in `src/lib/recovered.ts:21–28` as `PROJECT_SLUGS` and again as a pathname array in `public/runtime/hbw-workspace-boot.js:8–15`.

CSS load order, last equal-specificity wins (`src/app/layout.tsx:4–9`): `document.css` → `webflow.css` → `hbw-custom.css` → `hbw-evolution-01.css` → `hbw-evolution-02.css` → `hbw-home-prototype.css`.

### Directory tree (depth 3)

Excludes `node_modules`, `.next`, `.git`. Asset folders with many binaries are counted rather than listed file-by-file.

```
hbw-website/
  docs/
    engine-audit.md
  public/
    collections/          (jpg, gif)
    fonts/                (9 files: Geist, Visual, Neuebit, hashed Webflow copies)
    global/               (jpg, png, svg, mp4, mov)
    identity/             (favicon, brand jpg, computer SVG, hbw-mark.svg)
    practice/
      mark-blackler-studio.jpg
    projects/
      bistro-nido/
      bounce/
      chris-sisarich/     (includes web/)
      closed/             (includes web/)
      koja/               (includes web/)
      our-boy-roy/        (includes web/)
      sub3/               (includes web/)
    runtime/              (hbw-workspace-boot.js, hbw-runtime.js, evolution scripts, numbered recovered snippets)
    Geist.woff2
  reference/              (excluded from Vercel by .vercelignore; crawl, motion map, QA recordings)
  scripts/
    build-from-recovery.mjs
    crawl-live.mjs
    optimize-project-videos.mjs
  src/
    app/
      api/hbw/email/route.ts
      api/hbw/place/route.ts
      api/hbw/share/route.ts
      collections/page.tsx
      intake/start/page.tsx
      manifesto/page.tsx
      projects/page.tsx
      projects/[slug]/page.tsx
      studio/page.tsx
      layout.tsx
      page.tsx
    components/
      home/               (workspace shell, poster, catalog, motion)
      home/poster/
      home/projects/
      HbwRuntime.tsx
      RecoveredPage.tsx
    lib/
      recovered.ts
      workspace-routes.ts
    recovered/
      html/               (11 recovered HTML files)
      pages.json
    styles/               (6 CSS files)
  next.config.ts
  package.json
  package-lock.json
  README.md
  tsconfig.json
  .gitignore
  .vercelignore
```

`public/projects/bounce/` exists on disk and is referenced from recovered home HTML as “Coming Soon”. Bounce is not in `PROJECTS` (`src/components/home/catalog.ts:42–172`).

---

## 2. Route map

Layout chain for every page: `src/app/layout.tsx` (html/body, `HbwShell`, `HbwRuntime`) → the page file. No nested `layout.tsx` under route segments. No `not-found.tsx`. No catch-all `[...slug]`. No `rewrites()` in `next.config.ts`.

| Path | File | Static / Dynamic / ISR | Params | Data source | Layout chain |
|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Static page; UI is client shell | — | metadata: `getRecoveredMeta("/")`; UI: `HbwShell` (`return null` at `page.tsx:12`) | `layout.tsx` → `page.tsx` |
| `/projects` | `src/app/projects/page.tsx` | Static | — | `getRecoveredHtml("/projects")` | `layout.tsx` → RecoveredPage |
| `/projects/[slug]` | `src/app/projects/[slug]/page.tsx` | `generateStaticParams` from `PROJECT_SLUGS` (`page.tsx:7–8`) | `slug` | Migrated slugs: `return null` (`page.tsx:19–27`), UI from `HbwShell`. Other slugs: recovered HTML. There are no other slugs in `PROJECT_SLUGS`, so the RecoveredPage branch is unreached for generated params. | `layout.tsx` → page |
| `/studio` | `src/app/studio/page.tsx` | Static | — | metadata recovered; `return null` | `layout.tsx` → shell |
| `/manifesto` | `src/app/manifesto/page.tsx` | Static | — | metadata recovered; `return null` | `layout.tsx` → shell |
| `/collections` | `src/app/collections/page.tsx` | Static | — | `getRecoveredHtml("/collections")` | `layout.tsx` → RecoveredPage |
| `/intake/start` | `src/app/intake/start/page.tsx` | Redirect | — | `redirect("/studio")` plus config redirect | never renders |
| `POST /api/hbw/email` | `src/app/api/hbw/email/route.ts` | Dynamic Route Handler | JSON body | env `HBW_EMAIL_PROVIDER`; otherwise 503, then 501 | none |
| `POST /api/hbw/share` | `src/app/api/hbw/share/route.ts` | Dynamic Route Handler | FormData (when called) | env `HBW_SHARE_PROVIDER`; 503 then 501 | none |
| `GET /api/hbw/place` | `src/app/api/hbw/place/route.ts` | fetch cache `revalidate: 600` (`route.ts:23`) | — | Open-Meteo; hardcoded Wentworth Falls (`route.ts:3–5`) | none |

`?layer=projects` is not a Next searchParam route. `syncProjectsUrl` uses `history.pushState` (`src/components/home/workspace.ts:218–229`). `?debugMotion=1` is read only in `MotionDebug` (`src/components/home/MotionDebug.tsx:16–17`).

### CMS vs hardcoded

There is no CMS. All workspace content is TypeScript modules. Recovered routes are static HTML files plus `src/recovered/pages.json`.

### `generateStaticParams` / `revalidate`

- `generateStaticParams`: only `src/app/projects/[slug]/page.tsx:7–8`.
- Page-level `revalidate` / `export const revalidate`: none.
- Fetch revalidate: `src/app/api/hbw/place/route.ts:23` (`600`) and `Cache-Control` `s-maxage=600, stale-while-revalidate=3600` (`route.ts:44`).

### Metadata

Root defaults (`src/app/layout.tsx:11–21`):

- `title.default`: `"HBW — Clarity for brands at a turning point"`
- `title.template`: `"%s"`
- `description`: `"HBW (How by why) is a Sydney-based brand and design practice led by Mark Blackler."`
- icons under `/identity/`

Per-route titles come from `src/recovered/pages.json` via `getRecoveredMeta` (`src/lib/recovered.ts:30–37`). That helper **always** replaces description with `"HBW (How by why) is a Sydney-based brand and design practice."` (`recovered.ts:35–36`) — not the layout description, and `pages.json` has no description field.

`/intake/start` has no `metadata` export (it redirects). API routes have none. Missing `not-found` means unknown paths get the Next default 404 with root layout metadata.

Titles in `pages.json` that differ from catalog names: `"/projects/bar-closed"` title is `"Bar Closed — HBW"` while catalog `name` is `"CLOSED"` (`catalog.ts:86`). `"/projects/our-boy-roy"` and `"/projects/chris-sisarich"` titles contain a double space before `—` (`pages.json:54`, `pages.json:58`).

### Redirects, rewrites, catch-alls, not-found

- Redirects: `/intake/start` → `/studio` (config + page).
- Rewrites: none.
- Catch-alls: none.
- `not-found.tsx`: none.

---

## 3. Content model

No schema language (no Zod CMS schema, no Sanity, no MDX collection). Types are TypeScript.

### `ProjectRecord` — `src/components/home/catalog.ts:3–33`

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | URL slug; matches experience keys |
| `href` | `string` | yes | `/projects/{id}` |
| `name` | `string` | yes | Display name |
| `idea` | `string` | yes | Positioning line |
| `year` | `string` | yes | Used by `matchesFilter` / `sortProjects` |
| `src` | `string` | yes | Raster path |
| `srcSet` | `string` | yes | Built by internal `set()` (`catalog.ts:35–38`) with `-p-{width}` suffixes |
| `width` / `height` | `number` | yes | Intrinsic |
| `crop` | `string` | yes | CSS `object-position` value, e.g. `"center 18%"` |
| `layout` | `BrowseLayout` | yes | `"portrait" \| "contained" \| "landscape" \| "wide"` (`catalog.ts:1`) |
| `visualSpan` | `3–9` | optional | 12-column Visual grid |
| `visualStart` | `1–9` | optional | 1-based column |
| `visualBefore` | `3 \| 4 \| 5` | optional | Maps to `--hbw-space-*` margin (`ProjectsLayer.tsx:338`) |
| `homeSelected` | `boolean` | optional | `homePreviewProjects()` takes first 5 flagged (`catalog.ts:174–176`) |
| `sector` | `string` | optional | Filter dim `sector` |
| `disciplines` | `string[]` | optional | Filter dim `discipline` |
| `collaborators` | `string[]` | optional | Filter dim `collaborator` |
| `credits` | `string` | optional | Info sheet facts (`WorkspacePanel.tsx:187`) |
| `location` | `string` | optional | Only Bistro Nido (`catalog.ts:170`); rendered if present (`WorkspacePanel.tsx:186`) |
| `browseSrc` / `browseSrcSet` / `browseWidth` / `browseHeight` / `browseCrop` | optional | Chris Sisarich only (`catalog.ts:118–126`) |

Instances: six records, `PROJECTS` (`catalog.ts:42–172`). Order: SUB:3, KOJA, CLOSED, Chris Sisarich, Our Boy Roy, Bistro Nido. `nextProject` follows this array (`sequence.ts:7–12`). Comment: “Nido has none — the sequence ends” (`sequence.ts:7`).

`homeSelected: true` on the first five; Bistro Nido is omitted from the by-preview register.

### `ProjectExperience` — `src/components/home/projects/types.ts:73–81`

| Field | Type |
|---|---|
| `slug` | `string` |
| `name` | `string` |
| `idea` | `string` |
| `year` | `string` |
| `credit` | `string` (singular; not `credits`) |
| `movements` | `Movement[]` |
| `infoSections` | `InfoSection[]` |

`Movement` (`types.ts:57–65`): `id`, `kind` (`MovementKind`), optional `span` / `surface` / `align`, `media: ProjectMedia`, `infoHint: InfoSectionId`.

`ProjectMedia` (`types.ts:15–29`): `type: "image" \| "video" \| "gif"`, `src`, optional `srcSet`, `mp4`, `webm`, `videoSrc`, `width`, `height`, `poster`, `fit: "contain" \| "cover"`, optional `autoplay`, `loop`, `muted`.

`type: "gif"` is set by `jpg()` when `src.endsWith(".gif")` (`experiences.ts:26`). No current movement `src` ends in `.gif`.

`InfoSection` (`types.ts:67–71`): `id: "idea" \| "shift" \| "system" \| "outcome"`, `heading`, `copy`.

`ArchiveMedia` (`types.ts:32–46`): browse/peek slot; `src` is always a raster.

Instances: `PROJECT_EXPERIENCES` (`experiences.ts:350–357`), retrieved by `getExperience` (`experiences.ts:359–361`). SUB:3 info is imported from `src/components/home/sub3-info.ts`; other projects inline `*_INFO` arrays in `experiences.ts`.

### Poster schema — `src/components/home/poster/types.ts`

`PosterState.schema: 2` (`types.ts:57–58`). Objects: `TextObject`, `StrokeObject`, `ShapeObject`, `ImageObject`. Tools: `"select" \| "text" \| "pencil" \| "marker" \| "shape" \| "upload"`. Fonts: `"Visual" \| "Geist" \| "Neuebit"`. `PALETTE` and `FIELD_COLOR` at `types.ts:77–93`. Migration: `src/components/home/poster/migrate.ts`.

### Studio / manifesto copy — `src/components/home/studio-copy.ts`

`STUDIO_COPY` (`studio-copy.ts:3–40`): `opening`, `role`, `glimpse`, `independent`, `philosophy[]`, `howIntro`, `steps[{id,title,copy}]`, `contact`, `manifestoLabel`.

`MANIFESTO_COPY` (`studio-copy.ts:42–60`): `opening`, `reduced`, `body` (array of line groups), `close`.

### Recovered pages — `src/recovered/pages.json`

Keys: `/`, `/projects`, `/studio`, `/collections`, `/manifesto`, and the six `/projects/{slug}`. Fields: `file`, `title`, `bodyAttrs`, `htmlClass`. HTML bodies are `src/recovered/html/*.html`.

### Query layer

There is no query client. Functions that load data:

| Function | Defined | Consumed by | Returns |
|---|---|---|---|
| `getRecoveredMeta(route)` | `src/lib/recovered.ts:30` | every page `metadata` except intake | `{ title, description }` |
| `getRecoveredHtml(route)` | `src/lib/recovered.ts:40` | `/projects`, `/collections`, non-migrated `[slug]` | HTML string; throws if no file (`recovered.ts:43`) |
| `PROJECTS` / `projectById` / `homePreviewProjects` | `catalog.ts` | HbwShell, ProjectsLayer, ProjectsNavPreview, WorkspacePanel `InfoBody`, sequence, ProjectOutro | `ProjectRecord` / arrays |
| `getExperience(slug)` | `experiences.ts:359` | HbwShell, ProjectOutro, preload | `ProjectExperience \| null` |
| `projectIdeaCopy(slug)` | `experiences.ts:364` | ProjectsLayer `ArchiveItem` | idea-section copy string |
| `STUDIO_COPY` / `MANIFESTO_COPY` | `studio-copy.ts` | WorkspacePanel StudioBody / ManifestoBody | const objects |

### Inline fetches (not through that layer)

| Site | Call |
|---|---|
| `WorkspacePanel.tsx:121` | `fetch("/api/hbw/place")` inside `PracticePlace` |
| `PosterTool.tsx:535` | `fetch("/api/hbw/email", { method: "POST" })` |
| `preload.ts:34` | `fetch(src, { cache: "force-cache" })` for video prefetch |
| `share.ts:16` | `fetch("/api/hbw/share")` — module not imported by PosterTool |
| `place/route.ts:23` | server `fetch` to Open-Meteo |

### Fields defined but unused / selected but unrendered

| Item | Status |
|---|---|
| `ProjectRecord.browseSrc*` | Defined; **UNCERTAIN** whether browse still uses catalog `src` via `openingVisual` instead. `preload.ts` `openingVisual` reads experience movement 0, not `browseSrc`. |
| `ProjectMedia.type: "gif"` | Type + `jpg()` branch; no gif instances |
| `filterValues` | Exported `catalog.ts:203`; no import in `src/` |
| `prevProject` | Exported `sequence.ts:14`; no import in `src/` |
| `consumeReturnToProjects` | `workspace.ts:202`; no caller |
| `markReturnToProjects` | `workspace.ts:192`; no caller |
| `sharePoster` / `whatsappHref` | `poster/share.ts`; no importer |
| `HBW_T.intro` | Named token `motion.ts:14`; timers use `HBW_INTRO_MS` (`HbwShell.tsx:443`) which equals 2280 |
| `location` | Rendered in InfoBody when set |

`credits` (catalog) and `credit` (experience) both exist. InfoBody prefers `record.credits` then `experience.credit` (`WorkspacePanel.tsx:187`). SUB:3 catalog credits omit “Developed with The Colour Club.”; `SUB3_INFO.credit` includes it (`sub3-info.ts:5–6`).

---

## 4. Component inventory

All `"use client"` files are listed. Nested function components that render UI are included.

| Component | File | Server/Client | Rendered by | Props | Holds state? |
|---|---|---|---|---|---|
| `HbwShell` | `src/components/home/HbwShell.tsx:123` | Client | `layout.tsx:42` | `{ children }` | yes — window/phase/swap/panel/origin/filters |
| `HbwRuntime` | `src/components/HbwRuntime.tsx:17` | Client | `layout.tsx:43` | none | no (injects scripts) |
| `RecoveredPage` | `src/components/RecoveredPage.tsx:1` | Server | `/projects`, `/collections`, unused slug branch | `{ html: string }` | no |
| `IdentityNav` | `IdentityNav.tsx:42` | Client | HbwShell header | make/projects/practice callbacks, peek flags, `suffix`, `peekProject` | yes — `live`, `teach`, `intent`, `ack` |
| `NavRegister` | `NavRegister.tsx:18` | Client | HbwShell | `face`, `browseMode`, view index, experience | reads context |
| `PosterTool` | `PosterTool.tsx:58` | Client | HbwShell window | `dormant?`, `hidden?` | yes — canvas/tool/review/send |
| `Arrival` | `Arrival.tsx:24` | Client | HbwShell window | `onMake`, `onBrowse` | no React state; intro VT |
| `ProjectsLayer` | `ProjectsLayer.tsx:51` | Client | HbwShell | open/mode/ids/filter/sort callbacks | yes — hover peek |
| `NoteToggle` | `ProjectsLayer.tsx:166` | Client | ArchiveItem | name, expanded, onToggle | no |
| `ArchiveThumb` | `ProjectsLayer.tsx:193` | Client | ArchiveItem | media, sizes, eager, play | no |
| `RelValue` | `ProjectsLayer.tsx:239` | Client | ArchiveItem | dim, value, onLens | no |
| `ArchiveItem` | `ProjectsLayer.tsx:271` | Client | ProjectsLayer | project + mode + lens | no |
| `ProjectsNavPreview` | `ProjectsNavPreview.tsx:22` | Client | HbwShell | open/enabled/enter/keep/leave | yes — `hoverId` |
| `WorkspacePanel` | `WorkspacePanel.tsx:236` | Client | HbwShell sheet layer | panel, studioView, experience, peek | no (children have state) |
| `Lines` | `WorkspacePanel.tsx:29` | Client | Studio/Manifesto | `lines` | no |
| `ContactCopy` | `WorkspacePanel.tsx:42` | Client | StudioBody | `text` | no |
| `PracticeGlimpse` | `WorkspacePanel.tsx:55` | Client | WorkspacePanel peek | none | no |
| `StudioBody` | `WorkspacePanel.tsx:66` | Client | WorkspacePanel | `onShowManifesto` | no |
| `PracticePlace` | `WorkspacePanel.tsx:116` | Client | StudioBody | none | yes — weather |
| `ManifestoBody` | `WorkspacePanel.tsx:148` | Client | WorkspacePanel | none | no |
| `InfoBody` | `WorkspacePanel.tsx:169` | Client | WorkspacePanel | experience, next project | no |
| `InformationSheet` | `InformationSheet.tsx:22` | Client | WorkspacePanel | variant, open, leaving, preview, children | no |
| `ProjectView` | `projects/ProjectView.tsx:45` | Client | HbwShell (live + leaving) | experience, phase, index, inspecting, entrance, callbacks | refs; no useState |
| `MovementVideo` | `projects/MovementVideo.tsx:26` | Client | ProjectView | media, load, eager, active | yes — `playing`, `src`, `kept` |
| `ProjectOutro` | `projects/ProjectOutro.tsx:112` | Client | ProjectView | `next`, `onCommit`, coverName, fromTotal | no |
| `Stage` | `ProjectOutro.tsx:45` | Client | ProjectOutro | media preview | no |
| `MotionDebug` | `MotionDebug.tsx:13` | Client | HbwShell | mode, project, index, total, phase | yes — `on` from query |
| `WorkspaceContext` | `WorkspaceContext.tsx:19` | Client | Provider in HbwShell | API object | n/a |

Page components (`src/app/**/page.tsx`) are Server Components. `layout.tsx` is a Server Component wrapping two client trees.

### `"use client"` boundaries and why

| File | Forces client |
|---|---|
| `HbwShell.tsx` | `usePathname` / `useRouter`, sessionStorage, `history`, View Transitions, WAAPI, rAF, matchMedia |
| `HbwRuntime.tsx` | `usePathname`, `document.createElement("script")` |
| `IdentityNav.tsx` | `MutationObserver` on `<html class>` (`IdentityNav.tsx:75–76`), hover/teach timers |
| `PosterTool.tsx` | canvas 2d, pointer, `visualViewport`, file input |
| `Arrival.tsx` | View Transitions, `useLayoutEffect` on intro classes |
| `ProjectsLayer.tsx` | hover video, click interception |
| `ProjectsNavPreview.tsx` | `ResizeObserver`, hover timers |
| `WorkspacePanel.tsx` | `fetch` weather, wheel on sheets |
| `InformationSheet.tsx` | pointer preview |
| `NavRegister.tsx` | `useWorkspace()` |
| `ProjectView.tsx` | scroll, drag, FLIP, rAF, ResizeObserver |
| `MovementVideo.tsx` | IntersectionObserver, `HTMLVideoElement` |
| `ProjectOutro.tsx` | click commit (could be server; marked client) |
| `WorkspaceContext.tsx` | `createContext` + `useContext` |
| `MotionDebug.tsx` | `window.location.search` |

`RecoveredPage` is a Server Component using `dangerouslySetInnerHTML` (`RecoveredPage.tsx:6`).

### Near-duplicates

| Pair | Difference |
|---|---|
| `HbwShell` workspace vs `RecoveredPage` + `hbw-runtime.js` | Same public URLs conceptually (home/studio/projects); workspace is React state machine; recovered is Webflow HTML + concatenated IIFE scripts |
| `catalog.ts` `ProjectRecord` vs `experiences.ts` `ProjectExperience` | Catalog is browse metadata + grid; experience is movement sequence + info copy. Names/ideas/years duplicated by hand |
| `srcSet` helper `set()` in `catalog.ts:35` vs `srcSetFor()` in `types.ts:87` | Same `-p-{w}` convention; catalog also used from `projectRecord`; experiences uses `srcSetFor` |
| `MIGRATED_PROJECT_SLUGS` vs `PROJECT_SLUGS` vs boot `migrated` array | Three copies of the same six slugs |
| `credits` vs `credit` | Catalog vs experience field names |
| `InformationSheet` variants vs recovered floatnav / manifesto swipe in `hbw-custom.css` + `hbw-evolution-02.css` | Workspace sheets are React + prototype CSS; recovered uses pill floatnav (`--hbw-radius: 999px`) |
| Close/Back in `HbwShell` vs recovered `.hbw-floatnav` | Workspace owns Back/Close in the header strip (`HbwShell.tsx:1227–1244`); recovered pages keep Webflow nav |
| `document.css` `@font-face` Geist vs `hbw-custom.css` `@font-face` Geist | Duplicate family registration |
| Numbered `public/runtime/01-…js` vs concatenated `hbw-runtime.js` | `hbw-runtime.js` inlines the numbered files as comments (`hbw-runtime.js:3`); `HbwRuntime.tsx` loads the bundle, not the numbered files |

---

## 5. Type system

### Font files and `@font-face`

No `next/font`. Preload: `src/app/layout.tsx:38` `/fonts/Geist.woff2`.

| Family | `@font-face` | Files in `public/fonts/` | weight | style | variable axes |
|---|---|---|---|---|---|
| Geist | `document.css:1–9` (woff2 + hashed woff2 + otf); `hbw-custom.css:2–8` (woff2 only) | `Geist.woff2`, `671a30d745cd22c8cc5c570e_Geist-Regular.woff2`, `671a30d6ef2a1073319beaeb_Geist-Regular.otf` | 400 | normal | none declared |
| Visual | `document.css:11–19` | `Visual-Regular.woff2`, hashed woff2, otf | 400 | normal | none |
| Neuebit | `document.css:21–29` (`font-family: "Neuebit"`; files named NeueBit) | `NeueBit-Regular.woff2`, hashed woff2, woff | 400 | normal | none |

`font-display`: Geist `block` (`document.css:8`, `hbw-custom.css:7`); Visual and Neuebit `swap` (`document.css:18`, `document.css:28`).

Poster canvas references families as `400 ${size}px ${obj.font}, Geist, sans-serif` (`poster/paint.ts:17–18`) with `obj.font` one of Visual, Geist, Neuebit (`types.ts:3`).

Workspace CSS sets `font-family: Geist, sans-serif` as a string literal, not `var(--hbw-font)`, on `html.hbw-workspace` (`hbw-home-prototype.css:94`) and ~38 further rules in that file (lines 109, 186, 339, 376, 438, 511, 658, 676, 1278, 1459, 1489, 1503, 1555, 1567, 1662, 1698, 1722, 1740, 1760, 1788, 1795, 2149, 2352, 2401, 2422, 2482, 2924, 3141, 3153, 3204, 3226, 3261, 3277, 3358, 3375, 3463, 3498). Token `--hbw-font: Geist, sans-serif` is declared at `hbw-home-prototype.css:79` and largely unused in that file.

`hbw-custom.css` uses `var(--hbw-font)` at line 81 and the string `"Geist", system-ui, …` at 703. Screensaver/popup rules use `system-ui, -apple-system, "Segoe UI", sans-serif` (lines 1156, 1340, 1376, 1403, 1516, 1524, 1539).

`hbw-evolution-02.css:9`, `:205` — `Geist, sans-serif`; `:247` — `Geist, system-ui, sans-serif`.

`webflow.css` (minified line 1): `font-family:sans-serif` on `html`; `monospace` on `code,kbd,pre,samp`.

### Scale source of truth (workspace)

Declared on `html.hbw-workspace` / `html.hbw-home-prototype` (`hbw-home-prototype.css:45–50` and `77–83`):

| Token | Value |
|---|---|
| `--hbw-lg` | `0.9375rem` (15px at 16px root) |
| `--hbw-sm` | `var(--hbw-lg)` |
| `--hbw-ui` | `var(--hbw-lg)` |
| `--hbw-ui-sm` | `var(--hbw-lg)` |
| `--hbw-ui-track` | `0.02em` |
| `--hbw-lh-ui` | `1.2` |
| `--hbw-lh-body` | `1.45` |
| `--hbw-font-size` | `var(--hbw-lg)` |
| `--hbw-ls` | `var(--hbw-ui-track, 0.02em)` |
| `--hbw-font` | `Geist, sans-serif` |
| `--hbw-tool` | `1.9rem` |
| `--hbw-task-h` | `2.75rem` |

There is no Tailwind config. `src/components` contains **zero** `font-size` / `line-height` / `letter-spacing` / `font-family` declarations.

### Distinct triples in workspace prototype

Counts are declaration sites of `font-size` in `hbw-home-prototype.css`.

| font-size | line-height (same rule or inherited html) | letter-spacing | Count of `font-size` decls | Notes |
|---|---|---|---|---|
| `var(--hbw-lg)` | typically `var(--hbw-lh-ui, 1.2)` or `var(--hbw-lh-body, 1.45)` | `var(--hbw-ui-track, 0.02em)` | 32 | including html/body |
| `var(--hbw-sm)` | same tokens (sm === lg today) | same | 24 | |
| `inherit` | inherit | inherit | 6 | lines 122, 132, 366, 385, 545, 745 |
| `16px` | from parent | from parent | 1 | `hbw-home-prototype.css:4040` — iOS zoom-prevention on poster email inputs inside a max-width 767 media query |

Poster edit field (`hbw-home-prototype.css:1521–1532`): `letter-spacing: 0`; `line-height: 1.25`; no `font-size` in the rule (inherits). Motion debug (`3490–3500`): `font-size: var(--hbw-sm)`; `letter-spacing: 0.02em` **literal** not `var(--hbw-ui-track)`.

### Competing scales (not the workspace tokens)

**`hbw-custom.css` `:root`** (`hbw-custom.css:10–21`): `--hbw-font-size: 0.94rem`; `--hbw-ls: -0.01em`.

Literal `font-size` outside that token:

| Path | Line | Value |
|---|---|---|
| `src/styles/hbw-custom.css` | 1341 | `0.85rem` |
| same | 1377 | `1rem` |
| same | 1404 | `0.8rem` |
| same | 1421 | `1.5rem` |
| same | 1449 | `0.68rem` |
| same | 1456 | `1.25rem` |
| same | 1518 | `clamp(1.2rem, 2.2vw, 1.8rem)` |
| same | 1525 | `0.98rem` |
| same | 1540 | `0.95rem` |
| `src/styles/hbw-evolution-02.css` | 10, 214, 221 | `0.9rem` |
| `src/styles/hbw-home-prototype.css` | 4040 | `16px` |
| `src/styles/webflow.css` | 1 | minified Webflow scale: `2em`, `80%`, `75%`, `14px`, `38px`, `32px`, `24px`, `18px`, `16px`, `1rem`, `1.3rem`, and others on that single line |

`hbw-custom.css` also uses `font-size: var(--hbw-font-size)` (82) and `var(--hbw-font-size-body, 0.94rem)` (704, 1157, 1221). Prototype `--hbw-font-size-body` is `var(--hbw-lg)` (`hbw-home-prototype.css:81`), so those custom fallbacks disagree with workspace after prototype loads unless a more specific custom rule wins.

`hbw-evolution-02.css:248`: `var(--hbw-font-size-body, 0.94rem)`.

---

## 6. Colour, spacing, radius

### Token source of truth (workspace)

Quoted in full from `src/styles/hbw-home-prototype.css:3–82`:

```
html.hbw-workspace {
  --hbw-page: #ffffff;
  --hbw-window: #ffffff;
  --hbw-info: #fcfa9b;
  --hbw-manifesto: #e3ddd4;
  --hbw-x-practice: calc(var(--hbw-x-projects) - 2rem);
  --hbw-x-manifesto: calc(var(--hbw-x-edge) - min(26rem, 29vw));
  --hbw-space-1: 4px;
  --hbw-space-2: 8px;
  --hbw-space-3: 16px;
  --hbw-space-4: 32px;
  --hbw-space-5: 64px;
  --hbw-edge: 12px;
  --hbw-header-pad-y: var(--hbw-space-2);
  --hbw-nav-line: calc(var(--hbw-lg) * 1.2);
  --hbw-nav-gap: var(--hbw-space-1);
  --hbw-subnav-h: var(--hbw-nav-line);
  --hbw-header-h: calc(
    var(--hbw-header-pad-y) * 2 + var(--hbw-nav-line) + var(--hbw-nav-gap) + var(--hbw-subnav-h)
  );
  --hbw-gallery-gap: var(--hbw-space-2);
  --hbw-boundary-gap: 12rem;
  --hbw-stage-gap: var(--hbw-space-4);
  --hbw-browser-gap: var(--hbw-space-2);
  --hbw-peek-thumb: 3.25rem;
  --hbw-peek-gap: 0.5rem;
  --hbw-practice-peek: 11rem;
  --hbw-times-gap: var(--hbw-space-2);
  --hbw-work-col: 16rem;
  --hbw-index-thumb: 1.75rem;
  --hbw-index-gutter: 1.15rem;
  --hbw-doc-slice: 4rem;
  --hbw-x-brand: var(--hbw-edge);
  --hbw-x-projects: calc(var(--hbw-edge) + (100vw - 2 * var(--hbw-edge) - var(--hbw-work-col)) / 2);
  --hbw-x-studio: calc(var(--hbw-x-projects) + var(--hbw-work-col));
  --hbw-x-edge: calc(100vw - var(--hbw-edge));
  --hbw-index-axis: calc(var(--hbw-x-projects) - var(--hbw-edge));
  --hbw-index-hover-opacity: 0.64;
  --hbw-pad-work: calc((100% - var(--hbw-work-col)) / 2);
  --hbw-context-w: var(--hbw-pad-work);
  --hbw-inspector-w: var(--hbw-context-w);
  --hbw-studio-w: calc(var(--hbw-x-edge) - var(--hbw-x-studio));
  --hbw-radius: 0px;
  --hbw-lg: 0.9375rem;
  --hbw-sm: var(--hbw-lg);
  --hbw-ui: var(--hbw-lg);
  --hbw-ui-sm: var(--hbw-lg);
  --hbw-ui-track: 0.02em;
  --hbw-lh-ui: 1.2;
  --hbw-lh-body: 1.45;
  --hbw-tool: 1.9rem;
  --hbw-task-h: 2.75rem;
  --hbw-task-bottom: var(--hbw-space-3);
  --hbw-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --hbw-motion-micro: 140ms;
  --hbw-motion-ui: 240ms;
  --hbw-motion-spatial: 380ms;
  --hbw-motion-continuity: 520ms;
  --hbw-t-micro: var(--hbw-motion-micro);
  --hbw-t-ui: var(--hbw-motion-ui);
  --hbw-t-enter: var(--hbw-motion-spatial);
  --hbw-t-exit: var(--hbw-motion-spatial);
  --hbw-t-nav: var(--hbw-motion-micro);
  --hbw-t-spatial: var(--hbw-motion-spatial);
  --hbw-t-handoff: var(--hbw-motion-continuity);
  --hbw-t-gallery: var(--hbw-motion-ui);
  --hbw-field: #f4f5f3;
  --hbw-vv-inset: 0px;
  --hbw-t-intro: 2280ms;
  --hbw-t-fade: var(--hbw-motion-ui);
  --hbw-t-move: var(--hbw-motion-spatial);
  --hbw-t-panel: var(--hbw-motion-spatial);
}

html.hbw-workspace,
html.hbw-home-prototype {
  --hbw-font: Geist, sans-serif;
  --hbw-font-size: var(--hbw-lg);
  --hbw-font-size-body: var(--hbw-lg);
  --hbw-ls: var(--hbw-ui-track, 0.02em);
}
```

Colour tokens in that block: `#ffffff`, `#fcfa9b`, `#e3ddd4`, `#f4f5f3`. Ink `#333` / `#1d1d1d` / `#e23b2e` are **not** custom properties on `html.hbw-workspace`; they are literals in rules.

Competing `:root` in `hbw-custom.css:10–42` (quoted in part): `--hbw-surface`, `--hbw-text: #333`, `--hbw-radius: 999px`, `--hbw-motion: 180ms`, extra easings, floatnav tray timings.

### Literal colours in `src/` (hex / rgb / rgba / hsl)

Method: regex over `src/` (`.css`, `.ts`, `.tsx`, `.html`, `.json`). No `oklch` matches. **436 occurrences, 97 unique values** (whitespace-stripped, case-folded).

| Count | Value |
|---:|---|
| 79 | `#333` |
| 35 | `#fff` |
| 27 | `#1d1d1d` |
| 25 | `#ffffff` |
| 22 | `#0000` |
| 14 | `#f75c4a` |
| 14 | `#111` |
| 13 | `#fcfa9b` |
| 11 | `#000` |
| 11 | `#ddd` |
| 10 | `#e23b2e` |
| 8 | `rgba(255,255,255,0.86)` |
| 7 | `rgba(51,51,51,0.18)` |
| 7 | `#fff0` |
| 6 | `#222` |
| 6 | `#f4f5f3` |
| 6 | `rgba(51,51,51,0.55)` |
| 5 | `#3898ec` |
| 5 | `#ccc` |
| 5 | `#75869600` |
| 4 | `#e6e6e6` |
| 4 | `#3898ec00` |
| 4 | `rgba(51,51,51,0.45)` |
| 3 | `rgba(0,0,0,0.08)` |
| 3 | `rgba(51,51,51,0.22)` |
| 3 | `#fafafa` |
| 3 | `#c8c8c8` |
| 3 | `rgba(51,51,51,0.46)` |
| 2 each | `rgba(0,0,0,0.75)`, `rgba(255,255,255,0.93)`, `rgba(255,255,255,0.65)`, `rgba(246,239,230,0.97)`, `rgba(0,0,0,0.72)`, `rgba(0,0,0,0.85)`, `rgba(0,0,0,0.9)`, `#ff7852`, `#f5f5f5`, `rgba(51,51,51,0.28)`, `#0000001a`, `#999`, `#5d6c7b`, `#0082f3`, `#0006`, `#eeda00`, `#f2ecde`, `#7a7a7a`, `#3f3f3f`, `#e3ddd4`, `rgba(51,51,51,0.4)`, `rgba(51,51,51,0.12)`, `rgba(51,51,51,0.62)`, `rgba(29,29,29,0.55)`, `#333333` |
| 1 each | `rgba(255,255,255,0.82)`, `rgba(255,255,255,0.92)`, `rgba(0,0,0,0)`, `rgba(0,0,0,0.06)`, `rgba(0,0,.2)`, `rgba(255,255,255,1)`, `rgb(242,236,222)`, `#ff0`, `#aaadb0`, `#e2e2e2`, `#ffdede`, `#eee`, `#f3f3f3`, `#ea384c`, `#758696`, `#3336`, `#2226`, `#fff6`, `#000000e6`, `#2895f7`, `#d3d3d3`, `#f8f4ebf2`, `#303030`, `#0000000f`, `#00000080`, `#ebf3ff`, `#ff2b2b`, `#eeeeee69`, `#8a9c9e`, `#080808`, `#6a3629d9`, `#6a3629`, `rgba(51,51,51,0.72)`, `rgba(51,51,51,0.5)`, `rgba(51,51,51,0.08)`, `rgba(29,29,29,0.45)`, `#d4652a`, `#c4a35a`, `#3d6b8a`, `#4a7c6f`, `#5b6aa8`, `#8a8680`, `#c8c4bb` |

Occurrences by file:

| Occurrences | Unique | File |
|---:|---:|---|
| 200 | 50 | `src/styles/webflow.css` (one minified line) |
| 106 | 23 | `src/styles/hbw-home-prototype.css` |
| 38 | 23 | `src/styles/hbw-custom.css` |
| 26 | 3 | `src/recovered/html/home.html` |
| 22 | 12 | `src/recovered/html/collections.html` |
| 14 | 14 | `src/components/home/poster/types.ts` |
| 12 | 5 | `src/styles/hbw-evolution-02.css` |
| 3 | 1 | `src/components/home/PosterTool.tsx` |
| 2 | 2 | `src/styles/document.css` |
| 2 | 2 | `src/components/home/poster/paint.ts` |
| 1 | 1 | remaining recovered HTML files (mostly `#f75c4a`), `hbw-evolution-01.css`, `poster/migrate.ts` |

`#f75c4a` is concentrated in recovered HTML (Webflow brand red), not in the workspace prototype (workspace accent literal is `#e23b2e`).

### Colours that do not go through `var(--…)`

A colour “resolves to a token” only when the property value is `var(--hbw-…)`. Token **definitions** themselves are literals. Below: non-`var` uses **excluding** `webflow.css` and `src/recovered/`.

**`#333`** (39): `hbw-custom.css` 26, 27, 94; `hbw-evolution-02.css` 13, 35, 202, 209, 270, 293; `document.css:35`; `hbw-evolution-01.css:23`; `hbw-home-prototype.css` 93, 185, 346, 443, 515, 737, 1008, 1068, 1074, 1122, 1175, 1183, 1365, 1473, 1506, 1557, 1589, 1595, 1627, 1674, 1807, 2153, 2252, 2384, 2413, 2426, 2451, 2485.

**`#1d1d1d`** (15): `hbw-custom.css` 920, 2063; prototype 472, 1283, 1576, 1703, 2772, 2945, 3147, 3160, 3209, 3386, 3388, 3496; `poster/types.ts:80`.

**`#ffffff`** (13): includes token defs prototype 4–5; also 91, 92, 184, 1221, 1397, 1605, 2513, 3083, 3660; `hbw-custom.css:1843`; `types.ts:81`.

**`#e23b2e`** (10): prototype 1308, 1681, 1712, 1731, 1749; `PosterTool.tsx` 76, 567, 827; `migrate.ts:80`; `types.ts:83`.

**`#fff`** (8): custom 614, 697; evolution-02 246, 260, 265; prototype 1633 (twice on one line), 3497.

**`#111`** (7): custom 1160, 1223, 1360, 1382, 1396, 1426, 1501.

**`#f4f5f3`** (6): prototype 69 (token), 1233, 1260, 1365, 1528; `types.ts:77` as `FIELD_COLOR`.

**`#fcfa9b`** (5): evolution-02 292; prototype 6 (token), 2944, 3387; `types.ts:82`.

**`rgba(51,51,51,0.55)`** (6): prototype 749, 1328, 1457, 1667, 1726; `paint.ts:162`.

**`rgba(51,51,51,0.18)`** (7): custom 25 (token `--hbw-border`); prototype 1417, 1604, 1615, 1616, 1695, 4016.

**`#ddd`** (4): prototype 1632–1633 checkerboard.

**`#ff7852`** (2): `hbw-custom.css:484`, `:656`.

**`rgb(242,236,222)`** (1): `document.css:34` body background.

Poster `PALETTE` extras only in `types.ts:84–92`: `#d4652a`, `#c4a35a`, `#3d6b8a`, `#4a7c6f`, `#5b6aa8`, `#8a8680`, `#c8c4bb`, `#f2ecde`, plus `#333333`.

Remaining rgba steps in prototype/custom/evolution are listed in the unique-value table; each 1–4 hit site is in the inventory dump above.

### Spacing scale

| Token | Value | File |
|---|---|---|
| `--hbw-space-1` | `4px` | `hbw-home-prototype.css:10` |
| `--hbw-space-2` | `8px` | `:11` |
| `--hbw-space-3` | `16px` | `:12` |
| `--hbw-space-4` | `32px` | `:13` |
| `--hbw-space-5` | `64px` | `:14` |
| `--hbw-edge` | `12px` | `:15` (not on the 4–8–16–32–64 scale) |

`--hbw-edge` in `hbw-custom.css:16` is `max(calc(var(--hbw-unit) * 1.125), env(safe-area-inset-left, 0px))` with `--hbw-unit: 0.5rem` (`hbw-custom.css:11`). Same name, different value; prototype loads last on `html.hbw-workspace`.

Spacing literals in prototype that are not `var(--hbw-space-*)` (sample of declared tokens and rules): `--hbw-boundary-gap: 12rem` (line 24); `--hbw-peek-thumb: 3.25rem`; `--hbw-peek-gap: 0.5rem`; `--hbw-practice-peek: 11rem`; `--hbw-work-col: 16rem`; `--hbw-index-thumb: 1.75rem`; `--hbw-index-gutter: 1.15rem`; `--hbw-doc-slice: 4rem`; `column-gap: 0.4em` (361, 604); `column-gap: 0.22em` (628); `gap: 0.9rem` (1041); `0.75rem` (1052); `1.25rem` (1087); `padding: 0.45rem 0` (1295); `gap: 5rem` / `padding: 0 6rem 0 0` (2723, 2726); mixed `padding: 0 var(--hbw-space-4) 22%` (427); `.hbw-motion-debug` `left: 12px; bottom: 12px` (3492–3493).

`hbw-custom.css` raw px: `padding: 4px` (76), `margin: -2px` (77), `padding: 1px` (153), `padding: 6px` (414).

`hbw-evolution-02.css`: `padding: 10px 2px 8px` (8); `50px 40px 50px 30px` (294); mobile `72px 22px 32px` (346).

### Radius, border, shadow

| System | Radius | Shadow |
|---|---|---|
| Workspace token | `--hbw-radius: 0px` (`hbw-home-prototype.css:45`) | mostly `box-shadow: none`; poster frame `inset 0 0 0 1px #333` (`:1627`) |
| Prototype pills | `border-radius: 999px` at `:3373`; `50%` dot `:1680` | |
| Custom token | `--hbw-radius: 999px` (`hbw-custom.css:29`); 14× `border-radius: 999px` on float nav | 4× `box-shadow` (mostly none) |
| Webflow | 21× `border-radius`, 6× `box-shadow` on `webflow.css:1` | form/button chrome |
| Evolution CSS | none | none |

Borders in workspace are typically `1px solid` with `#333` or `rgba(51,51,51,…)` rather than a `--hbw-border` token (that token exists only on custom `:root`).

---

## 7. Motion

Shared token file: `src/components/home/motion.ts`, comment “Keep in sync with `hbw-home-prototype.css`” (`motion.ts:1`).

```2:21:src/components/home/motion.ts
export const HBW_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export const HBW_T = {
  micro: 140,
  ui: 240,
  spatial: 380,
  continuity: 520,
  intro: 2280,
  prepareCap: 1400,
} as const;

/** occupy spatial + read (continuity+ui+ui) + yield ui + expand continuity + settle micro. */
export const HBW_INTRO_MS =
  HBW_T.spatial + HBW_T.continuity + HBW_T.ui + HBW_T.ui + HBW_T.ui + HBW_T.continuity + HBW_T.micro;
```

`HBW_INTRO_MS` evaluates to **2280** (380+520+240+240+240+520+140), matching `HBW_T.intro` and `--hbw-t-intro: 2280ms` (`hbw-home-prototype.css:72`).

CSS mirrors on `html.hbw-workspace` (`hbw-home-prototype.css:56–74`): `--hbw-ease`, `--hbw-motion-micro|ui|spatial|continuity`, aliases `--hbw-t-micro|ui|enter|exit|nav|spatial|handoff|gallery|fade|move|panel`. `--hbw-t-intro` is a **literal** `2280ms`, not an alias of a motion token.

`--hbw-t-*` used in CSS **property values** (not just definitions): `--hbw-t-nav` at 816, 825, 835, 870, 1045; `--hbw-t-enter` at 1244. Other `--hbw-t-*` names are defined and unused as property values in this file. Most transitions reference `--hbw-motion-*` directly.

Libraries: **no GSAP, no Framer Motion, no `motion/react`** under `src/`. Motion is CSS transitions/animations, WAAPI (`Element.animate`), View Transitions API, `requestAnimationFrame`, and `setTimeout` via `later()` in HbwShell.

### Distinct duration + easing pairs (CSS)

Token grammar in `hbw-home-prototype.css` (declaration-level counts from parse of `transition` / `animation`):

| Count | Duration | Easing |
|---:|---|---|
| 24 | `var(--hbw-motion-ui)` | `var(--hbw-ease)` |
| 14 | `var(--hbw-motion-micro)` | `var(--hbw-ease)` |
| 13 | `var(--hbw-motion-spatial)` | `var(--hbw-ease)` |
| 11 | `var(--hbw-motion-continuity)` | `var(--hbw-ease)` |
| 5 | `var(--hbw-t-nav)` | `var(--hbw-ease)` |
| 1 | `var(--hbw-t-enter)` | `var(--hbw-ease)` |
| 2 | `var(--hbw-motion-continuity)` | easing omitted on that decl |
| 1 | `var(--hbw-motion-spatial)` | omitted |
| 1 | `var(--hbw-motion-ui)` | omitted |

Literal / legacy pairs (`hbw-custom.css`, evolution, reduced-motion):

| Count | Duration | Easing |
|---:|---|---|
| 99 | `none` | `none` |
| 3 | `380ms` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 3 | `0.01ms` | reduced-motion override |
| 2 | `0.12s` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 2 | `0.2s` | `ease` |
| 1 | `1.1s` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 1 | `650ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 1 | `280ms` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 1 | `65ms` | `cubic-bezier(0.4, 0, 0.55, 1)` |

Custom `:root` also defines `--hbw-motion: 180ms` (`hbw-custom.css:33`); `--hbw-floatnav-tray-open-ms: 360ms`; `--hbw-floatnav-tray-close-ms: 560ms`; `--hbw-floatnav-tray-close-ease: cubic-bezier(0.22, 1, 0.36, 1)`; `--hbw-pill-ms: 240ms`; `--hbw-panel-swipe-duration: 380ms`; `--hbw-gallery-ease: cubic-bezier(0.22, 1, 0.36, 1)` (`hbw-custom.css:35–42`).

Intro stagger delays (not duration+easing pairs of the animated property): `280ms`, `640ms`, `1100ms` on `hbw-intro-in` (`hbw-home-prototype.css` ~448, 454, 462). `transition-delay` / `animation-delay` with `var(--hbw-motion-spatial)` at 653, 796.

`document.css`: no `transition` / `animation` / `@keyframes`.

### `@keyframes`

| File | Names |
|---|---|
| `hbw-home-prototype.css` | `hbw-intro-mark`, `hbw-intro-in`, `hbw-intro-present`, `hbw-intro-occupy`, `hbw-name-in`, `hbw-context-in`, `hbw-yield-out` |
| `webflow.css` | `spin` |

### What triggers workspace motion

CSS is class- and data-attribute-driven on `.hbw-home` (`HbwShell.tsx:1172–1189`): `is-make|browse|view`, `is-phase-{ViewPhase}`, `is-swap-{SwapPhase}`, `is-panel`, `is-inspect`, `is-studio`, `is-manifesto`, `is-sheet-leaving`, `is-sheet-restoring`, `is-practice-peek`, `is-owning`, `is-boundary`, plus `data-hbw-motion`, `data-hbw-from`, `data-hbw-to`, `data-hbw-origin`. Exact selector→property map is thousands of lines in `hbw-home-prototype.css` (4473 lines). Not every `is-phase-*` × property pair is enumerated here.

### JS motion sites

**WAAPI / FLIP**

| File | Lines | Behaviour |
|---|---|---|
| `HbwShell.tsx` | 81–85, 94–114 | `flipMark`: measure `.hbw-mark-word--rest`, invert with `el.animate([{ transform: translate(dx,dy) }, { transform: "none" }], { duration: ms, easing: HBW_EASE })`; cancels prior animations at 105 |
| `HbwShell.tsx` | 572, 609, 692, 762 | `flipMark` on make↔browse and view↔make |
| `ProjectView.tsx` | 27–41, 269–356 | Inspect open/close FLIP: invert translate+scale on `.hbw-mv`; CSS `transform ${HBW_T.spatial}ms var(--hbw-ease)` |

**View Transitions API**

| File | Lines | Behaviour |
|---|---|---|
| `HbwShell.tsx` | 245–263 | `runViewTransition`: `hbw-vt-spatial` / `hbw-vt-archive` on `<html>`, `document.startViewTransition` |
| `HbwShell.tsx` | 761, 822, 981–985 | cinematic enter; mobile handoff; Visual↔Index (`"archive"` envelope) |
| `Arrival.tsx` | 59–67 | intro resolve: names intro→mark |

CSS `::view-transition-*`: `hbw-home-prototype.css` 1964–2057, 2619–2629, 4458–4470. Group durations use `--hbw-motion-continuity` / `--hbw-motion-spatial`.

**rAF**

| File | Lines |
|---|---|
| `HbwShell.tsx` | 197 (browse scroll restore); 835–836, 893–894 (double-rAF before `assembling`) |
| `ProjectView.tsx` | 347–351, 414–424 |
| `PosterTool.tsx` | 171–174 visual viewport `--hbw-vv-inset` |

**IntersectionObserver**

| File | Lines |
|---|---|
| `MovementVideo.tsx` | 73–80 — play when ≥20% visible; pause otherwise |

**Scroll listeners**

| File | Lines |
|---|---|
| `HbwShell.tsx` | 471–477 capture-phase on `.hbw-projects` → `browseScrollRef` |
| `ProjectView.tsx` | 443–444, 602–606 inspect memory; index from scroll |
| `PosterTool.tsx` | 177 `visualViewport` scroll |

**Timers using `HBW_T`**

| File | Lines |
|---|---|
| `HbwShell.tsx` | 94, 235, 443 (`HBW_INTRO_MS`), 510, 548, 576–595, 615, 621, 667, 700, 748, 766, 770, 838, 896 |
| `Arrival.tsx` | 47–48, 78–79 |
| `ProjectView.tsx` | 86, 153, 186, 193, 349, 355, 419 |
| `ProjectsLayer.tsx` | 100 |
| `ProjectsNavPreview.tsx` | 204 |
| `IdentityNav.tsx` | 134 |

`later(ms, fn)` in HbwShell zeros durations when `reduceMotion()` (`HbwShell.tsx:222–224`).

**Other observers**

| File | Lines |
|---|---|
| `IdentityNav.tsx` | 75–76 `MutationObserver` on html class (`hbw-entered`, `hbw-nav-teach`) |
| `ProjectsNavPreview.tsx` | 66–68 `ResizeObserver` vs `.hbw-mark-by` |
| `ProjectView.tsx` | ~450 `ResizeObserver` on project root |

### Page / view transition orchestration

- **First visit `/`:** boot script adds `hbw-intro` (`hbw-workspace-boot.js:36`) and a **2800ms** fallback timeout (`hbw-workspace-boot.js:45`). `Arrival` runs CSS intro + View Transition. `HbwShell` `useLayoutEffect` completes intro after `HBW_INTRO_MS` (2280) (`HbwShell.tsx:437–444`). `sessionStorage` key `hbw.entered.v2` (`HbwShell.tsx:43`, boot `:30`).
- **Make ↔ browse:** `flipMark` + `swap` phases + `syncProjectsUrl` / `router.push`.
- **Browse/make → view:** optional `runViewTransition`, preload cap `HBW_T.prepareCap` (1400), `phase` rising → assembling → active.
- **View → view (next project):** `leaving` + `handoff-out` / `handoff-in` (`HbwShell.tsx:777–845`).
- **Sheets:** `panelLeaving` then `later(HBW_T.spatial)` (`HbwShell.tsx:497–517`).

Same properties (transform, opacity) are animated by CSS classes **and** WAAPI FLIP **and** View Transitions depending on the path. Identity words are the overlap: CSS intro keyframes, Arrival VT names, and `flipMark` WAAPI.

### Scroll-driven behaviour

No CSS `scroll-timeline`. Sticky: UNCERTAIN without a full `position: sticky` census; recovered floatnav and workspace header are `position: fixed` patterns in prototype CSS.

IntersectionObserver: one in workspace (`MovementVideo`). Recovered `hbw-runtime.js` contains additional observers (gallery, etc.) for non-workspace routes.

### `prefers-reduced-motion`

Respected:

- `reduceMotion()` (`motion.ts:25–27`) — HbwShell timers, ProjectView skips, MovementVideo autoplay off (`MovementVideo.tsx:36`), ProjectsNavPreview close delay 0, Arrival intro skip (`Arrival.tsx:28`).
- Boot: if reduce, set `hbw.entered` immediately (`hbw-workspace-boot.js:32–34`).
- CSS `@media (prefers-reduced-motion: reduce)` `hbw-home-prototype.css:3504–3578` — `transition/animation: none`, view-transition names cleared, intro opacity/transform reset.
- `hbw-custom.css:434–443`, `:1586` — `0.01ms` / `none` for recovered UI.
- `hbw-runtime.js:46` — skips body-fade if reduce.

Not a separate “ignore reduced motion” flag in workspace JS. UNCERTAIN whether every recovered IIFE in `hbw-runtime.js` checks the media query; several do, some UNCERTAIN without a full script audit.

`reference/motion/hbw-motion-map.md` documents intro **1400ms**. Runtime intro is **2280ms** (JS/CSS) and boot fallback **2800ms**. That is a documentation/runtime mismatch, not three simultaneous CSS animations.

---

## 8. State and interaction

### Module singleton + sessionStorage — `src/components/home/workspace.ts`

In-memory `workspace` (`workspace.ts:52–64`): `{ poster: PosterState, projects: ProjectsState, hydrated: boolean }`.

`ProjectsState` (`workspace.ts:39–47`): `open`, `mode` (`visual` \| `index`), `activeId`, `expandedId`, `filterDim`, `filterValue`, `sort`.

Session keys:

| Key | Content | Functions |
|---|---|---|
| `hbw.workspace.v2` | `{ poster, projects }` | `hydrateWorkspace` 66–94, `persistWorkspace` 96–112 |
| `hbw.workspace.v1` | legacy read fallback | `hydrateWorkspace:70` |
| `hbw.origin.v1` | `OriginFrame[]` | `persistOrigin` 122–129, `readOrigin` 157–167 |
| `hbw.projects.return` | `"1"` | `markReturnToProjects` / `consumeReturnToProjects` — **no callers** |
| `hbw.entered.v2` | `"1"` | boot + `completeIntro` (`HbwShell.tsx:68`) |
| `hbw.intro.media.v1` | removed on complete | `HbwShell.tsx:69` |
| `hbw.body.sessionInit` | recovered body fade | `hbw-runtime.js:47–64` |

`hydrateWorkspace` always sets `projects.open = false` (`workspace.ts:76`). Browse-open is not restored from session; URL `?layer=projects` and handlers set it.

### React state in `HbwShell`

Types: `WindowMode` `"make" \| "browse" \| "view"` (`workspace.ts:10`); `SwapPhase` `"idle" \| "preparing" \| "exiting" \| "entering"` (`motion.ts:23`); `ViewPhase` `"idle" \| "rising" \| "assembling" \| "active" \| "exiting" \| "handoff-in" \| "handoff-out"` (`ProjectView.tsx:11`); `WorkspacePanelId` `"studio" \| "info" \| null`; `StudioView` `"studio" \| "manifesto"`.

Named `useState` (initial sites ~128–210): `windowMode`, `phase`, `swap`, `panel`, `studioView`, `panelLeaving`, `panelRestoring`, `manifestoLeaving`, `browseMode`, `filterDim`, `filterValue`, `sort`, `activeId`, `hoveredId`, `expandedId`, `infoAnchor`, `viewIndex`, `leaving`, `heldSuffix`, `narrow`, `originKind`, `parkedX`, `peekProject`, `whyPeekLock`.

Refs: `originStack`, `motionLock`, `browseScrollRef`, `savedIndex`, `keepBrowse`, `entranceRef`, generation counters.

### Context — `WorkspaceContext.tsx`

Value written in HbwShell (`HbwShell.tsx:1159–1167`): `{ windowMode, openPanel, closePanel, panel, openProjects, closeProjects, returnToMake }`. Readers: `NavRegister` (`NavRegister.tsx:28`). Does not expose phase, swap, or origin.

### URL vs session vs component

| Lives in URL | Lives in session | Component / ref only |
|---|---|---|
| Pathname `/`, `/studio`, `/manifesto`, `/projects/:slug` | poster objects, projects mode/filter/sort/activeId/expandedId | `phase`, `swap`, `leaving`, hover, peek, motionLock |
| `?layer=projects` via `pushState` (not Next) | origin stack | `viewIndex` (also `savedIndex` ref per slug) |
| `?debugMotion=1` | `hbw.entered.v2` | browse scroll except when copied into an origin frame |

Studio vs manifesto is **both** URL (`/studio` vs `/manifesto`) and `studioView` state (`showManifesto` `router.replace("/manifesto")` at `HbwShell.tsx:520–525`).

Filter/sort are session + React, **not** in the URL. Refresh on `/` does not encode the lens in the query string.

### `windowMode` transitions (enforced in HbwShell)

`modeFromLocation` (`HbwShell.tsx:117–121`): project slug → `"view"`; `/` + `layer=projects` → `"browse"`; else `"make"`.

| From | To | Function | Lines |
|---|---|---|---|
| make | browse | `openProjects` | 557–584 |
| browse | make | `closeProjects` | 601–621 |
| * | view | `enterProject` | 706–774 |
| view | browse | `exitToProjects` | 649–677 |
| view | make | `homeFromView` | 680–703 |
| view | view | `commitNext`, `restoreProject` | 777–900 |

Guards: `motionLock.current`; `openProjects` if already in view/rising/assembling/active calls `exitToProjects` (559–561); `enterProject` stale-token vs `enterGen` (749); `commitNext` with no next project → `exitToProjects` (782–784); Escape (`HbwShell.tsx:1032–1055`): peek → panel → `closeToOrigin` → `closeProjects`.

### `phase` values set in HbwShell

| Phase | Example lines |
|---|---|
| idle | 312, 374, 579, 613, 669, 701, 876 |
| rising | 758, 890 |
| assembling | 768, 836, 894 |
| active | 312, 772, 830, 842, 876, 898 |
| exiting | 664, 695 |
| handoff-in | 819 |
| handoff-out | rendered on leaving `ProjectView` (`HbwShell.tsx:1356`) |

Pathname sync (`HbwShell.tsx:358–366`) does not overwrite in-flight `rising|assembling|active|exiting|handoff-in|handoff-out`.

### Origin stack

`OriginFrame` (`workspace.ts:26–37`): `{ kind: "make" }` \| browse snapshot (mode, id, filters, sort, scroll) \| `{ kind: "view"; slug; index; x? }`.

Back: `closeToOrigin` pops one frame (`HbwShell.tsx:903–929`). Close journey: `closeJourney` returns to `originStack[0]` (`932–956`). `showBack` when `originKind === "browse" \|\| originKind === "view"` and phase active (`HbwShell.tsx:1121–1122`).

### Filtering, sorting, view-mode

`matchesFilter` (`catalog.ts:194–201`): empty value or dim `"all"` → true; else equality on `year` / `sector` / `disciplines.includes` / `collaborators.includes`.

`sortProjects` (`catalog.ts:214–218`): `"newest"` sorts by `year` desc then name; `"az"` by name; **`"edited"` is identity** (catalog array order). No other branch.

Lens UI is not a dropdown of `filterValues`. Index rows expose `RelValue` buttons that call `onLens(dim, value)` (`ProjectsLayer.tsx:239–263`, 365–399). Visual mode uses the same `ArchiveItem`. `NavRegister` can clear the lens (`HbwShell.tsx:1286`).

Browse mode Visual ↔ Index: `setProjectsMode` + View Transition envelope `"archive"` (`HbwShell.tsx:968`, `981–985`).

Poster state is the module singleton mutated by `PosterTool` (`commitPoster` `PosterTool.tsx:48–51`), not React context.

---

## 9. Media

### `next/image` vs `<img>`

| Scope | `next/image` imports | `<img>` | `<video>` |
|---|---|---|---|
| `src/components/` | **0** | **8** | **2** |
| `src/` excluding `reference/` | **0** | recovered HTML adds the rest (~114 img / ~22 video including components) | |

`next.config.ts` still sets `images.unoptimized: true`. `PosterTool` imports `Image as ImageIcon` from Phosphor (`PosterTool.tsx:12`), not `next/image`.

Raw `<img>` in components:

| File | Line | Role |
|---|---|---|
| `WorkspacePanel.tsx` | 78 | Studio portrait `/practice/mark-blackler-studio.jpg` width 819 height 1024 |
| `ProjectsNavPreview.tsx` | 151 | Nav peek thumb |
| `ProjectsLayer.tsx` | 118 | Hover peek |
| `ProjectsLayer.tsx` | 208 | ArchiveThumb |
| `MovementVideo.tsx` | 108 | Poster |
| `MovementVideo.tsx` | 137 | Fallback when video not kept |
| `ProjectView.tsx` | 804 | Static movement image |
| `ProjectOutro.tsx` | 96 | Outro preview |

Raw `<video>`:

| File | Line |
|---|---|
| `ProjectsLayer.tsx` | 221 — browse hover autoplay |
| `MovementVideo.tsx` | 119 — movement film |

### Aspect ratio

Intrinsic width/height attributes on every component `img`/`video` listed above. CSS:

- Browse cells: `aspect-ratio: 4 / 5` and `16 / 9` (`hbw-home-prototype.css:2107–2122`, `2331`, `2757`).
- Movement: `aspect-ratio: var(--hbw-mv-ratio, auto)` (`:2698`, `:2806`, mobile `:3106`, `:4287–4349`).
- `object-fit` via classes `is-contain` / `is-cover` from `media.fit`.
- Crop: CSS variable `--hbw-crop` from `ArchiveMedia.crop` (`ProjectsLayer.tsx:335`).

### Video

Hosted in-repo under `public/projects/{folder}/web/*.mp4` and often `.webm`. Not a CDN. `preferSrc` (`MovementVideo.tsx:15–23`) prefers mp4 if `canPlayType("video/mp4")`, else webm; `onError` swaps once (`:88–103`).

Attributes: `playsInline`, `muted`/`loop` from media defaults, `preload={eager \|\| active ? "auto" : "metadata"}`, `disablePictureInPicture`, no controls. Autoplay gated by IntersectionObserver 0.2 and `reduceMotion()`.

`preload.ts`: `decodeImage` via `Image()` + `.decode()`; `prefetchVideo` via `fetch` force-cache; `preloadOpening` decodes stills and `-p-800`/`-p-1080` plus opening video within `withTimeout` / `HBW_T.prepareCap`.

Chris Sisarich `web/` also contains `.mov` on disk; experience film helpers point at mp4 paths (`experiences.ts:322` etc.).

### Asset locations

| Location | What |
|---|---|
| `public/projects/{slug}/` | Stills; `web/` for mp4/webm/jpg posters |
| `public/projects/bounce/` | Recovered “Coming Soon” only |
| `public/practice/` | Studio portrait |
| `public/identity/` | Favicon, brand jpg, SVG |
| `public/fonts/` | Type |
| `public/global/` | Shared stills + leftover video used by recovered HTML / OBR landscape (`experiences.ts:304`) |
| `public/collections/` | Collections recovered page |
| CMS | none |
| External CDN | Open-Meteo for weather only |

Folder `sub3` vs route id `sub-3`; folder `closed` vs id `bar-closed`.

---

## 10. Divergence report

### Same concept, more than one implementation

| Concept | Implementations | Which reads as newer / more considered |
|---|---|---|
| Site engine | React workspace (`HbwShell` + prototype CSS + `hbw-workspace-boot.js`) vs recovered Webflow (`RecoveredPage` + `hbw-runtime.js` + custom/evolution CSS) | Workspace: App Router client tree, typed catalog, motion tokens. Recovered: crawl-era HTML. Split is explicit in `isWorkspacePathname`. |
| Type tokens | `--hbw-lg` 0.9375rem / track 0.02em / lh 1.2 (`hbw-home-prototype.css`) vs `:root` `--hbw-font-size: 0.94rem` / `--hbw-ls: -0.01em` (`hbw-custom.css:20–21`) vs evolution `0.9rem` / `letter-spacing: 0.15px` vs Webflow px/em scale | Prototype tokens + `motion.ts` comments treating prototype as source of truth |
| Colour field | Token `--hbw-page/#ffffff` vs `document.css` `rgb(242, 236, 222)` vs recovered `#f75c4a` vs poster `PALETTE` | Workspace whites/yellows; recovered keeps Webflow reds |
| Radius | `--hbw-radius: 0px` vs `--hbw-radius: 999px` | Prototype last in cascade on workspace html; recovered pills still 999px |
| `--hbw-edge` | `12px` vs safe-area calc | Prototype on workspace |
| Motion grammar | 140/240/380/520 + cubic-bezier(0.4,0,0.2,1) vs custom 180ms, 0.22/1/0.36/1, 0.16/1/0.3/1, swipe 380ms | `motion.ts` + prototype `--hbw-motion-*` |
| Intro duration | 2280ms (`HBW_INTRO_MS`, `--hbw-t-intro`) vs 2800ms boot timeout vs 1400ms in `reference/motion/hbw-motion-map.md` | JS/CSS 2280 is what Arrival/HbwShell use; boot is a longer safety net |
| Project record | `PROJECTS` vs `PROJECT_EXPERIENCES` vs recovered HTML cards (includes Bounce) | Workspace uses TS modules; recovered home still lists Bounce Coming Soon |
| Slug lists | `MIGRATED_PROJECT_SLUGS`, `PROJECT_SLUGS`, boot `migrated`, `[slug]/page.tsx` if-chain | All six names; page.tsx inlines instead of importing the const |
| Font family application | `var(--hbw-font)` (custom) vs `Geist, sans-serif` literals (prototype) vs `system-ui` (custom popups) vs canvas `obj.font` | Workspace UI: literals; token unused in prototype |
| Geist `@font-face` | `document.css` (3 files) vs `hbw-custom.css` (1 file) | Both load; custom is redundant for workspace |
| Close / Back | Header Back + Close + Studio-as-Close (`HbwShell.tsx:1227–1311`) vs recovered floatnav Close | Workspace |
| Info copy | `sub3-info.ts` vs inline `KOJA_INFO` etc. vs catalog `credits` | Mixed; SUB:3 split out |
| Srcset builder | `catalog.set` vs `types.srcSetFor` | Parallel |
| Email/share | PosterTool POST `/api/hbw/email` vs unused `share.ts` POST `/api/hbw/share` vs recovered Webflow form in `home.html` | Adapters stubbed 503/501 |
| Runtime scripts | Concatenated `hbw-runtime.js` vs numbered `public/runtime/01-*.js` still on disk | HbwRuntime loads the three named files only |
| Images | Config for `next/image` vs raw `<img>` everywhere | Raw img is what components do |

### Top ten inconsistencies by extension friction

1. **Dual engines (workspace vs recovered).** A change to nav, type, or motion on `/` does not apply to `/projects` or `/collections`. `isWorkspacePathname` (`workspace-routes.ts:29–32`) is the gate.
2. **Dual CSS token systems (`html.hbw-workspace` vs `:root` in `hbw-custom.css`).** Same names (`--hbw-radius`, `--hbw-edge`, `--hbw-font-size`, `--hbw-ls`, `--hbw-ease`) with different values; cascade order is the only resolver.
3. **Dual motion grammars (140/240/380/520 vs 180ms / extra easings / swipe vars).** New animation can silently pick the wrong bezier if copied from custom CSS.
4. **Dual project records (catalog vs experiences vs recovered HTML).** Adding a project requires `PROJECTS`, `PROJECT_EXPERIENCES`, slug lists, `public/projects/` assets, and optionally recovered HTML. Bounce exists in only one of those.
5. **Close/Back ownership vs recovered floatnav.** Header Close behaviour is a state machine in HbwShell; recovered pages still have Webflow chrome.
6. **Type 15/400/0.02em vs 0.94rem/−0.01em vs 0.9rem.** Three body sizes sit in global CSS loaded on every route (`layout.tsx:4–9`).
7. **Intro clocks 2280 vs 2800 vs documented 1400.** Boot can cut or outlive the composed intro.
8. **`next/image` configured but unused.** `images.unoptimized: true` plus zero imports; all media is raw tags with srcSet strings.
9. **Stubbed email / share / recognise adapters.** Poster send hits 503 (`email/route.ts:20–29`); `share.ts` is dead; `recogniseStrokes` throws (`recognise.ts:19–22`). Recovered newsletter form is a third, unrelated path.
10. **Slug/folder/name mismatches** (`sub-3`/`sub3`, `bar-closed`/`closed`/`CLOSED`/`Bar Closed`, `credits`/`credit`). Easy to import the wrong string.

---

## 11. Rules already in play

### Written docs

No `.cursorrules`, `AGENTS.md`, `CLAUDE.md`, or `CONTRIBUTING*`.

`README.md` (quoted constraints):

- Line 1: `# HBW website — recovered baseline`
- Line 3: `Local reconstruction of the public site at https://www.hbw.works/. This is a fidelity baseline, not a redesign.`
- Lines 7–9: run with `npm install` then `npm run dev`
- Line 12: Open `http://localhost:3000`
- Lines 16–22: routes `/`, `/projects`, `/projects/sub-3` (and koja, bar-closed, our-boy-roy, chris-sisarich, bistro-nido), `/studio`, `/collections`, `/manifesto`, `/intake/start`
- Line 26: `See /reference for crawl notes, the asset manifest, and the fidelity report.`

`studio-copy.ts:1`: `/** Live Studio / Manifesto copy. Do not rewrite. */`

`recognise.ts:18`: `/** Scaffold only. No OCR package is wired; do not treat this as production recognition. */`

`sequence.ts:7`: `/** Next project in the authored portfolio. Nido has none — the sequence ends. */`

`motion.ts:1`: tokens should stay in sync with `hbw-home-prototype.css`.

`next.config.ts:5`: `agentRules: false`.

### Lint and formatter

No `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, or Prettier/ESLint packages in `package.json`. `package.json` scripts: `dev`, `build`, `start`, `crawl`, `recover` only.

### Observed naming

| Pattern | Examples | Breaks |
|---|---|---|
| `hbw-` prefix on CSS classes and custom properties | `.hbw-home`, `--hbw-lg` | Webflow classes in recovered HTML (`project-card-container`, `w-inline-block`) |
| `hbw.` prefix on sessionStorage | `hbw.workspace.v2`, `hbw.origin.v1` | |
| PascalCase React components | `HbwShell`, `ProjectView` | |
| kebab-case CSS | `.hbw-mark-word--rest` | BEM-ish `--` modifiers mixed with `is-*` state classes |
| kebab-case routes | `/projects/our-boy-roy` | asset folder `our-boy-roy` matches; `sub3` and `closed` do not match ids `sub-3` and `bar-closed` |
| `is-*` state classes | `is-phase-active`, `is-swap-entering` | |
| Catalog `credits` vs experience `credit` | `catalog.ts:26`, `types.ts:78` | |
| Display `CLOSED` vs id `bar-closed` vs title `Bar Closed` | `catalog.ts:84–86`, `pages.json:45` | |
| Pages.json extra spaces in titles | `Our Boy Roy  — HBW` | `pages.json:54` |
)
</agent_result>