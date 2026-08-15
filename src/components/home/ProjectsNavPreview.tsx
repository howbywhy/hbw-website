"use client";

import { PROJECTS } from "@/components/home/catalog";
import { decodeImage } from "@/components/home/preload";
import { HBW_T, isMobileViewport, reduceMotion } from "@/components/home/motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  enabled: boolean;
  onEnter: (id: string) => void;
  onKeep: () => void;
  onLeave: () => void;
};

export function ProjectsNavPreview({ open, enabled, onEnter, onKeep, onLeave }: Props) {
  const [hint, setHint] = useState<string | null>(null);
  const visible = open && enabled;

  useEffect(() => {
    if (!visible) setHint(null);
  }, [visible]);

  useEffect(() => {
    if (!enabled) return;
    PROJECTS.forEach((project) => {
      void decodeImage(project.src);
      const match = project.src.match(/^(.*)\.(jpg|webp)$/);
      if (match) void decodeImage(`${match[1]}-p-500.${match[2]}`);
    });
  }, [enabled]);

  if (!enabled) return null;

  function activate(event: React.MouseEvent | React.KeyboardEvent, id: string) {
    event.preventDefault();
    event.stopPropagation();
    onEnter(id);
  }

  return (
    <div
      className={`hbw-nav-peek${visible ? " is-open" : ""}`}
      aria-hidden={!visible ? true : undefined}
      inert={!visible || undefined}
      onPointerEnter={onKeep}
      onPointerLeave={onLeave}
    >
      <div className="hbw-nav-peek__row">
        {PROJECTS.map((project) => (
          <a
            key={project.id}
            href={project.href}
            tabIndex={visible ? 0 : -1}
            data-hbw-peek={project.id}
            aria-label={project.name}
            style={{ ["--hbw-crop" as string]: project.crop }}
            onPointerEnter={() => setHint(project.name)}
            onFocus={() => setHint(project.name)}
            onClick={(event) => activate(event, project.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") activate(event, project.id);
            }}
          >
            <img
              src={project.src}
              srcSet={project.srcSet}
              sizes="40px"
              alt=""
              width={project.width}
              height={project.height}
              decoding="async"
            />
          </a>
        ))}
      </div>
      <span className={`hbw-nav-peek__name${hint ? " is-shown" : ""}`}>{hint || "\u00a0"}</span>
    </div>
  );
}

export function useNavPeek(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number>(0);

  function cancelClose() {
    window.clearTimeout(closeTimer.current);
  }

  function show() {
    if (!enabled || isMobileViewport()) return;
    cancelClose();
    setOpen(true);
  }

  function hideSoon() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), reduceMotion() ? 0 : HBW_T.micro);
  }

  function hideNow() {
    cancelClose();
    setOpen(false);
  }

  useEffect(() => {
    if (!enabled) hideNow();
  }, [enabled]);

  useEffect(() => () => cancelClose(), []);

  return { open, show, hideSoon, hideNow };
}
