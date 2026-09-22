"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * The one moving part in a pill group: a light thumb that travels to whichever
 * item is current. It marks where you are, so it only moves when that changes.
 * Place it as the group's first child; it tracks `[aria-pressed="true"]`,
 * `[aria-selected="true"]` or `.is-current` among its siblings.
 */
export function PillThumb() {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const thumb = ref.current;
    const group = thumb?.parentElement;
    if (!thumb || !group) return;
    let first = true;
    let hovered: HTMLElement | null = null;

    const current = () =>
      group.querySelector<HTMLElement>(
        ':scope > [aria-pressed="true"], :scope > [aria-selected="true"], :scope > .is-current'
      );

    // The thumb takes its box from the item it sits on, so it can never drift off the text.
    const place = () => {
      const on = hovered ?? current();
      if (!on || on.offsetParent === null) {
        thumb.style.opacity = "0";
        first = true;
        return;
      }
      if (first) thumb.style.transition = "none";
      thumb.style.opacity = "1";
      thumb.style.width = `${on.offsetWidth}px`;
      thumb.style.height = `${on.offsetHeight}px`;
      thumb.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`;
      group.dataset.thumbOn = on === current() ? "current" : "hover";
      if (first) {
        void thumb.offsetWidth;
        thumb.style.transition = "";
        first = false;
      }
    };

    // Hover leads the thumb; leaving the group sends it home to what's current.
    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      let node = event.target as HTMLElement | null;
      while (node && node.parentElement !== group) node = node.parentElement;
      const direct = node && node !== thumb && (node.tagName === "BUTTON" || node.tagName === "A") ? node : null;
      if (!direct || direct === hovered || direct.getAttribute("aria-disabled") === "true") return;
      hovered = direct;
      place();
    };
    const onLeave = () => {
      hovered = null;
      place();
    };

    place();
    group.addEventListener("pointerover", onOver);
    group.addEventListener("pointerleave", onLeave);
    const mutations = new MutationObserver(place);
    mutations.observe(group, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-pressed", "aria-selected", "class"],
      childList: true,
      characterData: true,
    });
    const sizes = new ResizeObserver(place);
    sizes.observe(group);
    return () => {
      group.removeEventListener("pointerover", onOver);
      group.removeEventListener("pointerleave", onLeave);
      mutations.disconnect();
      sizes.disconnect();
    };
  }, []);

  return <span ref={ref} className="hbw-thumb" aria-hidden="true" />;
}

/**
 * A pill whose width follows its words. When the line is re-authored, the new
 * text fades in while the pill eases to its new length, instead of snapping.
 */
export function FluidPill({ className = "", text, children }: { className?: string; text: string; children?: ReactNode }) {
  const pill = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = pill.current;
    const body = inner.current;
    if (!el || !body) return;
    const styles = getComputedStyle(el);
    const pad = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
    el.style.width = `${Math.ceil(body.scrollWidth + pad)}px`;
  }, [text]);

  return (
    <span ref={pill} className={`hbw-fluid ${className}`}>
      <span ref={inner} key={text} className="hbw-fluid__text">
        {children ?? text}
      </span>
    </span>
  );
}
