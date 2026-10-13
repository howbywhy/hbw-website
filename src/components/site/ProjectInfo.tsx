/**
 * Everything the project says about itself.
 *
 * The body of a sheet now, opened from the fixed bar, so it is reachable from
 * anywhere on a long page rather than waiting at the bottom of one.
 *
 * It is rendered on the server and handed down as markup, so the writing is in
 * the page for a crawler whether or not anyone opens the sheet — which is the
 * whole reason the copy exists.
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
  );
}
