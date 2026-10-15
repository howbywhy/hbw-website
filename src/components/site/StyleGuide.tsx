"use client";

/**
 * The system, read off the site rather than written down beside it.
 *
 * A style guide that restates its values in prose is a second source of
 * truth, and the moment the stylesheet moves it starts lying. This one asks
 * the live document what each token currently is, so it cannot drift: change
 * a value in the stylesheet and this page changes with it.
 *
 * It is here to be read by something that is not a person — another model, a
 * tool, a generator building something that has to sit alongside this site —
 * so it carries three things: the tokens as they actually resolve, specimens
 * showing what they make, and the rules that are decisions rather than
 * values. The machine-readable block at the foot is the same data again, in
 * one object, for anything that would rather parse than read.
 */

import { useEffect, useRef, useState } from "react";

const COLOUR = ["--paper", "--ink", "--mute", "--say", "--rule", "--pill-bg", "--pill-on", "--chip"];
const SPACE = ["--edge", "--gut", "--pill-gap", "--pill-x", "--pill-h", "--pill-r", "--module"];
const TYPE = ["--nav", "--meta", "--t-small", "--t-mid", "--t-big", "--read", "--line-h", "--mark-h"];
const MOTION = ["--in", "--out", "--quick", "--ease", "--rise"];

/** Every rule on this site that is a decision rather than a measurement. */
const RULES = [
  {
    id: "field",
    says: "One field, everywhere",
    body:
      "Every control and every piece of information wears the same field: --pill-bg, a --pill-r corner, and a backdrop blur of 14px at 160% saturation. There is no second button style. The chosen one of a set is told apart by its ink — full --ink against the others' --mute — never by a different field and never by going white.",
  },
  {
    id: "two",
    says: "Two pixels, in both directions",
    body:
      "--edge is the distance between any two things and between anything and the edge of the window: across and down, chrome and work, phone and desktop. --gut remains for spacing inside a thing, which is a different question. A container must not keep its gap when the thing below it is empty; that reads as four.",
  },
  {
    id: "white",
    says: "Nothing that opens over the work is white",
    body:
      "A panel over the work takes the field and the blur, so the work behind becomes the texture. White at any opacity, with saturation turned down, is a sheet of paper by another name — however transparent the number says it is.",
  },
  {
    id: "crop",
    says: "No picture is ever cropped",
    body:
      "Cells take the shape of their picture, or the picture is contained within the cell. object-fit: cover appears nowhere a frame of the work is shown. A grid works out its own arrangement from how many frames there are and the shape of the room, so the whole set is on one screen without cutting anything.",
  },
  {
    id: "sequence",
    says: "Every opening has a closing, and both are moves",
    body:
      "Anything that arrives on an animation leaves on one. The work makes room first and the reading arrives into it, delayed by the length of that move, so one reads as the cause of the other. Changing view is a move, not a cut: each frame is measured where it was, put back, and released.",
  },
  {
    id: "contrast",
    says: "Contrast is measured from painted pixels",
    body:
      "Glass composites against whatever is behind it, so a computed colour proves nothing. Reading over the work holds at least 4.5:1 sampled from the rendered page, on the darkest project in the catalogue.",
  },
  {
    id: "still",
    says: "Less movement means none",
    body:
      "Under prefers-reduced-motion: reduce nothing animates and no film plays — including films already running when the preference arrives, which autoPlay alone does not stop. Animation fill-mode is backwards, never both: both holds a property under animation control for good and no transition on it can ever run.",
  },
  {
    id: "measure",
    says: "Measure layout, not paint",
    body:
      "Positions read during an arrival give the animation's place, not the element's. Anything the layout depends on is taken from offsetTop and the computed padding, which transforms cannot move.",
  },
];

type Token = { name: string; value: string };

/*
 * Read where the page is, not at the root of the document.
 *
 * Most of these are declared further down than :root — the ink and the
 * paper on the site's own wrapper, the gutter with them — so asking the
 * document element returns nothing for them. Asking an element inside the
 * page gets every value as it actually resolves there, inherited ones
 * included, which is the number a reader of this page needs.
 */
function read(names: string[], from: Element | null): Token[] {
  if (typeof window === "undefined" || !from) return [];
  const here = getComputedStyle(from);
  return names
    .map((name) => ({ name, value: here.getPropertyValue(name).trim() }))
    .filter((token) => token.value.length > 0);
}

export function StyleGuide() {
  const [groups, setGroups] = useState<Record<string, Token[]>>({});
  const here = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const from = here.current;
    setGroups({
      colour: read(COLOUR, from),
      space: read(SPACE, from),
      type: read(TYPE, from),
      motion: read(MOTION, from),
    });
  }, []);

  const all = Object.values(groups).flat();

  return (
    <div className="hbw-sys" ref={here}>
      <header className="hbw-sys__head">
        <h1 className="hbw-sys__name">How by Why — system</h1>
        <p className="hbw-sys__says">
          The tokens below are read from this page as it renders, not written down beside it, so they
          are always what the site is actually using. The rules are the decisions the values do not
          carry.
        </p>
        <p className="hbw-sys__says">
          One caveat worth having: a token is shown as it resolves <em>here</em>. Several are
          redeclared further in — the gallery takes its own pill field over a dark plate, the type
          scale shifts inside a project — so two that read alike on this page are not necessarily
          alike everywhere. Where that matters, the rule beneath says so.
        </p>
      </header>

      {[
        ["colour", "Colour"],
        ["space", "Space"],
        ["type", "Type"],
        ["motion", "Motion"],
      ].map(([key, title]) => (
        <section className="hbw-sys__part" key={key}>
          <h2 className="hbw-sys__title">{title}</h2>
          <dl className="hbw-sys__tokens">
            {(groups[key] ?? []).map((token) => (
              <div className="hbw-sys__token" key={token.name}>
                <dt>
                  <code>{token.name}</code>
                </dt>
                <dd>
                  <code>{token.value}</code>
                  {key === "colour" ? (
                    <span className="hbw-sys__swatch" style={{ background: `var(${token.name})` }} />
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="hbw-sys__part">
        <h2 className="hbw-sys__title">Specimens</h2>
        <div className="hbw-sys__shelf">
          <div className="hbw-sys__case">
            <p className="hbw-sys__label">A control</p>
            <span className="hbw-sys__pill">Information</span>
            <span className="hbw-sys__pill is-on">Information</span>
          </div>
          <div className="hbw-sys__case">
            <p className="hbw-sys__label">A row of chrome</p>
            <div className="hbw-sys__row">
              <span className="hbw-sys__pill">Home</span>
              <span className="hbw-sys__pill is-on">How by Why</span>
              <span className="hbw-sys__pill">Studio</span>
            </div>
          </div>
          <div className="hbw-sys__case">
            <p className="hbw-sys__label">A module</p>
            <div className="hbw-sys__module">
              <p>
                A piece of information is an object: the field, the corner, and two pixels from the
                next one.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hbw-sys__part">
        <h2 className="hbw-sys__title">Rules</h2>
        <dl className="hbw-sys__rules">
          {RULES.map((rule) => (
            <div className="hbw-sys__rule" key={rule.id}>
              <dt>{rule.says}</dt>
              <dd>{rule.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/*
        The same thing again, in one object.

        Anything generating work that has to sit alongside this site can take
        this instead of reading the page: the tokens as they resolved in a
        real browser, and the rules with them.
      */}
      <script
        type="application/json"
        id="hbw-system"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              name: "How by Why",
              tokens: Object.fromEntries(all.map((token) => [token.name, token.value])),
              rules: RULES.map((rule) => ({ id: rule.id, says: rule.says, body: rule.body })),
            },
            null,
            2,
          ),
        }}
      />
      <noscript>
        <p>The tokens on this page are read from the live document and need scripting to appear.</p>
      </noscript>
    </div>
  );
}
