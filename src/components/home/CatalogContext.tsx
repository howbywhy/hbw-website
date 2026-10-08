"use client";

/**
 * The work line, as the client reads it.
 *
 * The server resolves the line from the CMS and hands it down. Everything that
 * draws a card or walks the sequence reads it from here rather than importing
 * the shipped array, so an editor can add a project, rename one or change what
 * a card crops to without a deploy.
 *
 * Without a provider — /preview, the not-found page, a test rendering a
 * component on its own — this answers with the record the site ships with.
 * That is the same guarantee loadCatalog makes on the server: the line is
 * never empty because something upstream was unavailable.
 */
import { createContext, useContext, useMemo } from "react";
import type { ProjectRecord } from "@/components/home/catalog";
import { WORK as SHIPPED } from "@/components/home/work-data";

const CatalogContext = createContext<ProjectRecord[] | null>(null);

export function CatalogProvider({
  catalog,
  children,
}: {
  catalog?: ProjectRecord[] | null;
  children: React.ReactNode;
}) {
  const value = useMemo(() => (catalog?.length ? catalog : null), [catalog]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

/**
 * The live sequence: the CMS's when there is one, otherwise the shipped record.
 *
 * Exported on its own because HbwShell is the provider and so cannot read its
 * own context — it holds the line as a prop and resolves it the same way here,
 * rather than keeping a second opinion about what empty means.
 */
export function resolveCatalog(catalog?: ProjectRecord[] | null): ProjectRecord[] {
  return catalog?.length ? catalog : SHIPPED;
}

export function useCatalog(): ProjectRecord[] {
  return useContext(CatalogContext) ?? SHIPPED;
}
