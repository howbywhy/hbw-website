/**
 * Everything the project says about itself, behind one toggle.
 *
 * A <details> element on purpose. It opens without JavaScript, it is in the
 * markup whether or not anyone opens it — so the writing is indexed and
 * searchable, which is the whole reason the copy exists — and a keyboard and
 * a screen reader both already know what it is. A bespoke dropdown would have
 * cost all three.
 */
import type { ProjectExperience } from "@/components/home/projects/types";
import { richTextPlainCopy } from "@/components/home/projects/types";
import type { ProjectRecord } from "@/components/home/catalog";

function body(section: ProjectExperience["infoSections"][number]) {
  const text = section.body ? richTextPlainCopy(section.body) : section.copy;
  return text.split(/\n\n/).filter(Boolean);
}

export function ProjectInfo({
  record,
  experience,
}: {
  record: ProjectRecord;
  experience: ProjectExperience | null;
}) {
  const sections = experience?.infoSections ?? [];
  const authorship = experience?.authorship;

  return (
    <details className="hbw-info">
      <summary className="hbw-m">
        <span className="hbw-info__open">Information</span>
        <span className="hbw-info__shut">Close</span>
      </summary>

      <div className="hbw-info__body">
        <dl className="hbw-info__facts">
          <div>
            <dt className="hbw-m">Year</dt>
            <dd>{record.year}</dd>
          </div>
          {record.sectors?.length ? (
            <div>
              <dt className="hbw-m">Sector</dt>
              <dd>{record.sectors.join(", ")}</dd>
            </div>
          ) : null}
          {record.disciplines?.length ? (
            <div>
              <dt className="hbw-m">Work</dt>
              <dd>{record.disciplines.join(", ")}</dd>
            </div>
          ) : null}
          {record.credits?.length ? (
            <div>
              <dt className="hbw-m">With</dt>
              <dd>{record.credits.join(", ")}</dd>
            </div>
          ) : null}
          {authorship?.roles?.length ? (
            <div>
              <dt className="hbw-m">Role</dt>
              <dd>{authorship.roles.join(", ")}</dd>
            </div>
          ) : null}
        </dl>

        {sections.map((section) => (
          <section key={section.id} className="hbw-info__part">
            <h2 className="hbw-m">{section.heading}</h2>
            {body(section).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>
        ))}

        {authorship?.collaborators?.length ? (
          <section className="hbw-info__part">
            <h2 className="hbw-m">Collaborators</h2>
            {authorship.collaborators.map((who) => (
              <p key={who.name}>
                {who.url ? (
                  <a href={who.url} rel="noreferrer">
                    {who.name}
                  </a>
                ) : (
                  who.name
                )}{" "}
                — {who.contribution}
              </p>
            ))}
          </section>
        ) : null}
      </div>
    </details>
  );
}
