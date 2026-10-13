"use client";

/**
 * What you land on.
 *
 * The Poster used to hold this space: 577px of blank canvas on a 900px
 * viewport, with the work given what was left. The page opened on a tool
 * rather than on an idea, and said nothing until you drew something.
 *
 * This says the one thing the practice is for, and then gets out of the way.
 * It rises and fades on the same --rise the work line already reads, so the
 * motion that was decoration becomes the argument: you read who this is for,
 * and the work comes up over it.
 */
export function HomeStatement() {
  return (
    <section className="hbw-statement" aria-labelledby="hbw-statement-line">
      <p className="hbw-statement__line" id="hbw-statement-line">
        Clarity for brands at a turning point.{" "}
        <span className="hbw-statement__grey">
          For founders whose business has moved on, and whose brand hasn’t.
        </span>
      </p>
      <ul className="hbw-statement__when">
        <li>You’ve raised, and the brand needs to look like the business you’re becoming.</li>
        <li>You’re moving from online into retail, or from one venue to several.</li>
        <li>New leadership, new direction.</li>
        <li>You’ve outgrown the brand you started with.</li>
        <li>You’re opening something new and it doesn’t have a name yet.</li>
      </ul>
    </section>
  );
}
