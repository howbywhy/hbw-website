"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    const timer = window.setTimeout(() => {
      ensureScript("/runtime/hbw-runtime.js", "hbwRuntime", "true");
      ensureScript("/runtime/hbw-evolution-01.js", "hbwEvolution", "01");
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
