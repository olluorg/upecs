import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import PrintSettings from "./PrintSettings";
import type { Card, PrintSize, Orientation } from "../types";
import { downloadPdf, pdfBlob, type LabelResolver } from "../utils/generatePdf";
import { IconDownload, IconPrint } from "./Icons";
import { useT } from "../utils/I18nContext";

type Props = {
  open: boolean;
  onClose: () => void;
  cards: Card[];
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
  onPrint: () => void;
  getLabel?: LabelResolver;
};

export default function PrintAndPreviewModal({
  open, onClose, cards,
  size, setSize, showLabels, setShowLabels,
  orientation, setOrientation, cutMarks, setCutMarks, cmyk, setCmyk,
  onPrint, getLabel,
}: Props) {
  const t = useT();
  const p = t.pdfModal;
  const [step, setStep] = useState<"settings" | "preview">("settings");
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canPreview = navigator.pdfViewerEnabled;

  const opts = useMemo(
    () => ({ size, orientation, showLabels, cutMarks, cmyk }),
    [size, orientation, showLabels, cutMarks, cmyk],
  );

  useEffect(() => {
    if (open) setStep("settings");
  }, [open]);

  const isDesktop = () => window.matchMedia("(min-width: 721px)").matches;

  useEffect(() => {
    const active = open && cards.length > 0 && (step === "preview" || (isDesktop() && canPreview));
    if (!active) {
      setUrl(null);
      return;
    }

    let canceled = false;
    let createdUrl: string | null = null;
    setBusy(true);
    setUrl(null);

    pdfBlob(cards, opts, getLabel)
      .then((blob) => {
        if (canceled) return;
        createdUrl = URL.createObjectURL(blob);
        setUrl(createdUrl);
        setBusy(false);
      })
      .catch(() => {
        if (!canceled) setBusy(false);
      });

    return () => {
      canceled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, cards, opts, getLabel, step]);

  const handleDownload = () => downloadPdf(cards, opts, getLabel);

  return (
    <Modal open={open} title={t.settings.title} onClose={onClose} width={960}>
      <div className="print-modal-body">
        <div className={`print-modal-settings ${step === "settings" ? "is-active" : ""}`}>
          <PrintSettings
            size={size} setSize={setSize}
            showLabels={showLabels} setShowLabels={setShowLabels}
            orientation={orientation} setOrientation={setOrientation}
            cutMarks={cutMarks} setCutMarks={setCutMarks}
            cmyk={cmyk} setCmyk={setCmyk}
          />
        </div>
        {canPreview && (
          <div className={`print-modal-preview ${step === "preview" ? "is-active" : ""}`}>
            <div className="pdf-preview">
              {busy && <div className="muted">{p.loading}</div>}
              {!busy && url && <iframe title={p.title} src={url} className="pdf-frame" />}
              {!busy && !url && cards.length === 0 && <div className="muted">{p.empty}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <div className="print-footer-mobile">
          {canPreview && step === "settings" ? (
            <>
              <button className="btn-ghost" onClick={onClose}>{t.common.cancel}</button>
              <button
                className="btn-primary"
                onClick={() => setStep("preview")}
                disabled={cards.length === 0}
              >
                {p.next}
              </button>
            </>
          ) : canPreview ? (
            <>
              <button className="btn-ghost" onClick={() => setStep("settings")}>{p.back}</button>
              <button className="btn-ghost" onClick={onPrint} disabled={cards.length === 0}>
                <IconPrint size={16} /><span>{p.print}</span>
              </button>
              <button className="btn-primary" onClick={handleDownload} disabled={cards.length === 0}>
                <IconDownload size={16} /><span>{p.download}</span>
              </button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={onClose}>{t.common.cancel}</button>
              <button className="btn-ghost" onClick={onPrint} disabled={cards.length === 0}>
                <IconPrint size={16} /><span>{p.print}</span>
              </button>
              <button className="btn-primary" onClick={handleDownload} disabled={cards.length === 0}>
                <IconDownload size={16} /><span>{p.download}</span>
              </button>
            </>
          )}
        </div>
        <div className="print-footer-desktop">
          <button className="btn-ghost" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn-ghost" onClick={onPrint} disabled={cards.length === 0}>
            <IconPrint size={16} /><span>{p.print}</span>
          </button>
          <button className="btn-primary" onClick={handleDownload} disabled={cards.length === 0}>
            <IconDownload size={16} /><span>{p.download}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
