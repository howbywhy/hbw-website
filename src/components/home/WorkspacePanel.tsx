"use client";

import { useEffect, useLayoutEffect, useState, type WheelEvent } from "react";
import type { ProjectExperience, InfoSectionId } from "@/components/home/projects/types";
import type { StudioView, WorkspacePanelId } from "@/components/home/WorkspaceContext";
import { InformationSheet } from "@/components/home/InformationSheet";
import { MANIFESTO_COPY, STUDIO_COPY } from "@/components/home/studio-copy";
import { projectById } from "@/components/home/catalog";

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
  onShowManifesto: () => void;
  onShowStudio: () => void;
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
        <p>{STUDIO_COPY.role}</p>
      </div>
      <section className="hbw-sheet__independent">
        <h2>Independent Practice</h2>
        <p>{STUDIO_COPY.independent}</p>
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

function developedWith(names: string[]) {
  if (names.length === 0) return "";
  if (names.length === 1) return `Developed with ${names[0]}.`;
  return `Developed with ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}.`;
}

function InfoBody({
  experience,
  atProjectEnd = false,
  nextProjectName = null,
  onNextProject,
}: {
  experience: ProjectExperience;
  atProjectEnd?: boolean;
  nextProjectName?: string | null;
  onNextProject?: () => void;
}) {
  const record = projectById(experience.slug);
  const collabNames = record.collaborators?.map((item) => item.name) ?? [];
  const collabLine = collabNames.length ? developedWith(collabNames) : "";
  const facts = [
    record.sector ? ["Sector", record.sector] : null,
    record.disciplines?.length ? ["Disciplines", record.disciplines.join(" · ")] : null,
    record.year ? ["Year", record.year] : null,
    collabNames.length ? ["Collaborators", collabNames.join(" · ")] : null,
    record.location ? ["Location", record.location] : null,
    record.credits ? ["Credits", record.credits] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <p className="hbw-sheet__lead">{record.name}</p>
      {record.idea ? (
        <p className="hbw-sheet__opening">
          <span className="hbw-sheet__kicker">Position</span>
          {record.idea}
        </p>
      ) : null}
      {experience.infoSections
        .filter((section) => section.copy.trim())
        .map((section) => (
          <section
            key={section.id}
            id={`hbw-info-${section.id}`}
            data-hbw-info-section={section.id}
          >
            <h2>
              {section.heading.replace(/^The\s+/i, "").replace(/^\w/, (char) => char.toUpperCase())}
            </h2>
            <p>{section.copy}</p>
          </section>
        ))}
      {facts.length ? (
        <dl className="hbw-sheet__facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {value}
                {label === "Credits" && collabLine ? (
                  <>
                    <br />
                    {collabLine}
                  </>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {atProjectEnd && nextProjectName && onNextProject ? (
        <p className="hbw-sheet__next">
          <button type="button" className="hbw-sheet__next-action" onClick={onNextProject}>
            Next project
            <br />
            {nextProjectName}
          </button>
        </p>
      ) : null}
    </>
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
  onShowStudio,
  onNextProject,
  atProjectEnd = false,
  nextProjectName = null,
  practicePreview = false,
  onPracticePreviewEnter,
  onPracticePreviewLeave,
  onPracticePreviewOpen,
}: Props) {
  const studioHeld = panel === "studio" && !leaving;
  const studioShown = studioHeld;
  const manifestoLeave = manifestoClosing || (leaving && panel === "studio" && studioView === "manifesto");
  const manifestoShown = studioHeld && studioView === "manifesto" && !manifestoLeave;
  const studioLeave = leaving && panel === "studio" && !manifestoLeave;
  const infoOpen = panel === "info" && !leaving;
  const infoLeave = panel === "info" && leaving;

  function stopWheel(event: WheelEvent) {
    event.stopPropagation();
  }

  useEffect(() => {
    if (panel !== "info") return;
    let frame = 0;
    let tries = 0;
    function toTop() {
      const inspector = document.querySelector<HTMLElement>(".hbw-sheet.is-project-right");
      if (!inspector) {
        if (tries++ < 12) frame = requestAnimationFrame(toTop);
        return;
      }
      inspector.setAttribute("data-hbw-info-anchor", infoAnchor);
      inspector.scrollTop = 0;
    }
    toTop();
    return () => cancelAnimationFrame(frame);
  }, [panel, infoAnchor]);

  useLayoutEffect(() => {
    if (!manifestoShown) return;
    const sheet = document.querySelector<HTMLElement>(".hbw-inspector.is-manifesto");
    if (sheet) sheet.scrollTop = 0;
  }, [manifestoShown]);

  void onShowStudio;

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
        held={studioHeld}
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
        {panel === "info" && experience ? (
          <InfoBody
            experience={experience}
            atProjectEnd={atProjectEnd}
            nextProjectName={nextProjectName}
            onNextProject={onNextProject}
          />
        ) : null}
      </InformationSheet>
    </>
  );
}
