/**
 * What the studio says about itself.
 *
 * The body of a sheet, exactly as a project's information is. It used to be
 * its own component with its own shell — its own panel, its own title row, its
 * own way of closing — which is why it behaved differently from everything
 * else that opens. It is content now; the sheet does the rest.
 */
import { STUDIO_COPY } from "@/components/home/studio-copy";
import { CONTACT_EMAIL, STUDIO_PLACE } from "@/lib/contact";

export function StudioBody() {
  return (
    <div className="hbw-studio-sheet__body">
      <h2 className="hbw-studio-sheet__lead">{STUDIO_COPY.statement[0]}</h2>
      <p>{STUDIO_COPY.statement[1]}</p>
      <p className="is-mute">{STUDIO_COPY.brief}</p>

      <ol className="hbw-steps">
        {STUDIO_COPY.steps.map((step) => (
          <li key={step.id}>
            <span className="hbw-m">{step.id}</span>
            <span>{step.title}</span>
            <p>{step.copy}</p>
          </li>
        ))}
      </ol>

      <p className="hbw-studio-sheet__foot is-mute">
        {STUDIO_COPY.disciplineList.join(" · ")}
        <br />
        {STUDIO_PLACE}
        <br />
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}
