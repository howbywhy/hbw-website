import { HbwShell } from "@/components/home/HbwShell";
import { loadCatalog } from "@/sanity/load-catalog";
import { loadIndex } from "@/sanity/load-index";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  // No case studies: nothing under this layout opens one, and the cards draw
  // from the art loadCatalog already resolved.
  const [index, catalog] = await Promise.all([loadIndex(), loadCatalog()]);
  return (
    <HbwShell index={index} catalog={catalog}>
      {children}
    </HbwShell>
  );
}
