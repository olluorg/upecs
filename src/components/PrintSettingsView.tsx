import type { PrintSize, Orientation } from "../types";
import PrintSettings from "./PrintSettings";
import { IconDownload, IconPrint } from "./Icons";
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
  selectedCount: number;
  onDownloadPdf: () => void;
  onPrint: () => void;
};

export default function PrintSettingsView(props: Props) {
  const t = useT();
  const s = t.settings;

  return (
    <div className="settings-view">
      <div className="library-head">
        <div>
          <h1>{s.title}</h1>
          <p className="muted">{s.subtitle}</p>
        </div>
      </div>

      <div className="settings-card">
        <PrintSettings
          size={props.size}
          setSize={props.setSize}
          showLabels={props.showLabels}
          setShowLabels={props.setShowLabels}
          orientation={props.orientation}
          setOrientation={props.setOrientation}
          cutMarks={props.cutMarks}
          setCutMarks={props.setCutMarks}
          cmyk={props.cmyk}
          setCmyk={props.setCmyk}
        />

        <div className="settings-summary">
          <div>
            {s.inSet} <b>{props.selectedCount} {s.cards}</b>
          </div>
          <div className="myset-actions">
            <button
              className="btn-ghost"
              onClick={props.onPrint}
              disabled={props.selectedCount === 0}
            >
              <IconPrint size={14} /> {s.print}
            </button>
            <button
              className="btn-primary"
              onClick={props.onDownloadPdf}
              disabled={props.selectedCount === 0}
            >
              <IconDownload size={14} /> {s.download}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
