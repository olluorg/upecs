import type { PrintSize, Orientation } from "../types";
import { IconScissors } from "./Icons";
import { useT } from "../utils/I18nContext";

type Props = {
  size: PrintSize;
  setSize: (s: PrintSize) => void;
  showLabels: boolean;
  setShowLabels: (b: boolean) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  cutMarks: boolean;
  setCutMarks: (b: boolean) => void;
  cmyk: boolean;
  setCmyk: (b: boolean) => void;
};

export default function PrintSettings({
  size,
  setSize,
  showLabels,
  setShowLabels,
  orientation,
  setOrientation,
  cutMarks,
  setCutMarks,
  cmyk,
  setCmyk,
}: Props) {
  const t = useT();
  const s = t.settings;

  const SIZES: { id: PrintSize; sub: string }[] = [
    { id: "2x2", sub: s.large },
    { id: "3x3", sub: s.standard },
    { id: "4x4", sub: s.small },
  ];

  return (
    <div className="settings">
      <h4>{s.title}</h4>

      <div className="field">
        <div className="field-label">{s.cardSize}</div>
        <div className="seg-3">
          {SIZES.map((sz) => (
            <button
              key={sz.id}
              className={`seg ${size === sz.id ? "active" : ""}`}
              onClick={() => setSize(sz.id)}
            >
              <div className="seg-grid" data-grid={sz.id} />
              <div className="seg-text">
                <strong>{sz.id}</strong>
                <span>({sz.sub})</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">{s.labelsField}</div>
        <div className="seg-2">
          <button
            className={`seg ${showLabels ? "active" : ""}`}
            onClick={() => setShowLabels(true)}
          >
            <strong>A</strong> {s.withLabels}
          </button>
          <button
            className={`seg ${!showLabels ? "active" : ""}`}
            onClick={() => setShowLabels(false)}
          >
            <span className="strike">A</span> {s.withoutLabels}
          </button>
        </div>
      </div>

      <div className="field">
        <div className="field-label">{s.orientation}</div>
        <div className="seg-2">
          <button
            className={`seg ${orientation === "portrait" ? "active" : ""}`}
            onClick={() => setOrientation("portrait")}
          >
            <span className="orient portrait" /> {s.portrait}
          </button>
          <button
            className={`seg ${orientation === "landscape" ? "active" : ""}`}
            onClick={() => setOrientation("landscape")}
          >
            <span className="orient landscape" /> {s.landscape}
          </button>
        </div>
      </div>

      <div className="field">
        <div className="field-label">{s.cutMarksField}</div>
        <div className="seg-2">
          <button
            className={`seg ${cutMarks ? "active" : ""}`}
            onClick={() => setCutMarks(true)}
          >
            <IconScissors size={14} /> {s.withCutMarks}
          </button>
          <button
            className={`seg ${!cutMarks ? "active" : ""}`}
            onClick={() => setCutMarks(false)}
          >
            {s.withoutCutMarks}
          </button>
        </div>
      </div>

      <div className="field">
        <div className="field-label">{s.cmykField}</div>
        <div className="seg-2">
          <button
            className={`seg ${cmyk ? "active" : ""}`}
            onClick={() => setCmyk(true)}
          >
            {s.cmykOn}
          </button>
          <button
            className={`seg ${!cmyk ? "active" : ""}`}
            onClick={() => setCmyk(false)}
          >
            {s.cmykOff}
          </button>
        </div>
        {cmyk && <p className="field-note">{s.cmykNote}</p>}
      </div>
    </div>
  );
}
