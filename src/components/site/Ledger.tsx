/**
 * Everything the studio has done, with its state said plainly.
 *
 * A real table: numbered, columned, and carrying a Status, which is what the
 * earlier attempts at this were missing. "In the wings" was a label I invented
 * to excuse eight inert rows; a status column needs no excuse — it is a fact
 * about each project, it sits in its own column, and a row that has somewhere
 * to go is a link while a row that does not simply says so.
 *
 * Numbered oldest first, so a number never moves when work is added.
 */
import type { IndexEntry } from "@/components/home/index-entry";

export function Ledger({ entries }: { entries: IndexEntry[] }) {
  const byAge = [...entries].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
  const number = new Map(byAge.map((entry, i) => [entry.id + entry.name, i + 1]));
  const rows = [...byAge].reverse();

  return (
    <section className="hbw-ledger" aria-label="Every project">
      <table>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Project</th>
            <th scope="col">Work</th>
            <th scope="col">Sector</th>
            <th scope="col">Year</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry) => {
            const no = String(number.get(entry.id + entry.name) ?? 0).padStart(2, "0");
            return (
              <tr key={entry.id + entry.name} className={entry.featured ? "is-open" : undefined}>
                <td className="hbw-ledger__no">{no}</td>
                <th scope="row">
                  {entry.featured ? (
                    <a href={`/projects/${entry.id}`}>{entry.name}</a>
                  ) : (
                    entry.name
                  )}
                </th>
                <td>{entry.work}</td>
                <td>{entry.sector}</td>
                <td>{entry.year}</td>
                <td className="hbw-ledger__state">
                  {entry.featured ? "Case study" : "In progress"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
