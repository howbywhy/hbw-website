"use client";

import type { PointerEvent, ReactNode, WheelEvent } from "react";

export type SheetVariant = "global-right" | "global-left" | "project-right";

type Props = {
  variant: SheetVariant;
  open: boolean;
  leaving?: boolean;
  held?: boolean;
  preview?: boolean;
  label?: string;
  children: ReactNode;
  onWheel?: (event: WheelEvent) => void;
  onPreviewEnter?: () => void;
  onPreviewLeave?: () => void;
  onPreviewOpen?: () => void;
  blocked?: boolean;
};

export function InformationSheet({
  variant,
  open,
  leaving = false,
  held = false,
  preview = false,
  label,
  children,
  onWheel,
  onPreviewEnter,
  onPreviewLeave,
  onPreviewOpen,
  blocked = false,
}: Props) {
  const visible = open && !leaving;
  const peeking = preview && !leaving && !visible;
  const interactive = !blocked && (visible || peeking);

  function enterPreview(event: PointerEvent<HTMLElement>) {
    if (!peeking) return;
    if (event.pointerType === "touch") return;
    onPreviewEnter?.();
  }

  function leavePreview(event: PointerEvent<HTMLElement>) {
    if (!peeking) return;
    const related = event.relatedTarget;
    const why = document.querySelector(".hbw-mark-why");
    if (why && related instanceof Node && why.contains(related)) {
      onPreviewEnter?.();
      return;
    }
    onPreviewLeave?.();
  }

  return (
    <aside
      className={`hbw-sheet hbw-inspector is-${variant} is-overlay${
        variant === "global-left" ? " is-manifesto" : ""
      }${held ? " is-held" : ""}${preview && !leaving ? " is-preview" : ""}${visible ? " is-visible" : ""}${
        leaving ? " is-leaving" : ""
      }`}
      data-hbw-sheet={variant}
      data-hbw-sheet-preview={peeking ? "true" : undefined}
      aria-label={label}
      aria-hidden={!interactive ? true : undefined}
      inert={!interactive || undefined}
      tabIndex={interactive ? -1 : undefined}
      onWheel={onWheel}
      onPointerEnter={enterPreview}
      onPointerLeave={leavePreview}
      onClick={() => {
        if (peeking) onPreviewOpen?.();
      }}
    >
      {children}
    </aside>
  );
}
