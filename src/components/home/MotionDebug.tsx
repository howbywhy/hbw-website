"use client";

import { useEffect, useState } from "react";

type Props = {
  mode: string;
  project: string | null;
  index: number;
  total: number;
  phase: string;
};

export function MotionDebug({ mode, project, index, total, phase }: Props) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOn(params.get("debugMotion") === "1");
  }, []);
  if (!on) return null;
  return (
    <div className="hbw-motion-debug" aria-hidden="true">
      {mode} · {phase} · {project || "—"} · {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
    </div>
  );
}
