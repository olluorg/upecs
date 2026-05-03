import type { PrintSize, Orientation } from "../types";
import PrintSettings from "./PrintSettings";
import { IconDownload, IconEye, IconPrint } from "./Icons";

type Props = {
  size: PrintSize;
  setSize: (s: PrintSize) => void;
  showLabels: boolean;
  setShowLabels: (b: boolean) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  selectedCount: number;
  onDownloadPdf: () => void;
  onPreviewPdf: () => void;
  onPrint: () => void;
};

export default function PrintSettingsView(props: Props) {
  return (
    <div className="settings-view">
      <div className="library-head">
        <div>
          <h1>Настройки печати</h1>
          <p className="muted">Выберите размер сетки, ориентацию и подписи</p>
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
        />

        <div className="settings-summary">
          <div>
            В наборе: <b>{props.selectedCount} карточек</b>
          </div>
          <div className="myset-actions">
            <button
              className="btn-ghost"
              onClick={props.onPreviewPdf}
              disabled={props.selectedCount === 0}
            >
              <IconEye size={14} /> Предпросмотр PDF
            </button>
            <button
              className="btn-ghost"
              onClick={props.onPrint}
              disabled={props.selectedCount === 0}
            >
              <IconPrint size={14} /> Печать
            </button>
            <button
              className="btn-primary"
              onClick={props.onDownloadPdf}
              disabled={props.selectedCount === 0}
            >
              <IconDownload size={14} /> Скачать PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
