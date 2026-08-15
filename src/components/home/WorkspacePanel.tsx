"use client";

import type { WheelEvent } from "react";
import type { ProjectExperience, InfoSectionId } from "@/components/home/projects/types";
import type { StudioView, WorkspacePanelId } from "@/components/home/WorkspaceContext";
import { InformationSheet } from "@/components/home/InformationSheet";
import { MANIFESTO_COPY, STUDIO_COPY } from "@/components/home/studio-copy";
import { projectById } from "@/components/home/catalog";

type Props = {
  panel: WorkspacePanelId;
  leaving: boolean;
  studioView: StudioView;
  infoAnchor: InfoSectionId;
  experience: ProjectExperience | null;
  onShowManifesto: () => void;
  onShowStudio: () => void;
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

function StudioBody({ onShowManifesto }: { onShowManifesto: () => void }) {
  return (
    <>
      <p className="hbw-sheet__opening">{STUDIO_COPY.opening}</p>
      <p>{STUDIO_COPY.role}</p>
      <section>
        <h2>Our Philosophy</h2>
        {STUDIO_COPY.philosophy.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
        <button type="button" className="hbw-sheet__link hbw-inspector__link" onClick={onShowManifesto}>
          {STUDIO_COPY.manifestoLabel}
        </button>
      </section>
      <section>
        <h2>How We Work</h2>
        <p>{STUDIO_COPY.howIntro}</p>
        {STUDIO_COPY.steps.map((step) => (
          <div key={step.id} className="hbw-sheet__step">
            <h2>
              ({step.id}) {step.title}
            </h2>
            <p>{step.copy}</p>
          </div>
        ))}
      </section>
      <section>
        <h2>Contact</h2>
        <ContactCopy text={STUDIO_COPY.contact} />
        <p className="hbw-sheet__place">Wentworth Falls, Blue Mountains · NSW, Australia</p>
      </section>
    </>
  );
}

function ManifestoBody({ onShowStudio }: { onShowStudio: () => void }) {
  return (
    <>
      <button type="button" className="hbw-sheet__link hbw-inspector__back" onClick={onShowStudio}>
        Studio
      </button>
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

function InfoBody({ experience }: { experience: ProjectExperience }) {
  const record = projectById(experience.slug);
  const facts = [
    record.sector ? ["Sector", record.sector] : null,
    record.disciplines?.length ? ["Disciplines", record.disciplines.join(" · ")] : null,
    record.year ? ["Year", record.year] : null,
    record.collaborators?.length ? ["Collaborators", record.collaborators.join(" · ")] : null,
    record.location ? ["Location", record.location] : null,
    record.credits ? ["Credits", record.credits] : experience.credit ? ["Credits", experience.credit] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <p className="hbw-sheet__lead">{experience.name}</p>
      {experience.idea ? (
        <p className="hbw-sheet__opening">
          <span className="hbw-sheet__kicker">Position</span>
          {experience.idea}
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
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );
}

export function WorkspacePanel({
  panel,
  leaving,
  studioView,
  infoAnchor,
  experience,
  onShowManifesto,
  onShowStudio,
}: Props) {
  const studioHeld = panel === "studio" && !leaving;
  const studioShown = studioHeld && studioView === "studio";
  const manifestoShown = studioHeld && studioView === "manifesto";
  const studioLeave = leaving && panel === "studio" && studioView === "studio";
  const manifestoLeave = leaving && panel === "studio" && studioView === "manifesto";
  const infoOpen = panel === "info" && !leaving;

  function stopWheel(event: WheelEvent) {
    event.stopPropagation();
  }

  void infoAnchor;

  return (
    <>
      <InformationSheet
        variant="global-right"
        open={studioShown}
        leaving={studioLeave}
        held={studioHeld}
        label="Studio"
        onWheel={stopWheel}
      >
        <StudioBody onShowManifesto={onShowManifesto} />
      </InformationSheet>
      <InformationSheet
        variant="global-left"
        open={manifestoShown}
        leaving={manifestoLeave}
        held={studioHeld}
        label="Manifesto"
        onWheel={stopWheel}
      >
        <ManifestoBody onShowStudio={onShowStudio} />
      </InformationSheet>
      <InformationSheet
        variant="project-right"
        open={infoOpen}
        leaving={panel === "info" && leaving}
        label="Project information"
        onWheel={stopWheel}
      >
        {panel === "info" && experience ? <InfoBody experience={experience} /> : null}
      </InformationSheet>
    </>
  );
}
