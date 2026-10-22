"use client";

import { useId, useState } from "react";
import { CONTACT_EMAIL } from "@/lib/contact";

type State = "rest" | "sending" | "done" | { error: string; write?: string };

/**
 * Writing to the studio, from inside the bar that says Talk.
 *
 * The front page's last bar opens to the ways of reaching the studio, and
 * until now every one of them was somewhere else: an address to copy, a
 * newsletter that is not a conversation, two profiles. This is the one that
 * is not somewhere else.
 *
 * Built in the shape of the rows around it — a label, a value, and a way to
 * act on it — so a form in here is more of the same object rather than a
 * form dropped into a page of plates.
 *
 * It never says thank you for a message it did not send. Every failure
 * hands back the studio's address and the writing stays in the field, so
 * nobody walks away believing they have been in touch when they have not.
 */
export function Say() {
  const field = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [say, setSay] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<State>("rest");

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending" || state === "done") return;
    setState("sending");
    try {
      const reply = await fetch("/api/hbw/talk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, say, trap }),
      });
      const data = (await reply.json()) as { ok?: boolean; reason?: string; write?: string };
      if (data.ok) {
        setState("done");
        return;
      }
      setState({ error: data.reason || "That did not go through.", write: data.write });
    } catch {
      /* Offline, or the route never answered. Same promise either way. */
      setState({ error: "That did not go through.", write: CONTACT_EMAIL });
    }
  }

  if (state === "done") {
    return (
      <p className="hbw-write__done is-mute">
        Thank you — that is with the studio, and the reply will come to {email}.
      </p>
    );
  }

  return (
    <form onSubmit={send} className="hbw-write">
      <div className="hbw-write__row">
        <label htmlFor={`${field}-name`} className="hbw-m">
          Your name
        </label>
        <input
          id={`${field}-name`}
          type="text"
          autoComplete="name"
          placeholder="Who is writing"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="hbw-write__row">
        <label htmlFor={`${field}-email`} className="hbw-m">
          Your email
        </label>
        <input
          id={`${field}-email`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="hbw-write__row hbw-write__row--say">
        <label htmlFor={`${field}-say`} className="hbw-m">
          What you need
        </label>
        <textarea
          id={`${field}-say`}
          required
          rows={3}
          maxLength={4000}
          placeholder="A name, an identity, a website — or just the sense that something is not quite right."
          value={say}
          onChange={(event) => setSay(event.target.value)}
        />
      </div>

      {/* On its own row, not squeezed beside the button. What it has to
          say is a sentence and an address, and in a column beside a
          control it wrapped to three lines and read as damage. */}
      {typeof state === "object" ? (
        <p className="hbw-write__said" role="alert">
          {state.error}{" "}
          {state.write ? <a href={`mailto:${state.write}`}>{state.write}</a> : null}
        </p>
      ) : null}

      <div className="hbw-write__foot">
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending" : "Send"}
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
    </form>
  );
}
