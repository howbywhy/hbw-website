/**
 * A project's information, under the same rules as the studio.
 *
 * The mark across the top at the width of the sheet, the facts opening the
 * first column, and the writing in the columns after it — the shape the
 * studio takes, so the two things that open over the work are plainly the
 * same kind of object. It used to be four columns of justified, hyphenated
 * type with no mark at all, which was its own small design.
 */
import type { InfoData } from "@/components/site/project-info";
import { Mast } from "@/components/site/Mast";

export function InfoBody({ data, name }: { data: InfoData; name?: string }) {
  return (
    <div className="hbw-studio-doc hbw-info-doc">
      {name ? <Mast>{name}</Mast> : null}

      <div className="hbw-info__grid">
        <dl className="hbw-info__facts">
          {data.facts.map((fact) => (
            <div key={fact.label}>
              <dt className="hbw-m">{fact.label}</dt>
              <dd>
                {fact.href ? (
                  /*
                   * A new tab, which here is the right answer rather than the
                   * lazy one.
                   *
                   * Every other link on this site moves around inside the
                   * work. This sheet is open over a project that is itself
                   * open over the line, so a reader who followed a credit away
                   * in place would lose the frame they were on, the project,
                   * and where they had got to — and come back to the top of
                   * none of it.
                   */
                  <a href={fact.href} target="_blank" rel="noreferrer">
                    {fact.value}
                  </a>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        {data.parts.map((part) => (
          <section
            key={part.heading}
            className={`hbw-info__part${part.wide ? " hbw-info__part--wide" : ""}`}
          >
            <h2 className="hbw-m">{part.heading}</h2>
            {part.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
