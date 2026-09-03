import { Fragment, type ReactNode } from "react";
import type { RichSpan, RichText } from "@/components/home/projects/types";

/**
 * Source-agnostic rich-text renderer for the restrained Info grammar.
 *
 * `@portabletext/react` is not used: it would pull Sanity-shaped blocks into
 * presentation and add a dependency for a paragraph-only, three-mark schema.
 */
function SpanView({ span }: { span: RichSpan }) {
  const marks = span.marks ?? [];
  let node: ReactNode = span.text;
  if (marks.includes("em")) node = <em>{node}</em>;
  if (marks.includes("strong")) node = <strong>{node}</strong>;
  if (span.href) {
    const external = /^https?:/i.test(span.href);
    node = (
      <a
        className="hbw-sheet__mail"
        href={span.href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {node}
      </a>
    );
  }
  return node;
}

export function RichTextBody({ value }: { value: RichText }) {
  return (
    <>
      {value.map((paragraph, index) => (
        <p key={index}>
          {paragraph.spans.map((span, spanIndex) => (
            <Fragment key={spanIndex}>
              <SpanView span={span} />
            </Fragment>
          ))}
        </p>
      ))}
    </>
  );
}
