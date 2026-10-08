import { HbwShell } from "@/components/home/HbwShell";
import { loadCatalog } from "@/sanity/load-catalog";
import { loadExperiences } from "@/sanity/load-experiences";
import { loadIndex } from "@/sanity/load-index";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const [index, catalog, experiences] = await Promise.all([
    loadIndex(),
    loadCatalog(),
    loadExperiences(),
  ]);
  return (
    <HbwShell index={index} catalog={catalog} experiences={experiences}>
      {children}
    </HbwShell>
  );
}
