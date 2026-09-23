import { HbwShell } from "@/components/home/HbwShell";
import { loadIndex } from "@/sanity/load-index";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  return <HbwShell index={await loadIndex()}>{children}</HbwShell>;
}
