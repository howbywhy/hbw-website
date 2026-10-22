/**
 * A page sends what it draws.
 *
 * Every page used to be handed the whole catalogue — seven projects, nine
 * frames each, every frame carrying the three-rendition ladder a contact
 * sheet cell needs — because a prop given to a client component is
 * serialised into the payload whether or not anything renders it.
 *
 * No page on the site draws one of those ladders. The front page is the
 * index and prints no catalogue at all; a project page prints the strip
 * behind a gallery that covers the window and cannot be shut, where every
 * cell is deliberately given no source. Sixty-three ladders of addresses
 * for pictures nobody asks for: the front page was 107KB and every case
 * study was over 150.
 *
 * This measures the document a visitor is actually sent, which is the only
 * number that matters here — not the pictures, which arrive afterwards and
 * only if something asks for them.
 *
 * It is a ceiling, not a record of what the pages weigh today. The front
 * page is 61KB and the heaviest case study 147KB; the budgets below leave
 * room to add work without failing, and would fail again at the weights
 * this was written for.
 */
import { BASE, sheet } from "../lib.mjs";

const PAGES = [
  "/",
  "/practice",
  "/projects/made-by-madelen",
  "/projects/sck",
  "/projects/sub-3",
  "/projects/bar-closed",
  "/projects/koja",
  "/projects/chris-sisarich",
  "/projects/our-boy-roy",
];

/** What the site check asks for, and what every page is now inside. */
const CEILING_KB = 150;

const kb = (text) => Math.round(Buffer.byteLength(text, "utf8") / 1024);
const count = (text, what) => (text.match(new RegExp(what, "g")) || []).length;

export default async function run() {
  const s = sheet("a page sends what it draws");

  const heavy = [];
  let worst = 0;
  for (const path of PAGES) {
    const html = await fetch(BASE + path).then((r) => r.text());
    const size = kb(html);
    if (size > worst) worst = size;
    if (size > CEILING_KB) heavy.push(`${path} ${size}KB`);
  }
  s.ok(
    `every page's document is under ${CEILING_KB}KB`,
    heavy.length === 0,
    heavy.length ? heavy.join(", ") : `${PAGES.length} pages, heaviest ${worst}KB`
  );

  /*
   * And the reason it is under it, so a regression says what it was.
   *
   * A page that starts shipping the catalogue's ladders again would creep
   * back over the ceiling one project at a time, and the row above would
   * only say "too big". These two say which thing came back.
   */
  const front = await fetch(BASE + "/").then((r) => r.text());
  const ladders = count(front, "srcset");
  s.ok(
    "the front page sends one frame per project, not nine",
    ladders <= 12,
    `${ladders} srcset strings (it was 63; seven leads and a little else is right)`
  );

  const project = await fetch(BASE + "/projects/koja").then((r) => r.text());
  const cells = count(project, "hbw-cell");
  const cellLadders = count(project, "160w");
  s.ok(
    "a project still prints its strip",
    cells > 20,
    `${cells} cells behind the gallery`
  );
  s.ok(
    "but sends no ladder for a cell that never asks for a picture",
    cellLadders <= 8,
    `${cellLadders} contact-sheet ladders (it was 63)`
  );

  return s;
}
