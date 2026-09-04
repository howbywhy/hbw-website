"use client";

import { type ProjectRecord } from "@/components/home/catalog";
import { getExperience } from "@/components/home/projects/experiences";
import { isVideoMedia, movementSpan, type ProjectMedia } from "@/components/home/projects/types";

type Props = {
  next: ProjectRecord | null;
  onCommit: () => void;
  coverName?: string;
  fromTotal?: number;
};

function mediaFromRecord(image: ProjectRecord): ProjectMedia {
  return {
    type: "image",
    src: image.src,
    srcSet: image.srcSet,
    width: image.width,
    height: image.height,
    fit: "cover",
  };
}

function openingMedia(next: ProjectRecord): ProjectMedia {
  const movement = getExperience(next.id)?.movements[0];
  const media = movement?.media;
  if (!media) return mediaFromRecord(next);
  if (isVideoMedia(media)) {
    return {
      type: "image",
      src: media.poster || next.src,
      width: media.width,
      height: media.height,
      fit: media.fit || "cover",
    };
  }
  return media;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function commitClick(event: React.MouseEvent, onCommit: () => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (event.button !== 0) return;
  event.preventDefault();
  onCommit();
}

function Stage({
  name,
  idea,
  media,
  crop,
  onCommit,
  label,
  href,
  coverName,
  nextId,
  fromTotal,
}: {
  name: string;
  idea?: string;
  media?: ProjectMedia;
  crop?: string;
  onCommit: () => void;
  label: string;
  href: string;
  coverName?: string;
  nextId?: string;
  fromTotal?: number;
}) {
  const first = nextId ? getExperience(nextId)?.movements[0] : undefined;
  const span = first ? movementSpan(first) : undefined;
  const kind = first?.kind;
  const count = fromTotal || 1;
  return (
    <section
      className="hbw-outro is-next"
      aria-label={label}
      data-hbw-next={coverName}
      style={media ? { ["--hbw-mv-ratio" as string]: `${media.width} / ${media.height}` } : undefined}
    >
      <a className="hbw-outro__id" href={href} onClick={(event) => commitClick(event, onCommit)}>
        <span className="hbw-outro__name">{name}</span>
        {idea ? <span className="hbw-outro__idea">{idea}</span> : null}
        {nextId ? (
          <span className="hbw-outro__word" aria-hidden="true">
            <span className="hbw-outro__from">
              Info <span className="hbw-outro__count">{pad(count)} / {pad(count)}</span>
            </span>
            <span className="hbw-outro__to">Next {name}</span>
          </span>
        ) : null}
      </a>
      {media ? (
        <a
          className={`hbw-outro__preview${span ? ` is-${span}` : ""}${kind ? ` is-${kind}` : ""}`}
          href={href}
          onClick={(event) => commitClick(event, onCommit)}
          aria-label={label}
          style={crop ? { ["--hbw-crop" as string]: crop } : undefined}
        >
          <img
            className={`hbw-outro__media is-${media.fit}`}
            src={media.src}
            srcSet={media.srcSet}
            sizes="(max-width: 767px) 100vw, 46vw"
            alt=""
            width={media.width}
            height={media.height}
            decoding="async"
            style={coverName ? { viewTransitionName: `hbw-cover-${coverName}` } : undefined}
          />
        </a>
      ) : null}
    </section>
  );
}

export function ProjectOutro({ next, onCommit, coverName, fromTotal }: Props) {
  if (!next) return null;
  return (
    <Stage
      name={next.name}
      idea={next.idea}
      media={openingMedia(next)}
      crop={next.crop}
      onCommit={onCommit}
      label={`Continue to ${next.name}`}
      href={next.href}
      coverName={coverName}
      nextId={next.id}
      fromTotal={fromTotal}
    />
  );
}
