import { HbwShell } from "@/components/home/HbwShell";
import { loadCatalog } from "@/sanity/load-catalog";
import { loadGrid } from "@/sanity/load-grid";
import { loadIndex } from "@/sanity/load-index";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  // No case studies: nothing under this layout opens one. The grid needs a pool
  // of stills, which is a slug and a URL each and not a sequence.
  const [index, catalog, grid] = await Promise.all([loadIndex(), loadCatalog(), loadGrid()]);
  return (
    <HbwShell index={index} catalog={catalog} grid={grid}>
      {children}
    </HbwShell>
  );
}
