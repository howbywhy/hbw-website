/**
 * The work, published and not.
 *
 * The flat index is gone — a bare list of fourteen rows where six were links
 * and eight were inert read as a spreadsheet, and gave no account of why the
 * eight were there. They are not filler: they are work the studio has done
 * whose case study is not written yet, which is a different thing from work
 * that does not exist, and the page should say so.
 *
 * So the list is split. What you can read, and what is on its way. Same rows,
 * same columns, one honest label between them.
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
  const newest = (a: IndexEntry, b: IndexEntry) => b.year - a.year || a.name.localeCompare(b.name);
  const open = entries.filter((entry) => entry.featured).sort(newest);
  const soon = entries.filter((entry) => !entry.featured).sort(newest);

  return (
    <>
      <div className="hbw-band">
        <p className="hbw-chip">Selected work</p>
        <p className="hbw-m">{open.length} case studies</p>
      </div>
      <ul className="hbw-rows">
        {open.map((entry) => (
          <Row key={entry.id + entry.name} entry={entry} open />
        ))}
      </ul>

      {soon.length ? (
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
      ) : null}
    </>
  );
}
