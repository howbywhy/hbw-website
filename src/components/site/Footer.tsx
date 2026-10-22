"use client";

/**
 * The end of the page, and the one thing worth asking for there.
 *
 * Someone who has scrolled a whole body of work is the best-disposed reader
 * the site will ever have, and the footer was three grey links. It now says
 * who this is, where, and offers the one thing that costs a visitor nothing
 * and is worth something later: an address to write to when there is
 * something to say.
 *
 * It asks for an email and promises nothing it cannot keep — no frequency it
 * would have to honour, no "newsletter" that does not exist yet. And it never
 * claims to have signed someone up unless the server says it did.
 */
import { useId, useState } from "react";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_E164, STUDIO_PLACE } from "@/lib/contact";
import { PROFILES } from "@/lib/structured-data";

type State = "rest" | "sending" | "done" | { error: string };

export function Footer({ line = false }: { line?: boolean }) {
  /*
   * A field of its own, so there can be more than one foot on a page.
   *
   * The front page runs as a loop of three identical turns, and the foot now
   * sits in each of them — so a hard-coded id would have put three inputs
   * under one name and sent every label to the first of them.
   */
  const field = useId();
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<State>("rest");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending" || state === "done") return;
    setState("sending");
    try {
      const reply = await fetch("/api/hbw/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, trap }),
      });
      const data = (await reply.json()) as { ok?: boolean; reason?: string };
      setState(data.ok ? "done" : { error: data.reason || "That did not go through." });
    } catch {
      setState({ error: "That did not go through." });
    }
  }

  return (
    <footer className={line ? "hbw-end hbw-end--line" : "hbw-end"}>
      <div className="hbw-end__who">
        {/*
          The positioning line is not said twice.
          
          It was here because the foot is a long way from the nav — but the
          nav is fixed, so it is never off the screen and never further away
          than the top of the window. Two statements of the same sentence a
          few hundred pixels apart is one of them doing nothing.
        */}
        <p className="is-mute">{STUDIO_PLACE}</p>
      </div>

      <div className="hbw-end__loop">
        {state === "done" ? (
          <p className="is-mute">Thank you — you are on the list.</p>
        ) : (
          /*
            One row, in the shape every other row in here has.
            
            It was a label, then a field, then a button, stacked three deep
            and sixty-two pixels tall beside a column of twenty-four pixel
            rows — the one thing in the foot that was not an object two
            pixels from the next. Said across, it is a label and a value and
            a way to act on it, which is the same shape as the facts in a
            project and the ways out underneath it.
          */
          <form onSubmit={send} className="hbw-end__field">
            <label htmlFor={field} className="hbw-m">
              Stay in the loop
            </label>
            <input
              id={field}
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Sending" : "Join"}
            </button>
            {/* Not shown to anyone, and filled in by crude bots. */}
            <input
              className="hbw-end__trap"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={trap}
              onChange={(event) => setTrap(event.target.value)}
            />
            {typeof state === "object" ? <p className="hbw-end__said">{state.error}</p> : null}
          </form>
        )}
      </div>

      {/*
        The studio elsewhere, linked rather than only declared.
        
        Both profiles were already in the structured data's sameAs, which is a
        machine-readable claim that these accounts are the same studio — and a
        claim is all it was: neither was reachable from any page on the site.
        Read from the same list, so the two can never drift apart.
      */}
      <nav className="hbw-end__to" aria-label="Elsewhere">
        {/*
          Ways out of the site, not around it.
          
          Work and Practice were here as well as in the bar two pixels above,
          which made a six-item column of which the first two went where the
          nav already goes. What is left is the four this row is for: the
          address, the number, and the studio elsewhere.
        */}
        {/*
          In a line, the address and the two profiles; the number stays in
          About.
          
          This dropped the address as well, on the argument that both it and
          the number are a press away in About. That argument held while the
          line was the foot of a page. It is not a foot any more: it is the
          inside of the Talk bar, the one row a reader opens *because* they
          want to reach the studio. Leaving the address out of it meant the
          front page had no way to get in touch anywhere on it — the exact
          fault the foot was added to fix, returned by a different door. The
          number is still a press away, and a telephone is not what this row
          is for.
        */}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        {line ? null : <a href={`tel:${CONTACT_PHONE_E164}`}>{CONTACT_PHONE}</a>}
        {PROFILES.map((profile) => (
          /*
           * noreferrer as well as noopener.
           *
           * LinkedIn reads the referer on the way in and stamps it into
           * the sign-in wall it shows a logged-out visitor —
           * original_referer=https://www.hbw.works/ — so a press on the
           * studio's own profile announced where it came from and then
           * asked the reader to sign in. The wall is LinkedIn's own
           * behaviour and not something a link can refuse, but telling it
           * nothing is the part that is ours. rel="me" still stands: it is
           * the claim that this profile is this studio, which is also what
           * sameAs says in the structured data.
           */
          <a key={profile.url} href={profile.url} rel="me noopener noreferrer" target="_blank">
            {profile.name}
          </a>
        ))}
      </nav>
    </footer>
  );
}
