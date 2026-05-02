import type { PrintSize, Orientation } from "../types";

type Props = {
  size: PrintSize;
  setSize: (s: PrintSize) => void;
  showLabels: boolean;
  setShowLabels: (b: boolean) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
};

const SIZES: { id: PrintSize; sub: string }[] = [
  { id: "2x2", sub: "крупные" },
  { id: "3x3", sub: "стандарт" },
  { id: "4x4", sub: "мелкие" },
];

export default function PrintSettings({
  size,
  setSize,
  showLabels,
  setShowLabels,
  orientation,
  setOrientation,
}: Props) {
  return (
    <div className="settings">
      <h4>Настройки печати</h4>

      <div className="field">
        <div className="field-label">Размер карточек на странице</div>
        <div className="seg-3">
          {SIZES.map((s) => (
            <button
              key={s.id}
              className={`seg ${size === s.id ? "active" : ""}`}
              onClick={() => setSize(s.id)}
            >
              <div className="seg-grid" data-grid={s.id} />
              <div className="seg-text">
                <strong>{s.id}</strong>
                <span>({s.sub})</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">Подписи</div>
        <div className="seg-2">
          <button
            className={`seg ${showLabels ? "active" : ""}`}
            onClick={() => setShowLabels(true)}
          >
            <strong>A</strong> С подписями
          </button>
          <button
            className={`seg ${!showLabels ? "active" : ""}`}
            onClick={() => setShowLabels(false)}
          >
            <span className="strike">A</span> Без подписей
          </button>
        </div>
      </div>

      <div className="field">
        <div className="field-label">Ориентация</div>
        <div className="seg-2">
          <button
            className={`seg ${orientation === "portrait" ? "active" : ""}`}
            onClick={() => setOrientation("portrait")}
          >
            <span className="orient portrait" /> Книжная
          </button>
          <button
            className={`seg ${orientation === "landscape" ? "active" : ""}`}
            onClick={() => setOrientation("landscape")}
          >
            <span className="orient landscape" /> Альбомная
          </button>
        </div>
      </div>
    </div>
  );
}
