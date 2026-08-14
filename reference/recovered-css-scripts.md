# Recovered CSS and scripts

## CSS

| Source | Local |
|---|---|
| Webflow shared | `reference/css/66587cf3c4f4a7905421e299/css/hbw-d99eae.webflow.shared.c5807c079.min.css` → `src/styles/webflow.css` (URLs rewritten) |
| Unique inline blocks (25) | `reference/css/inline/` → concatenated `src/styles/hbw-custom.css` |
| Local font/canvas extras | `src/styles/document.css` |

## Scripts

Webflow JS + jQuery are in `reference/scripts-recovered/` and **are not executed** by the app.

Unique inline scripts (26) are in `public/runtime/01-…26-*.js` and concatenated to `public/runtime/hbw-runtime.js`.

See `src/recovered/runtime/scripts.json` for source filename ↔ runtime file mapping.
