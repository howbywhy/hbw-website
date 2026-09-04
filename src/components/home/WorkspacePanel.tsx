"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type WheelEvent } from "react";
import { factualBlocks } from "@/components/home/projects/factual";
import { RichTextBody } from "@/components/home/projects/RichText";
import type { ExperienceCollaborator, InfoSectionId, ProjectExperience } from "@/components/home/projects/types";
import { infoSectionHasCopy } from "@/components/home/projects/types";
import type { StudioView, WorkspacePanelId } from "@/components/home/WorkspaceContext";
import { InformationSheet } from "@/components/home/InformationSheet";
import { MANIFESTO_COPY, STUDIO_COPY } from "@/components/home/studio-copy";
import { useCmsPreviewRecord } from "@/components/home/CmsPreviewContext";
import { projectById, projectCollaborators, projectDisciplines, projectSectors } from "@/components/home/catalog";

type Props = {
  panel: WorkspacePanelId;
  leaving: boolean;
  manifestoClosing?: boolean;
  studioView: StudioView;
  infoAnchor: InfoSectionId;
  experience: ProjectExperience | null;
  practicePreview?: boolean;
  atProjectEnd?: boolean;
  nextProjectName?: string | null;
  nextProjectHref?: string | null;
  onShowManifesto: () => void;
  onNextProject?: () => void;
  onPracticePreviewEnter?: () => void;
  onPracticePreviewLeave?: () => void;
  onPracticePreviewOpen?: () => void;
};

function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <p>
      {lines.map((line, i) => (
        <span key={line}>
          {i > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </p>
  );
}

function ContactCopy({ text }: { text: string }) {
  const parts = text.split("mark@hbw.works");
  return (
    <p>
      {parts[0]}
      <a className="hbw-sheet__mail" href="mailto:mark@hbw.works">
        mark@hbw.works
      </a>
      {parts[1] ?? ""}
    </p>
  );
}

function PracticeGlimpse() {
  return (
    <div className="hbw-sheet__glimpse">
      <p className="hbw-sheet__lead">Practice</p>
      <p className="hbw-sheet__opening">{STUDIO_COPY.opening}</p>
      <p>{STUDIO_COPY.work}</p>
      <p>{STUDIO_COPY.glimpse}</p>
      <p className="hbw-sheet__enter">Enter Practice</p>
    </div>
  );
}

function StudioBody({ onShowManifesto }: { onShowManifesto: () => void }) {
  return (
    <>
      <div className="hbw-sheet__opening-block">
        <p className="hbw-sheet__opening">{STUDIO_COPY.opening}</p>
        <p>{STUDIO_COPY.work}</p>
        <p>{STUDIO_COPY.role}</p>
        <p>{STUDIO_COPY.partners}</p>
      </div>
      <section className="hbw-sheet__independent">
        <h2>Independent Practice</h2>
        {STUDIO_COPY.independent.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </section>
      <figure className="hbw-sheet__portrait">
        <img
          src="/practice/mark-blackler-studio.jpg"
          alt=""
          width={819}
          height={1024}
          decoding="async"
        />
      </figure>
      <section className="hbw-sheet__philosophy">
        <h2>Our Philosophy</h2>
        {STUDIO_COPY.philosophy.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
        <button type="button" className="hbw-sheet__link hbw-sheet__pill" onClick={onShowManifesto}>
          {STUDIO_COPY.manifestoLabel}
        </button>
      </section>
      <section className="hbw-sheet__how">
        <h2>How We Work</h2>
        <p className="hbw-sheet__how-intro">{STUDIO_COPY.howIntro}</p>
        <p>{STUDIO_COPY.howTools}</p>
        {STUDIO_COPY.steps.map((step) => (
          <div key={step.id} className="hbw-sheet__step">
            <h2>
              ({step.id}) {step.title}
            </h2>
            <p>{step.copy}</p>
          </div>
        ))}
      </section>
      <section className="hbw-sheet__colophon">
        <h2>Contact</h2>
        <ContactCopy text={STUDIO_COPY.contact} />
        <PracticePlace />
      </section>
    </>
  );
}

function PracticePlace() {
  const [now, setNow] = useState<{ temperature: number; condition: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/hbw/place")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ok?: boolean; temperature?: number; condition?: string } | null) => {
        if (!live || !data?.ok || typeof data.temperature !== "number" || !data.condition) return;
        setNow({ temperature: data.temperature, condition: data.condition });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  return (
    <p className="hbw-sheet__place">
      <span className="hbw-sheet__place-name">Wentworth Falls, Blue Mountains</span>
      {now ? (
        <>
          <br />
          <span className="hbw-sheet__place-now">
            {now.temperature}°C · {now.condition}
          </span>
        </>
      ) : null}
    </p>
  );
}

function ManifestoBody() {
  return (
    <>
      <p className="hbw-sheet__opening">
        {MANIFESTO_COPY.opening[0]}
        <br />
        {MANIFESTO_COPY.opening[1]}
      </p>
      <Lines lines={MANIFESTO_COPY.reduced} />
      {MANIFESTO_COPY.body.map((lines) => (
        <Lines key={lines[0]} lines={lines} />
      ))}
      <p className="hbw-sheet__opening hbw-sheet__closing">
        {MANIFESTO_COPY.close[0]}
        <br />
        {MANIFESTO_COPY.close[1]}
      </p>
    </>
  );
}

function CollaboratorLines({ collaborators }: { collaborators: ExperienceCollaborator[] }) {
  return (
    <p>
      {collaborators.map((item, index) => (
        <span key={`${item.name}-${index}`}>
          {index > 0 ? <br /> : null}
          {item.url ? (
            <a className="hbw-sheet__mail" href={item.url} target="_blank" rel="noopener noreferrer">
              {item.name}
            </a>
          ) : (
            item.name
          )}
          {item.contribution ? ` — ${item.contribution}` : null}
        </span>
      ))}
    </p>
  );
}

function nextClick(event: React.MouseEvent, onNextProject?: () => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (event.button !== 0) return;
  event.preventDefault();
  onNextProject?.();
}

function InfoBody({
  experience,
  atProjectEnd = false,
  nextProjectName = null,
  nextProjectHref = null,
  onNextProject,
}: {
  experience: ProjectExperience;
  atProjectEnd?: boolean;
  nextProjectName?: string | null;
  nextProjectHref?: string | null;
  onNextProject?: () => void;
}) {
  const previewRecord = useCmsPreviewRecord();
  const record = previewRecord?.id === experience.slug ? previewRecord : projectById(experience.slug);
  const collabNames = projectCollaborators(record).map((item) => item.name);
  const disciplines = projectDisciplines(record);
  const sectors = projectSectors(record);
  const featured =
    record.features?.length ? (
      <>
        {record.features.map((feature, i) => (
          <span key={feature.name}>
            {i > 0 ? " · " : null}
            {feature.url ? (
              <a className="hbw-sheet__mail" href={feature.url} target="_blank" rel="noopener noreferrer">
                {feature.name}
              </a>
            ) : (
              feature.name
            )}
          </span>
        ))}
      </>
    ) : null;
  const facts = (
    [
      sectors.length ? ["Sectors", sectors.join(" · ")] : null,
      disciplines.length ? ["Disciplines", disciplines.join(" · ")] : null,
      record.year ? ["Year", record.year] : null,
      collabNames.length ? ["Collaborators", collabNames.join(" · ")] : null,
      record.location ? ["Location", record.location] : null,
      featured ? ["Featured", featured] : null,
      record.credits?.length ? ["Credits", record.credits.join(", ")] : null,
    ] as ([string, ReactNode] | null)[]
  ).filter(Boolean) as [string, ReactNode][];

  return (
    <article>
      <h1 className="hbw-sheet__lead">{record.name}</h1>
      {record.idea ? (
        <p className="hbw-sheet__opening">
          <span className="hbw-sheet__kicker">Position</span>
          {record.idea}
        </p>
      ) : null}
      {factualBlocks(experience).map((block) => (
        <section key={block.id} data-hbw-info-factual={block.id}>
          <h2>{block.heading}</h2>
          {block.kind === "rich" ? <RichTextBody value={block.body} /> : null}
          {block.kind === "lines" ? <Lines lines={block.lines} /> : null}
          {block.kind === "copy" ? <p>{block.copy}</p> : null}
          {block.kind === "collaborators" ? <CollaboratorLines collaborators={block.collaborators} /> : null}
        </section>
      ))}
      {experience.infoSections.filter(infoSectionHasCopy).map((section) => (
        <section
          key={section.id}
          id={`hbw-info-${section.id}`}
          data-hbw-info-section={section.id}
        >
          <h2>
            {section.heading.replace(/^The\s+/i, "").replace(/^\w/, (char) => char.toUpperCase())}
          </h2>
          {section.body?.length ? <RichTextBody value={section.body} /> : <p>{section.copy}</p>}
        </section>
      ))}
      {facts.length ? (
        <dl className="hbw-sheet__facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {atProjectEnd && nextProjectName && nextProjectHref && onNextProject ? (
        <p className="hbw-sheet__next">
          <a
            className="hbw-sheet__next-action"
            href={nextProjectHref}
            onClick={(event) => nextClick(event, onNextProject)}
          >
            Next project
            <br />
            {nextProjectName}
          </a>
        </p>
      ) : null}
    </article>
  );
}

export function WorkspacePanel({
  panel,
  leaving,
  manifestoClosing = false,
  studioView,
  infoAnchor,
  experience,
  onShowManifesto,
  onNextProject,
  atProjectEnd = false,
  nextProjectName = null,
  nextProjectHref = null,
  practicePreview = false,
  onPracticePreviewEnter,
  onPracticePreviewLeave,
  onPracticePreviewOpen,
}: Props) {
  const studioHeld = panel === "studio" && !leaving;
  const studioShown = studioHeld && studioView === "studio";
  const manifestoLeave = manifestoClosing || (leaving && panel === "studio" && studioView === "manifesto");
  const manifestoShown = studioHeld && studioView === "manifesto" && !manifestoLeave;
  const studioLeave = leaving && panel === "studio" && !manifestoLeave;
  const infoOpen = panel === "info" && !leaving;
  const infoLeave = panel === "info" && leaving;

  function stopWheel(event: WheelEvent) {
    event.stopPropagation();
  }

  const infoWasOpen = useRef(false);
  useLayoutEffect(() => {
    const inspector = document.querySelector<HTMLElement>(".hbw-sheet.is-project-right");
    if (inspector) inspector.setAttribute("data-hbw-info-anchor", infoAnchor);
    const opening = panel === "info" && !infoWasOpen.current;
    infoWasOpen.current = panel === "info";
    if (opening && inspector) inspector.scrollTop = 0;
  }, [panel, infoAnchor]);

  useLayoutEffect(() => {
    if (!manifestoShown) return;
    const sheet = document.querySelector<HTMLElement>(".hbw-inspector.is-manifesto");
    if (sheet) sheet.scrollTop = 0;
  }, [manifestoShown]);

  return (
    <>
      <InformationSheet
        variant="global-right"
        open={studioShown}
        leaving={studioLeave}
        held={studioHeld}
        preview={practicePreview}
        label="Studio"
        onWheel={stopWheel}
        onPreviewEnter={onPracticePreviewEnter}
        onPreviewLeave={onPracticePreviewLeave}
        onPreviewOpen={onPracticePreviewOpen}
        blocked={false}
      >
        {practicePreview && !studioShown ? <PracticeGlimpse /> : <StudioBody onShowManifesto={onShowManifesto} />}
      </InformationSheet>
      <InformationSheet
        variant="global-left"
        open={manifestoShown}
        leaving={manifestoLeave}
        held={studioHeld && studioView === "manifesto"}
        label="Manifesto"
        onWheel={stopWheel}
      >
        <ManifestoBody />
      </InformationSheet>
      <InformationSheet
        variant="project-right"
        open={infoOpen}
        leaving={infoLeave}
        label="Project information"
        onWheel={stopWheel}
      >
        {experience ? (
          <InfoBody
            experience={experience}
            atProjectEnd={atProjectEnd}
            nextProjectName={nextProjectName}
            nextProjectHref={nextProjectHref}
            onNextProject={onNextProject}
          />
        ) : null}
      </InformationSheet>
    </>
  );
}
