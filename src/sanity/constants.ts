/** Authorship roles. Distinct from catalog filter disciplines. */
export const PROJECT_ROLES = [
  "Brand Strategy",
  "Brand DNA",
  "Naming",
  "Creative Direction",
  "Visual Identity",
  "Verbal Identity",
  "Packaging",
  "Motion",
  "Digital Design",
  "Website",
  "Environmental Graphics",
  "Signage & Wayfinding",
  "Photography Direction",
  "Print",
  "Brand Guidelines",
  "Brand Stewardship",
] as const;

/** Portfolio lenses. Mirrors the current catalog sector vocabulary. */
export const PROJECT_SECTORS = [
  "Sports Nutrition",
  "FMCG",
  "Food",
  "Hospitality",
  "Photography",
  "Architecture",
  "Interior Design",
] as const;

/** Browse-filter disciplines. Distinct from authorship roles. */
export const PROJECT_DISCIPLINES = [
  "Brand DNA",
  "Brand Identity",
  "Naming",
  "Visual Identity",
  "Packaging",
  "Signage/Wayfinding",
  "Website",
  "Print & Digital Design",
  "Motion",
  "Digital Design",
] as const;

export const MOVEMENT_SCALES = ["major", "standard", "detail"] as const;
export const MOVEMENT_PACES = ["tight", "normal", "pause"] as const;
export const MOVEMENT_RELATIONS = ["single", "pair"] as const;
export const INFO_HINTS = ["idea", "shift", "system", "outcome"] as const;

export type ProjectRole = (typeof PROJECT_ROLES)[number];
export type ProjectSector = (typeof PROJECT_SECTORS)[number];
export type ProjectDiscipline = (typeof PROJECT_DISCIPLINES)[number];
