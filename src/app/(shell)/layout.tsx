import { HbwShell } from "@/components/home/HbwShell";
import { loadCatalog } from "@/sanity/load-catalog";
import { loadIndex } from "@/sanity/load-index";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const [index, catalog] = await Promise.all([loadIndex(), loadCatalog()]);
  return (
    <HbwShell index={index} catalog={catalog}>
      {children}
    </HbwShell>
  );
}
