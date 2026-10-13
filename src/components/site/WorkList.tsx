/**
 * Work whose case study is not written yet.
 *
 * It sits at the foot of the catalogue, not on the front page. These are not
 * filler — they are work the studio has done that has nowhere to open yet,
 * which is a different thing from work that does not exist — so they are
 * listed plainly and labelled honestly rather than dressed as links.
 */
import type { IndexEntry } from "@/components/home/index-entry";

function Row({ entry, open }: { entry: IndexEntry; open: boolean }) {
  const body = (
    <>
      <span className="hbw-row__name">{entry.name}</span>
      <span className="hbw-row__idea">{entry.idea}</span>
      <span className="hbw-row__work">{entry.work}</span>
      <span className="hbw-row__year">{entry.year}</span>
    </>
  );
  return (
    <li>
      {open ? (
        <a className="hbw-row" href={`/projects/${entry.id}`}>
          {body}
        </a>
      ) : (
        <div className="hbw-row hbw-row--soon">{body}</div>
      )}
    </li>
  );
}

export function WorkList({ entries }: { entries: IndexEntry[] }) {
  const soon = entries
    .filter((entry) => !entry.featured)
    .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
  if (!soon.length) return null;

  return (
    <>
      <div className="hbw-band">
        <p className="hbw-chip">In the wings</p>
        <p className="hbw-m">{soon.length} projects, case studies to come</p>
      </div>
      <ul className="hbw-rows hbw-rows--soon">
        {soon.map((entry) => (
          <Row key={entry.id + entry.name} entry={entry} open={false} />
        ))}
      </ul>
    </>
  );
}
