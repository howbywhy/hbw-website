"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectMedia } from "@/components/home/projects/types";
import { reduceMotion } from "@/components/home/motion";

type Props = {
  media: ProjectMedia;
  load: boolean;
  eager: boolean;
  active?: boolean;
  viewTransitionName?: string;
};

function preferSrc(media: ProjectMedia) {
  const probe = typeof document !== "undefined" ? document.createElement("video") : null;
  const mp4 = media.mp4 || media.videoSrc || (/\.mp4(\?|$)/i.test(media.src) ? media.src : "");
  const webm = media.webm || (/\.webm(\?|$)/i.test(media.src) ? media.src : "");
  const mp4Ok = mp4 && (!probe || probe.canPlayType("video/mp4") !== "");
  const webmOk = webm && (!probe || probe.canPlayType("video/webm") !== "");
  if (mp4Ok) return mp4;
  if (webmOk) return webm;
  return mp4 || webm;
}

export function MovementVideo({ media, load, eager, active = false, viewTransitionName }: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [kept, setKept] = useState(load || eager);
  const [src, setSrc] = useState(() => preferSrc(media));
  const poster = media.poster;
  const alt = media.alt ?? "";
  const muted = media.muted !== false;
  const loop = media.loop !== false;
  const wantsAutoplay = media.autoplay !== false && !reduceMotion();

  useEffect(() => {
    fallbackRef.current = false;
    setSrc(preferSrc(media));
    setPlaying(false);
  }, [media.mp4, media.webm, media.videoSrc, media.src]);

  useEffect(() => {
    if (load) setKept(true);
  }, [load]);

  useEffect(() => {
    const node = videoRef.current;
    const root = rootRef.current;
    if (!node || !kept || !src) return;

    function pause() {
      videoRef.current?.pause();
    }

    function tryPlay() {
      const el = videoRef.current;
      if (!el) return;
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      void el.play().catch(() => undefined);
    }

    if (!wantsAutoplay || !active || !load) {
      pause();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.2) tryPlay();
        else pause();
      },
      { threshold: [0, 0.2, 0.5, 1] }
    );
    io.observe(root || node);
    tryPlay();
    return () => {
      io.disconnect();
      pause();
    };
  }, [kept, load, src, wantsAutoplay, active]);

  function onError() {
    if (fallbackRef.current) {
      setPlaying(false);
      return;
    }
    const webm = media.webm;
    const mp4 = media.mp4 || media.videoSrc;
    const next = src === mp4 ? webm : mp4;
    if (!next || next === src) {
      setPlaying(false);
      return;
    }
    fallbackRef.current = true;
    setPlaying(false);
    setSrc(next);
  }

  return (
    <span ref={rootRef} className="hbw-mv__film">
      {poster ? (
        <img
          className={`hbw-mv__poster is-${media.fit}${playing ? " is-resolved" : ""}`}
          src={poster}
          alt={alt}
          width={media.width}
          height={media.height}
          decoding="async"
          style={viewTransitionName ? { viewTransitionName } : undefined}
        />
      ) : null}
      {kept && src ? (
        <video
          ref={videoRef}
          className={`hbw-mv__media is-${media.fit}`}
          src={src}
          poster={poster}
          width={media.width}
          height={media.height}
          muted={muted}
          loop={loop}
          playsInline
          autoPlay={eager && wantsAutoplay && active}
          preload={eager || active ? "auto" : "metadata"}
          disablePictureInPicture
          controls={false}
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onError={onError}
        />
      ) : poster ? (
        <img
          className={`hbw-mv__media is-${media.fit}`}
          src={poster}
          alt={alt}
          width={media.width}
          height={media.height}
          decoding="async"
        />
      ) : null}
    </span>
  );
}
