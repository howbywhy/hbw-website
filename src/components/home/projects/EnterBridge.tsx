"use client";

import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { HBW_EASE, HBW_T } from "@/components/home/motion";
import {
  bridgeInnerLayouts,
  fitMedia,
  flipInvert,
  flipTransform,
  invertFitted,
  parseObjectPosition,
  type BrowseVisual,
  type DestinationVisual,
} from "@/components/home/projects/enter-bridge";

type Props = {
  visual: BrowseVisual;
  dest: DestinationVisual | null;
  mode: "hold" | "travel" | "fade";
  onSettled: () => void;
};

export function EnterBridge({ visual, dest, mode, onSettled }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement>(null);
  const settled = useRef(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    settled.current = false;
    frame.getAnimations().forEach((anim) => anim.cancel());
    media.getAnimations().forEach((anim) => anim.cancel());

    const iw = dest?.width || visual.width || 1;
    const ih = dest?.height || visual.height || 1;
    const sourcePos = parseObjectPosition(visual.objectPosition);

    const placeFrame = (left: number, top: number, width: number, height: number, transform: string) => {
      frame.style.left = `${left}px`;
      frame.style.top = `${top}px`;
      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
      frame.style.transformOrigin = "top left";
      frame.style.transform = transform;
      frame.style.opacity = "1";
    };

    const placeMedia = (x: number, y: number, width: number, height: number, transform: string) => {
      media.style.left = `${x}px`;
      media.style.top = `${y}px`;
      media.style.width = `${width}px`;
      media.style.height = `${height}px`;
      media.style.transformOrigin = "top left";
      media.style.transform = transform;
    };

    if (mode === "hold" || !dest) {
      const drawn = fitMedia(visual.rect, iw, ih, visual.objectFit, sourcePos);
      placeFrame(visual.rect.left, visual.rect.top, visual.rect.width, visual.rect.height, "none");
      placeMedia(drawn.x, drawn.y, drawn.w, drawn.h, "none");
      return;
    }

    if (mode === "fade") {
      const drawn = fitMedia(visual.rect, iw, ih, visual.objectFit, sourcePos);
      placeFrame(visual.rect.left, visual.rect.top, visual.rect.width, visual.rect.height, "none");
      placeMedia(drawn.x, drawn.y, drawn.w, drawn.h, "none");
      const anim = frame.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: HBW_T.ui,
        easing: HBW_EASE,
        fill: "forwards",
      });
      anim.onfinish = () => {
        if (settled.current) return;
        settled.current = true;
        onSettledRef.current();
      };
      return () => anim.cancel();
    }

    const outer = flipInvert(visual.rect, dest.rect);
    const { from, to } = bridgeInnerLayouts(visual, dest);
    const inner = invertFitted(from, to);
    placeFrame(dest.rect.left, dest.rect.top, dest.rect.width, dest.rect.height, flipTransform(outer));
    placeMedia(to.x, to.y, to.w, to.h, flipTransform(inner));
    void frame.offsetWidth;
    const vars = { duration: HBW_T.spatial, easing: HBW_EASE, fill: "forwards" as const };
    const frameAnim = frame.animate(
      [{ transform: flipTransform(outer) }, { transform: "none" }],
      vars
    );
    const mediaAnim = media.animate(
      [{ transform: flipTransform(inner) }, { transform: "none" }],
      vars
    );
    frameAnim.onfinish = () => {
      if (settled.current) return;
      settled.current = true;
      onSettledRef.current();
    };
    return () => {
      frameAnim.cancel();
      mediaAnim.cancel();
    };
  }, [dest, mode, visual]);

  return createPortal(
    <div className="hbw-enter-bridge" aria-hidden="true">
      <div
        ref={frameRef}
        className="hbw-enter-bridge__frame"
        style={{
          left: visual.rect.left,
          top: visual.rect.top,
          width: visual.rect.width,
          height: visual.rect.height,
        }}
      >
        <img
          ref={mediaRef}
          className="hbw-enter-bridge__media"
          src={visual.src}
          srcSet={visual.srcSet}
          sizes={visual.sizes}
          alt=""
          decoding="sync"
        />
      </div>
    </div>,
    document.body
  );
}
