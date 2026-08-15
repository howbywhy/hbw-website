"use client";

import type { ReactNode, WheelEvent } from "react";

export type SheetVariant = "global-right" | "global-left" | "project-right";

type Props = {
  variant: SheetVariant;
  open: boolean;
  leaving?: boolean;
  held?: boolean;
  label?: string;
  children: ReactNode;
  onWheel?: (event: WheelEvent) => void;
};

export function InformationSheet({
  variant,
  open,
  leaving = false,
  held = false,
  label,
  children,
  onWheel,
}: Props) {
  const visible = open && !leaving;
  return (
    <aside
      className={`hbw-sheet hbw-inspector is-${variant} is-overlay${
        variant === "global-left" ? " is-manifesto" : ""
      }${held ? " is-held" : ""}${visible ? " is-visible" : ""}${leaving ? " is-leaving" : ""}`}
      data-hbw-sheet={variant}
      aria-label={label}
      aria-hidden={!visible ? true : undefined}
      inert={!visible || undefined}
      onWheel={onWheel}
    >
      {children}
    </aside>
  );
}
