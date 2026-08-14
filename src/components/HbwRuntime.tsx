"use client";

import { useEffect } from "react";

export function HbwRuntime() {
  useEffect(() => {
    const existing = document.querySelector(
      'script[data-hbw-runtime="true"]'
    ) as HTMLScriptElement | null;
    if (existing) return;

    const script = document.createElement("script");
    script.src = "/runtime/hbw-runtime.js";
    script.async = false;
    script.dataset.hbwRuntime = "true";
    const timer = window.setTimeout(() => {
      document.body.appendChild(script);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
