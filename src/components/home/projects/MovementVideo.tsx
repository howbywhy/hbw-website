"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectMedia } from "@/components/home/projects/types";

type Props = {
  media: ProjectMedia;
  load: boolean;
  eager: boolean;
  viewTransitionName?: string;
};

export function MovementVideo({ media, load, eager, viewTransitionName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
  }, [media.src]);

  function markReady() {
    const node = videoRef.current;
    if (!node) return;
    if (node.readyState >= 2) {
      setReady(true);
      node.play().catch(() => {});
    }
  }

  return (
    <span className="hbw-mv__film">
      {media.poster ? (
        <img
          className={`hbw-mv__poster is-${media.fit}${ready ? " is-resolved" : ""}`}
          src={media.poster}
          alt=""
          width={media.width}
          height={media.height}
          decoding="async"
          style={viewTransitionName ? { viewTransitionName } : undefined}
        />
      ) : null}
      {load ? (
        <video
          ref={videoRef}
          className={`hbw-mv__media is-${media.fit}`}
          poster={media.poster}
          width={media.width}
          height={media.height}
          muted
          loop
          playsInline
          autoPlay={eager}
          preload={eager ? "auto" : "metadata"}
          disablePictureInPicture
          controls={false}
          onLoadedData={markReady}
          onCanPlay={markReady}
          onPlaying={() => setReady(true)}
        >
          <source src={media.src} type="video/mp4" />
          {media.webm ? <source src={media.webm} type="video/webm" /> : null}
        </video>
      ) : media.poster ? (
        <img
          className={`hbw-mv__media is-${media.fit}`}
          src={media.poster}
          alt=""
          width={media.width}
          height={media.height}
          decoding="async"
        />
      ) : null}
    </span>
  );
}
