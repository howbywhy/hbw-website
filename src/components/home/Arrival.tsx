"use client";

type Props = {
  onMake: () => void;
  onBrowse: () => void;
};

export function Arrival({ onMake, onBrowse }: Props) {
  return (
    <div className="hbw-arrive">
      <p className="hbw-arrive__line hbw-arrive__line--clarity">Clarity for brands at moments that matter.</p>
      <p className="hbw-arrive__line hbw-arrive__line--prompt">Start with the problem.</p>
      <nav className="hbw-arrive__paths" aria-label="Start">
        <button type="button" className="hbw-arrive__path" onClick={onMake}>
          Make something
        </button>
        <button type="button" className="hbw-arrive__path" onClick={onBrowse}>
          See the work
        </button>
      </nav>
    </div>
  );
}
