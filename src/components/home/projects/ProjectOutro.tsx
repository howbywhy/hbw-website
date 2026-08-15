"use client";

import { PROJECTS, type ProjectRecord } from "@/components/home/catalog";
import { getExperience } from "@/components/home/projects/experiences";
import type { ProjectMedia } from "@/components/home/projects/types";

type Props = {
  next: ProjectRecord | null;
  onCommit: () => void;
  coverName?: string;
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
  if (media.type === "video") {
    return {
      type: "image",
      src: media.poster || next.src,
      width: media.width,
      height: media.height,
      fit: "cover",
    };
  }
  return media;
}

function Stage({
  name,
  idea,
  media,
  crop,
  onCommit,
  label,
  coverName,
}: {
  name: string;
  idea?: string;
  media: ProjectMedia;
  crop: string;
  onCommit: () => void;
  label: string;
  coverName?: string;
}) {
  return (
    <section className="hbw-outro" aria-label={label}>
      <button type="button" className="hbw-outro__id" onClick={onCommit}>
        <span className="hbw-outro__name">{name}</span>
        {idea ? <span className="hbw-outro__idea">{idea}</span> : null}
      </button>
      <button
        type="button"
        className="hbw-outro__preview"
        onClick={onCommit}
        aria-label={label}
        style={{ ["--hbw-crop" as string]: crop }}
      >
        <img
          className="hbw-outro__media"
          src={media.src}
          srcSet={media.srcSet}
          sizes="(max-width: 767px) 72vw, 22vw"
          alt=""
          width={media.width}
          height={media.height}
          style={coverName ? { viewTransitionName: `hbw-cover-${coverName}` } : undefined}
        />
      </button>
    </section>
  );
}

export function ProjectOutro({ next, onCommit, coverName }: Props) {
  if (!next) {
    const archive = PROJECTS[0];
    return (
      <Stage
        name="Projects"
        media={mediaFromRecord(archive)}
        crop={archive.crop}
        onCommit={onCommit}
        label="Return to Projects"
      />
    );
  }
  return (
    <Stage
      name={next.name}
      idea={next.idea}
      media={openingMedia(next)}
      crop={next.crop}
      onCommit={onCommit}
      label={`Continue to ${next.name}`}
      coverName={coverName}
    />
  );
}
