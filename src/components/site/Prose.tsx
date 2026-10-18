import type { ReactNode } from "react";
import type { RichParagraph, RichText } from "@/components/home/projects/types";

/**
 * Rich text, set as a column of reading.
 *
 * The site already turns portable text into RichText for the case studies,
 * but it renders that as a few short blocks in a panel. An article is the
 * only place the site sets a long column, so this is the one component that
 * knows what to do with a subheading.
 *
 * Headings arrive as indices rather than on the paragraphs themselves,
 * because portableTextToRichText drops the block style — it was written for
 * copy that has no headings, and widening it would change what every case
 * study gets back.
 */
function spans(paragraph: RichParagraph): ReactNode[] {
  return paragraph.spans.map((span, i) => {
    let node: ReactNode = span.text;
    if (span.marks?.includes("strong")) node = <strong key={`s${i}`}>{node}</strong>;
    if (span.marks?.includes("em")) node = <em key={`e${i}`}>{node}</em>;
    if (span.href) {
      node = (
        <a key={`a${i}`} href={span.href}>
          {node}
        </a>
      );
    }
    return <span key={i}>{node}</span>;
  });
}

export function Prose({
  body,
  headings = [],
  className,
}: {
  body: RichText;
  headings?: number[];
  className?: string;
}) {
  const heading = new Set(headings);
  return (
    <div className={className}>
      {body.map((paragraph, i) =>
        heading.has(i) ? (
          <h2 key={i} className="hbw-read__sub">
            {spans(paragraph)}
          </h2>
        ) : (
          <p key={i}>{spans(paragraph)}</p>
        )
      )}
    </div>
  );
}
