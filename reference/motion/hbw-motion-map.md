# HBW motion map

One grammar. Every interaction has OUT / BEAT / IN, but not every interaction shows all three. One dominant event. Supporting opacity or blur must not compete.

Ease everywhere: `--hbw-ease` / `cubic-bezier(0.4, 0, 0.2, 1)`. No spring.

## Tokens

| Token | CSS | JS | Range | Use |
|---|---|---|---|---|
| micro | `--hbw-motion-micro: 140ms` | `HBW_T.micro` | 120–160 | hover, focus, labels, context chrome |
| ui | `--hbw-motion-ui: 240ms` | `HBW_T.ui` | 200–260 | lenses, toolbar state, gallery nudge |
| spatial | `--hbw-motion-spatial: 380ms` | `HBW_T.spatial` | 360–420 | Projects, Studio, Manifesto, Info, Visual↔Index |
| continuity | `--hbw-motion-continuity: 520ms` | `HBW_T.continuity` | 480–560 | project entry, project→project, return |

Legacy aliases `--hbw-t-*` map onto these four. They are not extra classes.

### Exceptions

- **Visual↔Index** is listed as Level 2 UI in the brief, but the dominant event is archive reorganisation. Duration is **spatial (380ms)**, inside the 320–400ms shared-object target. Lens clicks stay **ui (240ms)**.
- **Intro copy** uses `HBW_T.intro` / `--hbw-t-intro: 1400ms` plus staggered delays (280 / 640 / 1100ms). Not interaction grammar.
- **Preload budget** `HBW_T.prepareCap` (1400ms) is a wait cap, not a visual duration.
- **Sheet recede beat** is **micro (140ms)** rather than the suggested ~60ms, so the delay stays inside the four classes. Recede starts immediately; the sheet follows after micro.
- **FLIP cleanup** waits `spatial + 40ms`. The 40ms is a style-reset buffer after the visual duration, not a fifth class.
- **Reset confirm** in the tool expires at 4000ms. Safety timeout, not motion.
- **Unused showreel** CSS still has 650ms dissolve (`BrowseShowreel` is not mounted). Not part of the live grammar.
- **Legacy** `hbw-custom.css` / `hbw-evolution-*.css` retain old timings for the dormant Webflow surface. They do not drive the workspace.

## Interactions

### intro

| | |
|---|---|
| Trigger | First visit (no `hbw.entered.v2`) |
| From | Blank arrival |
| To | Home / Make, or Browse if that path is chosen |
| Dominant object | Arrival copy |
| Direction | None (opacity) |
| Duration token | ui (letterforms) / intro (sequence length) |
| Ease | `--hbw-ease` |
| Supporting opacity | Arrival fades on path choice |
| Supporting blur | None |
| State preserved | Session `hbw.entered.v2` |

### Home → Projects

| | |
|---|---|
| Trigger | Projects |
| From | Make (desk / tool mounted) |
| To | Browse overlay |
| Dominant object | Archive rising over the desk |
| Direction | Up from below the working area |
| Duration token | micro (toolbar settle) then spatial (archive) |
| Ease | `--hbw-ease` |
| Supporting opacity | Toolbar reduces; tool stays mounted and dormant |
| Supporting blur | None |
| State preserved | Poster, objects, decision text, tool family |

### Projects → Home

| | |
|---|---|
| Trigger | Projects (toggle) or How by Why |
| From | Browse overlay |
| To | Make |
| Dominant object | Archive resolving down |
| Direction | Down |
| Duration token | spatial |
| Ease | `--hbw-ease` |
| Supporting opacity | Toolbar returns |
| Supporting blur | None |
| State preserved | Poster remains; not remounted. Lens / sort persist in workspace |

### Visual → Index

| | |
|---|---|
| Trigger | Index |
| From | Visual archive |
| To | Index rows |
| Dominant object | Each project image contracting toward its thumbnail |
| Direction | Shared-element FLIP (scale + translate) |
| Duration token | spatial |
| Ease | `--hbw-ease` |
| Supporting opacity | Row metadata appears with the row |
| Supporting blur | None |
| State preserved | Selection, lens, sort, scroll intent |

### Index → Visual

| | |
|---|---|
| Trigger | Visual |
| From | Index rows |
| To | Visual archive |
| Dominant object | Thumbnail growing into archive geometry |
| Direction | Shared-element FLIP reverse |
| Duration token | spatial |
| Ease | `--hbw-ease` |
| Supporting opacity | Row metadata resolves away |
| Supporting blur | None |
| State preserved | Selection, lens, sort |

### filter / lens

| | |
|---|---|
| Trigger | Click year, discipline, collaborator, or the `{value} ×` chip |
| From | Current Index (or Visual membership) |
| To | Same architecture, subset by relationship |
| Dominant object | Membership of the list |
| Direction | None |
| Duration token | ui |
| Ease | `--hbw-ease` |
| Supporting opacity | Active lens chip; sort stays quieter |
| Supporting blur | None |
| State preserved | Mode, sort, architecture. No second filter system |

### Projects → Project

| | |
|---|---|
| Trigger | Click archive cell / row |
| From | Browse |
| To | View |
| Dominant object | Selected tile. Other tiles quieten to ~0.35 |
| Direction | Selected work assumes the stage (rise) |
| Duration token | micro (quiet others) then continuity (ownership) |
| Ease | `--hbw-ease` |
| Supporting opacity | Unselected archive 0.35; selected stays 1 |
| Supporting blur | None |
| State preserved | Portfolio origin (mode, lens, sort, id). URL updates during transfer |

### Project → Projects

| | |
|---|---|
| Trigger | Close, when origin is browse or empty |
| From | View |
| To | Browse overlay |
| Dominant object | Project resolving down; archive already underneath |
| Direction | Down |
| Duration token | continuity |
| Ease | `--hbw-ease` |
| Supporting opacity | Archive visible throughout |
| Supporting blur | None |
| State preserved | Origin lens / mode / sort restored. Tool still mounted |

### project → project

| | |
|---|---|
| Trigger | Click / tap next project at the threshold. Never auto |
| From | Current View (last movement + pause + next identity) |
| To | Next View |
| Dominant object | Next project's boundary media taking space |
| Direction | Incoming object from the right; current resolves behind it |
| Duration token | continuity |
| Ease | `--hbw-ease` |
| Supporting opacity | Current 0.45; next 0.55→1. No full-page fade |
| Supporting blur | None |
| State preserved | Portfolio origin is not overwritten |

### Info open

| | |
|---|---|
| Trigger | Info |
| From | Horizontal desktop gallery (mobile already vertical) |
| To | Reading: vertical gallery column + yellow sheet |
| Dominant object | Information sheet entering; current movement stays the anchor |
| Direction | Sheet from the right. Gallery reorganises vertically (FLIP) |
| Duration token | spatial (sheet delayed by micro) |
| Ease | `--hbw-ease` |
| Supporting opacity | None on the gallery |
| Supporting blur | None |
| State preserved | Active movement index. Independent scroll: gallery vs sheet |

### Info close

| | |
|---|---|
| Trigger | Close (same control) |
| From | Reading split |
| To | Horizontal gallery (desktop). Mobile stays vertical |
| Dominant object | Sheet exiting right; current / nearest media remains |
| Direction | Sheet right. Gallery FLIP back to horizontal X for that movement |
| Duration token | spatial |
| Ease | `--hbw-ease` |
| Supporting opacity | None |
| Supporting blur | None |
| State preserved | Nearest movement, not movement 01 |

### Studio

| | |
|---|---|
| Trigger | Studio |
| From | Current window |
| To | Global sheet from the right |
| Dominant object | Yellow InformationSheet |
| Direction | Right → in |
| Duration token | spatial, delayed micro after recede |
| Ease | `--hbw-ease` |
| Supporting opacity | Underlying site 0.45 |
| Supporting blur | None |
| State preserved | Window mode, project, poster |

### Manifesto

| | |
|---|---|
| Trigger | Manifesto link inside Studio, or `/manifesto` |
| From | Studio sheet or current window |
| To | Global sheet from the left |
| Dominant object | Yellow InformationSheet |
| Direction | Left → in |
| Duration token | spatial |
| Ease | `--hbw-ease` |
| Supporting opacity | Underlying site 0.45 |
| Supporting blur | None |
| State preserved | Studio panel remains open; nav still says Close |

### Studio ↔ Manifesto

| | |
|---|---|
| Trigger | Manifesto / Studio links inside the sheet |
| From | One global sheet |
| To | The other global sheet |
| Dominant object | Shared lateral sheet family |
| Direction | Right ↔ left, not close-then-open |
| Duration token | spatial |
| Ease | `--hbw-ease` |
| Supporting opacity | Underlying site stays receded |
| Supporting blur | None |
| State preserved | Panel = studio. Close still belongs to the Studio control |

### tool context

| | |
|---|---|
| Trigger | Write / Add / Draw, or selecting an object |
| From | Permanent chrome (Write Add Draw, decision, Send, Undo, Reset) |
| To | One context surface |
| Dominant object | The context cluster as a single surface |
| Direction | 3px resolve |
| Duration token | ui |
| Ease | `--hbw-ease` |
| Supporting opacity | Cluster opacity |
| Supporting blur | None |
| State preserved | Poster, selection, family |

### Send tray

| | |
|---|---|
| Trigger | Send |
| From | Composing tool |
| To | Compact send tray (email, optional name, Email / WhatsApp / Download) |
| Dominant object | Tray as one surface. Poster stays visible |
| Direction | 3px resolve |
| Duration token | ui |
| Ease | `--hbw-ease` |
| Supporting opacity | Tray |
| Supporting blur | None |
| State preserved | Composition. No Freeze. Email collected only here. WhatsApp uses `sharePoster()` / truthful note |
