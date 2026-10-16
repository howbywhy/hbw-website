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

type State = "rest" | "sending" | "done" | { error: string };

export function Footer() {
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
    <footer className="hbw-end">
      <div className="hbw-end__who">
        {/* The footer is a long way from the nav, so it says the whole thing. */}
        <p>How by Why — clarity for brands at a turning point.</p>
        <p className="is-mute">{STUDIO_PLACE}</p>
      </div>

      <div className="hbw-end__loop">
        {state === "done" ? (
          <p className="is-mute">Thank you — you are on the list.</p>
        ) : (
          <form onSubmit={send}>
            <label htmlFor={field}>Stay in the loop</label>
            <div className="hbw-end__field">
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
            </div>
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

      <nav className="hbw-end__to" aria-label="Elsewhere">
        <a href="/">Work</a>
        <a href="/practice">Practice</a>
        <a href="/talk">Talk</a>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <a href={`tel:${CONTACT_PHONE_E164}`}>{CONTACT_PHONE}</a>
      </nav>
    </footer>
  );
}
