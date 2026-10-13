/**
 * A project's information, laid out. Facts on the left, the writing on the
 * right. No state, no client needs — it is read, not used.
 */
import type { InfoData } from "@/components/site/project-info";

export function InfoBody({ data }: { data: InfoData }) {
  return (
    <div className="hbw-info__body">
      <dl className="hbw-info__facts">
        {data.facts.map((fact) => (
          <div key={fact.label}>
            <dt className="hbw-m">{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      {data.parts.map((part) => (
        <section key={part.heading} className="hbw-info__part">
          <h2 className="hbw-m">{part.heading}</h2>
          {part.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
