/**
 * The work, as a catalogue.
 *
 * Every project the practice has done, numbered and dated, in one list: the
 * six with case studies and the rest of the record together. A row that opens
 * something is a link and says so by behaving like one; a row that is only a
 * record sits flat. That distinction is the whole interaction on this page.
 *
 * Numbered from the oldest, so a project's number never changes when a new
 * one is added — a catalogue number that moves is not a catalogue number.
 */
import type { IndexEntry } from "@/components/home/index-entry";

export function IndexRows({ entries }: { entries: IndexEntry[] }) {
  // One order, used twice. Numbering runs oldest to newest so a number never
  // moves when a project is added; the list reads newest first. Those must be
  // exact inverses, or the column counts 13, 14, 10, 11 down the page and the
  // system reads as noise. The tiebreak is by name so a year is stable.
  const byAge = [...entries].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
  const number = new Map(byAge.map((entry, i) => [entry.id + entry.name, i + 1]));
  const rows = [...byAge].reverse();

  return (
    <ul className="hbw-rows">
      {rows.map((entry) => {
        const no = String(number.get(entry.id + entry.name) ?? 0).padStart(2, "0");
        const body = (
          <>
            <span className="hbw-row__no">{no}</span>
            <span className="hbw-row__name">{entry.name}</span>
            <span className="hbw-row__idea">{entry.idea}</span>
            <span className="hbw-row__work">{entry.work}</span>
            <span className="hbw-row__year">{entry.year}</span>
          </>
        );
        return (
          <li key={`${entry.id}-${entry.name}`}>
            {entry.featured ? (
              <a className="hbw-row" href={`/projects/${entry.id}`}>
                {body}
              </a>
            ) : (
              <div className="hbw-row hbw-row--flat">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
