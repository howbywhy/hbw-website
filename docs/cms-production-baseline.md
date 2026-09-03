# HBW CMS Production Baseline

Production code baseline: `fc8b81ab9e8c4e28fb00cd141d91a487522c92d3`

Sanity manages case-study content.  
The local catalog manages portfolio browsing and curation.  
Frontend code owns presentation and interaction.

This is the production split. Do not invert it.

## 1. Architecture

### Browse

Source: `src/components/home/catalog.ts`

`PROJECTS` / `liveProjects()` own:

- active projects
- public order
- proposition
- year
- thumbnails
- Visual placement
- Home first-five (`homePreviewProjects()` = `liveProjects().slice(0, 5)`)
- routing metadata
- sectors, disciplines, credits, collaborators, features

Continue walks the same catalog order via `src/components/home/sequence.ts`.

CMS `portfolioOrder` does not control the public portfolio.

### Case studies

Source path:

`src/lib/cms-source.ts`  
→ `src/lib/project-source.ts` (`resolveProjectExperience`)  
→ `src/sanity/load-published.ts`  
→ published Sanity project document (`src/sanity/scripts/fetch-sck.ts`)  
→ adapter (`src/sanity/adapter/map.ts`)  
→ `ProjectExperience`

Public injection is SSG-only, in `src/app/projects/[slug]/layout.tsx`.

Sanity owns:

- Context
- Role
- Working Context
- With
- Idea
- Shift
- System
- Outcome where present
- movements
- media
- alt, scale, pace, relation, infoHint
- supported presentation overrides (Narrow, Cover, Graphic)

### Presentation

Frontend code owns:

- masthead
- project chrome
- yellow Info layer
- gallery
- sequence and pair behaviour
- spacing
- typography
- interaction
- Continue progression

Sanity must not become a page builder.

Published production reads use project `aagd1kcy`, dataset `production`, perspective `published`, and no secret token. Do not add a Sanity read token for public SSG.

## 2. Active Portfolio

Catalog order:

1. SCK — `/projects/sck` — CMS slug `sck`
2. CLOSED — `/projects/bar-closed` — CMS slug `closed`
3. KOJA — `/projects/koja` — CMS slug `koja`
4. SUB:3 — `/projects/sub-3` — CMS slug `sub-3`
5. Chris Sisarich — `/projects/chris-sisarich` — CMS slug `chris-sisarich`
6. Our Boy Roy — `/projects/our-boy-roy` — CMS slug `our-boy-roy`

Progression:

SCK → CLOSED → KOJA → SUB:3 → Chris Sisarich → Our Boy Roy → SCK

Home first-five:

SCK, CLOSED, KOJA, SUB:3, Chris Sisarich

Our Boy Roy is sixth and therefore omitted from the Home first-five.

Bistro Nido is retired and archive-only.

CLOSED is the existing slug-alias pattern: public route `bar-closed`, CMS slug `closed`. Mapping lives in `src/lib/cms-source.ts`.

Published document IDs:

- `project-sck`
- `project-closed`
- `project-koja`
- `project-sub3`
- `project-chris-sisarich`
- `project-our-boy-roy`

How a project reaches production:

catalog order and route → Sanity document → preview outside production → Production flag `sanity` → SSG rebuild of current main. Browse never waits on Sanity.

## 3. Production Source Flags

Names only:

- `HBW_SCK_SOURCE`
- `HBW_CLOSED_SOURCE`
- `HBW_KOJA_SOURCE`
- `HBW_SUB3_SOURCE`
- `HBW_CHRIS_SOURCE`
- `HBW_OBR_SOURCE`

Production value: `sanity`

Behaviour:

- exactly `sanity` → published Sanity source
- missing or any other value → local fallback

Flags are evaluated at build time because public project routes are SSG (`force-static`). Changing a flag without a production rebuild does not change live HTML.

A Sanity fetch or adapter failure also falls back to the local experience.

Registry: `src/lib/cms-source.ts`. Comments: `.env.example`.

## 4. Existing Case-Study Editing

Normal workflow:

1. Edit published content in Sanity.
2. Preview outside production (`/preview/...`).
3. Verify copy, sequence, and media.
4. Publish.
5. Trigger a production rebuild of current main.
6. Smoke the affected public route.

Can be edited without product-code changes:

- Context, Role, Working Context, With
- Idea, Shift, System, Outcome
- movement order and count
- supported still/film assets and posters
- alt, scale, pace, relation, infoHint
- Narrow / Cover / Graphic overrides

Publishing Sanity alone does not update existing SSG HTML. A production rebuild is required.

Leave Outcome empty when the case study has no evidenced outcome. Do not invent authorship.

## 5. Adding a New Case Study

Do not create another CMS architecture. Extend the existing per-project pattern.

Workflow:

EVIDENCE  
→ approved rationale/copy  
→ local catalog entry  
→ local rollback experience  
→ CMS source registration  
→ Sanity document  
→ preview  
→ parity/QA  
→ Production source flag  
→ rebuild/deploy

Implementation points:

- `src/components/home/catalog.ts` — add the public `ProjectRecord`. Array order is public order and Continue.
- `src/components/home/projects/experiences.ts` — add the shipped local rollback experience.
- `src/lib/cms-source.ts` — add `{ routeSlug, cmsSlug, envKey, label }`.
- `src/lib/project-source.ts` — add the env helper if the existing pattern requires it.
- `.env.example` — document the new flag.
- `src/sanity/load-published.ts` — add `catalogOwned*` chrome and the published-slug branch.
- `src/sanity/scripts/{slug}-content.ts`
- `src/sanity/scripts/seed-{slug}.ts` and `npm run cms:seed-{slug}`
- `src/sanity/scripts/verify-{slug}-cms.ts` and `npm run test:{slug}-cms`
- `src/sanity/preview/load-{slug}.ts`
- `src/app/preview/{cmsSlug}/page.tsx`
- `src/lib/ssg-payload.ts` plus tests — route containment

If public and CMS slugs differ, follow CLOSED: keep the alias in `cms-source.ts`. Do not invent a second mapping system.

The public route is already `src/app/projects/[slug]`. `generateStaticParams` uses `PROJECT_SLUGS` from the catalog. `dynamicParams` is false. No new case-study layout is required.

## 6. Preview

Routes:

- `/preview/sck`
- `/preview/closed`
- `/preview/koja`
- `/preview/sub-3`
- `/preview/chris-sisarich`
- `/preview/our-boy-roy`

Preview:

- loads published Sanity
- ignores public source flags
- is available in local development and Vercel Preview
- returns 404 in production

Gate: `src/sanity/preview/allowed.ts` (`VERCEL_ENV === "production"` → blocked).

Studio: `npm run cms`.

## 7. Rollback

Production rollback:

1. Remove or change the six Production `HBW_*_SOURCE` flags away from `sanity`.
2. Rebuild current main.
3. Redeploy.

Rollback does not require:

- reverting code
- reverting the CMS merge
- deleting Sanity documents
- reverting schema
- rewriting project content

Local experiences in `src/components/home/projects/experiences.ts` remain the rollback source.

## 8. Testimonials

An optional Testimonials schema exists. It is storage-only.

- not selected by public GROQ (`PROJECT_BY_SLUG_QUERY`)
- not mapped by the adapter
- not rendered in Info or anywhere else

Rendering Testimonials is a future product decision and requires code.

## 9. Retired Projects

Bistro Nido:

- retained locally as archive (`NIDO_EXPERIENCE` in `experiences.ts`)
- assets retained under `public/projects/bistro-nido/`
- not in `PROJECTS`
- not CMS-backed
- no source flag
- no preview
- public route 404

Do not delete archived source merely because it is not public.

## 10. What Requires Code

These are not ordinary CMS edits:

- new layout behaviour
- new movement behaviour
- new schema fields
- Browse ordering / curation
- thumbnails / Visual placement
- Home selection logic
- navigation / Continue rules
- typography
- visual system
- Testimonials rendering
- source registration for a new project
- retiring or restoring a project
- production preview policy

## 11. Verification

Standard checks:

```bash
npm test
npx tsc --noEmit
npx sanity schemas validate
npx next build
```

For project or source changes, also:

- relevant `npm run test:{slug}-cms`
- local and Sanity SSG builds
- SSG route present; Nido absent
- payload containment (`src/lib/ssg-payload.ts`)
- Info layer (CMS factual/editorial when flags are `sanity`)
- sequence and media
- Continue progression
- production `/preview/*` → 404

## 12. Known Non-Blocking Debt

- `README.md` is stale
- `docs/engine-audit.md` is pre-CMS
- `homeSelected` exists but Home uses first-five
- CLOSED public/CMS slug alias
- CMS `portfolioOrder` unused publicly
- per-project source/seed/verify wiring is repetitive
- Testimonials storage-only
- rollback experiences contain older editorial copy
- known CLOSED/KOJA presentation-neutral dimensions
- known Visual/Index pointer-events overlay

These are not CMS production defects.
