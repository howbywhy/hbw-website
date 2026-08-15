"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isWorkspacePathname } from "@/lib/workspace-routes";

function ensureScript(src: string, datasetKey: string, datasetValue: string) {
  const selector = `script[src="${src}"]`;
  if (document.querySelector(selector)) return;
  const script = document.createElement("script");
  script.src = src;
  script.async = false;
  script.dataset[datasetKey] = datasetValue;
  document.body.appendChild(script);
}

export function HbwRuntime() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (isWorkspacePathname(pathname)) return;
    const timer = window.setTimeout(() => {
      ensureScript("/runtime/hbw-runtime.js", "hbwRuntime", "true");
      ensureScript("/runtime/hbw-evolution-01.js", "hbwEvolution", "01");
      ensureScript("/runtime/hbw-evolution-02.js", "hbwEvolution02", "02");
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
