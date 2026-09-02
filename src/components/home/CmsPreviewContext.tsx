"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import type { ProjectRecord } from "@/components/home/catalog";
import type { ProjectExperience } from "@/components/home/projects/types";

type CmsPreviewState = {
  experience: ProjectExperience | null;
  record: ProjectRecord | null;
};

type CmsPreviewApi = CmsPreviewState & {
  setPreview: (next: CmsPreviewState) => void;
};

const emptyPreview: CmsPreviewState = { experience: null, record: null };

const CmsPreviewContext = createContext<CmsPreviewApi | null>(null);

export function CmsPreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreviewState] = useState<CmsPreviewState>(emptyPreview);
  const setPreview = useCallback((next: CmsPreviewState) => {
    setPreviewState(next);
  }, []);
  const value = useMemo(
    () => ({ experience: preview.experience, record: preview.record, setPreview }),
    [preview, setPreview]
  );
  return <CmsPreviewContext.Provider value={value}>{children}</CmsPreviewContext.Provider>;
}

export function useCmsPreviewExperience() {
  return useContext(CmsPreviewContext)?.experience ?? null;
}

export function useCmsPreviewRecord() {
  return useContext(CmsPreviewContext)?.record ?? null;
}

export function CmsPreviewBridge({
  experience,
  record,
}: {
  experience: ProjectExperience;
  record: ProjectRecord;
}) {
  const setPreview = useContext(CmsPreviewContext)?.setPreview;
  useLayoutEffect(() => {
    if (!setPreview) return;
    setPreview({ experience, record });
    return () => setPreview(emptyPreview);
  }, [setPreview, experience, record]);
  return null;
}
