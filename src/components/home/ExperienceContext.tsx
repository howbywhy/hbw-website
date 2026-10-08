"use client";

/**
 * The case studies, as the client reads them.
 *
 * The server resolves each project from the CMS or from the sequence the site
 * ships with, and hands the result down. Everything that draws a frame reads
 * it from here.
 *
 * Without a provider — /preview, the not-found page, a component rendered on
 * its own in a test — and for any slug the map does not carry, this answers
 * with the shipped sequence. That is the same guarantee the resolver makes on
 * the server: a case study is never blank because a request failed.
 */
import { createContext, useContext, useMemo } from "react";
import { getExperience } from "@/components/home/projects/experiences";
import type { ProjectExperience } from "@/components/home/projects/types";

export type ExperienceMap = Record<string, ProjectExperience>;

const ExperienceContext = createContext<ExperienceMap | null>(null);

export function ExperienceProvider({
  experiences,
  children,
}: {
  experiences?: ExperienceMap | null;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => (experiences && Object.keys(experiences).length ? experiences : null),
    [experiences]
  );
  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

/**
 * Exported on its own because HbwShell is the provider and so cannot read its
 * own context — it holds the map as a prop and resolves through the same rule.
 */
export function resolveExperience(
  experiences: ExperienceMap | null | undefined,
  slug: string | null | undefined
): ProjectExperience | null {
  if (!slug) return null;
  return experiences?.[slug] ?? getExperience(slug);
}

export function useExperiences(): ExperienceMap | null {
  return useContext(ExperienceContext);
}

/** The case study for a slug: the CMS's when there is one, otherwise shipped. */
export function useExperience(slug: string | null | undefined): ProjectExperience | null {
  return resolveExperience(useContext(ExperienceContext), slug);
}
