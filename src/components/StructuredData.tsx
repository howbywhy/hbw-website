import { graph } from "@/lib/structured-data";

/**
 * Emits one JSON-LD @graph per page. Server-rendered, so it is in the HTML a
 * crawler receives rather than something a headless fetch never sees.
 */
export function StructuredData({ nodes }: { nodes: Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Values come from the catalog and fixed strings, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph(nodes)) }}
    />
  );
}
