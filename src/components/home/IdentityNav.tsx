"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HBW_T, isMobileViewport } from "@/components/home/motion";

export type IdentityIntent = "how" | "by" | "why";

const REST = { how: "How", by: "by", why: "Why" } as const;

const PHRASES: Record<IdentityIntent, { how: string; by: string; why: string; label: string }> = {
  how: { how: "Make", by: "with", why: "HBW", label: "Make with HBW" },
  by: { how: "Work", by: "by", why: "HBW", label: "Work by HBW" },
  why: { how: "About", by: "the", why: "Practice", label: "About the Practice" },
};

const TEACH = { how: "Make", by: "Work", why: "About" } as const;
const ACK = { how: "Make", by: "Work", why: "About" } as const;

type Props = {
  onMake: () => void;
  onProjects: () => void;
  onPractice: () => void;
  practiceMuted?: boolean;
  inert?: boolean;
  assembled?: boolean;
  resolved?: boolean;
  suffix?: string | null;
  previewing?: boolean;
  previewingWhy?: boolean;
  onPreviewShow?: () => void;
  onPreviewKeep?: () => void;
  onPreviewHide?: () => void;
  onWhyPreviewShow?: () => void;
  onWhyPreviewKeep?: () => void;
  onWhyPreviewHide?: () => void;
  /** Idea of the project `suffix` currently names. Null on browse (`× Projects`) and make. */
  projectIdea?: string | null;
  whyHoverLocked?: boolean;
};

const REST_LINE = "Brand Strategy & Creative Direction";

export function IdentityNav({
  onMake,
  onProjects,
  onPractice,
  practiceMuted = false,
  inert = false,
  assembled = false,
  resolved = false,
  suffix = null,
  previewing = false,
  previewingWhy = false,
  onPreviewShow,
  onPreviewKeep,
  onPreviewHide,
  onWhyPreviewShow,
  onWhyPreviewKeep,
  onWhyPreviewHide,
  projectIdea = null,
  whyHoverLocked = false,
}: Props) {
  const [live, setLive] = useState(false);
  const [teach, setTeach] = useState(false);
  const [intent, setIntent] = useState<IdentityIntent | null>(null);
  const [ack, setAck] = useState<IdentityIntent | null>(null);
  const pointerType = useRef<string>("");
  const ackTimer = useRef(0);
  const navRef = useRef<HTMLElement>(null);
  const suffixRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      setLive(root.classList.contains("hbw-entered") && !root.classList.contains("hbw-intro"));
      setTeach(root.classList.contains("hbw-nav-teach"));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (assembled) setIntent(null);
  }, [assembled]);

  useEffect(() => {
    if (!previewing) setIntent((current) => (current === "by" ? null : current));
  }, [previewing]);

  useEffect(() => {
    if (!previewingWhy) setIntent((current) => (current === "why" ? null : current));
  }, [previewingWhy]);

  useEffect(() => () => window.clearTimeout(ackTimer.current), []);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const suffixEl = suffixRef.current;
    if (!nav || !suffixEl) return;

    function suffixHoldLive(mark: HTMLElement) {
      const home = mark.closest(".hbw-home");
      return home?.getAttribute("data-hbw-from") === "view" && home?.getAttribute("data-hbw-to") === "make";
    }

    function alignSuffix() {
      const mark = navRef.current;
      const label = suffixRef.current;
      if (!mark || !label) return;
      if (suffixHoldLive(mark)) return;
      if (assembled || (resolved && suffix) || !suffix) {
        label.style.left = "";
        label.style.transform = "";
        return;
      }
      const by = mark.querySelector<HTMLElement>(".hbw-mark-by");
      if (!by) return;
      const glyph = by.querySelector<HTMLElement>(".hbw-mark-word--rest");
      const target = glyph ?? by;
      const gap = Number.parseFloat(getComputedStyle(mark).fontSize) * 0.4;
      label.style.left = `${target.getBoundingClientRect().right - mark.getBoundingClientRect().left + gap}px`;
    }

    alignSuffix();
    if (assembled || (resolved && suffix) || !suffix || suffixHoldLive(nav)) return;
    const by = nav.querySelector(".hbw-mark-by");
    const glyph = by instanceof Element ? by.querySelector(".hbw-mark-word--rest") : null;
    const observer = new ResizeObserver(alignSuffix);
    observer.observe(nav);
    if (by instanceof Element) observer.observe(by);
    if (glyph instanceof Element) observer.observe(glyph);
    window.addEventListener("resize", alignSuffix);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", alignSuffix);
      suffixEl.style.left = "";
      suffixEl.style.transform = "";
    };
  }, [assembled, resolved, suffix]);

  const teaching = teach && !assembled;
  const activeIntent: IdentityIntent | null = teaching
    ? null
    : assembled || resolved
      ? null
      : intent || (previewingWhy ? "why" : previewing ? "by" : null);
  const phrase = teaching ? TEACH : activeIntent ? PHRASES[activeIntent] : null;
  const bySwap = ack === "by" ? ACK.by : phrase?.by || "\u00a0";
  const descriptorKey = projectIdea ? `${suffix || "idea"}—${projectIdea}` : "rest";

  function arm(next: IdentityIntent, type?: string) {
    if (!live || inert || assembled) return;
    if (type === "touch") return;
    if (next === "why" && (practiceMuted || whyHoverLocked)) return;
    if (next === "by") {
      setIntent("by");
      onWhyPreviewHide?.();
      onPreviewShow?.();
      return;
    }
    setIntent(next);
    if (next === "why") {
      onPreviewHide?.();
      onWhyPreviewShow?.();
      return;
    }
    onPreviewHide?.();
    onWhyPreviewHide?.();
  }

  function focusArm(next: IdentityIntent) {
    arm(next, pointerType.current);
  }

  function go(next: IdentityIntent) {
    if (!live || inert) return;
    document.documentElement.classList.remove("hbw-nav-teach");
    const touch = pointerType.current === "touch" || isMobileViewport();
    if (touch) {
      setAck(next);
      window.clearTimeout(ackTimer.current);
      ackTimer.current = window.setTimeout(() => setAck(null), HBW_T.micro);
    } else {
      setIntent(null);
    }
    if (next !== "why") onWhyPreviewHide?.();
    if (next !== "by") onPreviewHide?.();
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (next === "how") onMake();
    else if (next === "by") onProjects();
    else if (!practiceMuted) onPractice();
    pointerType.current = "";
  }

  function leaveSlot(related: EventTarget | null, current: HTMLElement, slot: IdentityIntent) {
    const nav = current.closest(".hbw-home-strip__mark");
    const peek = document.querySelector(".hbw-nav-peek");
    const practice = document.querySelector(".hbw-sheet.is-global-right");
    if (slot === "by" && peek && related instanceof Node && peek.contains(related)) {
      onPreviewKeep?.();
      return;
    }
    if (slot === "why" && practice && related instanceof Node && practice.contains(related)) {
      onWhyPreviewKeep?.();
      return;
    }
    if (!related || !nav?.contains(related as Node)) {
      setIntent(null);
      onPreviewHide?.();
      onWhyPreviewHide?.();
    }
  }

  return (
    <nav
      ref={navRef}
      className={`hbw-home-strip__mark${phrase ? " is-intent" : ""}${
        assembled ? " is-assembled" : resolved ? " is-resolved" : ""
      }${teaching ? " is-teach" : ""}`}
      data-hbw-intent={
        assembled ? "assembled" : teaching ? "teach" : intent || (previewingWhy ? "why" : previewing ? "by" : "rest")
      }
      aria-label={suffix ? `How by Why × ${suffix}` : "How by Why"}
      inert={inert || undefined}
    >
      <button
        type="button"
        className={`hbw-mark-how${ack === "how" ? " is-ack" : ""}`}
        tabIndex={live && !inert ? 0 : -1}
        aria-label={PHRASES.how.label}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onPointerEnter={(event) => arm("how", event.pointerType)}
        onPointerLeave={(event) => leaveSlot(event.relatedTarget, event.currentTarget, "how")}
        onFocus={() => focusArm("how")}
        onBlur={(event) => leaveSlot(event.relatedTarget, event.currentTarget, "how")}
        onClick={() => go("how")}
      >
        <span className="hbw-mark-word hbw-mark-word--rest">{REST.how}</span>
        <span className="hbw-mark-word hbw-mark-word--swap" aria-hidden="true">
          {ack === "how" ? ACK.how : phrase?.how || "\u00a0"}
        </span>
      </button>
      <button
        type="button"
        className={`hbw-mark-by${ack === "by" ? " is-ack" : ""}`}
        tabIndex={live && !inert ? 0 : -1}
        aria-label={PHRASES.by.label}
        aria-expanded={previewing || undefined}
        aria-controls={previewing ? "hbw-nav-peek" : undefined}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onPointerEnter={(event) => arm("by", event.pointerType)}
        onPointerLeave={(event) => leaveSlot(event.relatedTarget, event.currentTarget, "by")}
        onFocus={() => focusArm("by")}
        onBlur={(event) => leaveSlot(event.relatedTarget, event.currentTarget, "by")}
        onKeyDown={(event) => {
          if (event.key !== "Tab" || event.shiftKey || !previewing) return;
          const first = document.querySelector<HTMLElement>(
            "#hbw-nav-peek.is-open a[data-hbw-peek], #hbw-nav-peek.is-open .hbw-mark-all"
          );
          if (!first) return;
          event.preventDefault();
          first.focus();
        }}
        onClick={() => go("by")}
      >
        <span className="hbw-mark-word hbw-mark-word--rest">{REST.by}</span>
        <span className="hbw-mark-word hbw-mark-word--swap" aria-hidden="true">
          {bySwap}
        </span>
      </button>
      <button
        type="button"
        className={`hbw-mark-why${ack === "why" ? " is-ack" : ""}`}
        tabIndex={live && !inert && !practiceMuted ? 0 : -1}
        aria-label={PHRASES.why.label}
        aria-expanded={previewingWhy || undefined}
        aria-disabled={practiceMuted || undefined}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onPointerEnter={(event) => arm("why", event.pointerType)}
        onPointerLeave={(event) => leaveSlot(event.relatedTarget, event.currentTarget, "why")}
        onFocus={() => focusArm("why")}
        onBlur={(event) => leaveSlot(event.relatedTarget, event.currentTarget, "why")}
        onClick={() => go("why")}
      >
        <span className="hbw-mark-word hbw-mark-word--rest">{REST.why}</span>
        <span className="hbw-mark-word hbw-mark-word--swap" aria-hidden="true">
          {ack === "why" ? ACK.why : phrase?.why || "\u00a0"}
        </span>
      </button>
      <span
        ref={suffixRef}
        className={`hbw-mark-suffix${suffix ? " is-on" : ""}`}
      >
        <span className="hbw-mark-times" aria-hidden={suffix ? undefined : true}>
          ×
        </span>
        <span key={suffix || "idle"} className="hbw-mark-context" aria-hidden={suffix ? undefined : true}>
          {suffix || ""}
        </span>
      </span>
      <span
        className="hbw-mark-descriptor"
        aria-hidden={projectIdea || !assembled ? undefined : true}
        onPointerEnter={() => {
          if (previewing) onPreviewKeep?.();
        }}
      >
        <span key={descriptorKey} className="hbw-mark-descriptor__line">
          {projectIdea || REST_LINE}
        </span>
      </span>
    </nav>
  );
}
