/**
 * The record: every project with a case study, numbered.
 *
 * Work without a case study is not listed. It was, with a Status column
 * saying "In progress" — but a list of things you cannot look at is a list of
 * promises, and the studio does not need to make any. When one is written it
 * joins the table.
 *
 * There is no Status column for the same reason: with only published work in
 * here, a column saying "Case study" fourteen times says nothing.
 *
 * Numbered oldest first, so a number never moves when work is added.
 */
import type { IndexEntry } from "@/components/home/index-entry";

export function Ledger({ entries }: { entries: IndexEntry[] }) {
  const open = entries.filter((entry) => entry.featured);
  const byAge = [...open].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
  const number = new Map(byAge.map((entry, i) => [entry.id + entry.name, i + 1]));
  const rows = [...byAge].reverse();
  if (!rows.length) return null;

  return (
    <section className="hbw-ledger" aria-label="Case studies">
      <table>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Project</th>
            <th scope="col">Work</th>
            <th scope="col">Sector</th>
            <th scope="col">Year</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => (
            <tr key={entry.id + entry.name}>
              <td className="hbw-ledger__no">
                {String(number.get(entry.id + entry.name) ?? 0).padStart(2, "0")}
              </td>
              <th scope="row">
                <a href={`/projects/${entry.id}`}>{entry.name}</a>
              </th>
              <td>{entry.work}</td>
              <td>{entry.sector}</td>
              <td>{entry.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
