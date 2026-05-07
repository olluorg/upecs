import { useEffect, useState } from "react";
import Modal from "./Modal";
import type { Card, PrintOpts } from "../types";
import { downloadPdf, pdfBlob, type LabelResolver } from "../utils/generatePdf";
import { IconDownload, IconPrint } from "./Icons";
import { useT } from "../utils/I18nContext";

type Props = {
  open: boolean;
  onClose: () => void;
  cards: Card[];
  opts: PrintOpts;
  onPrint: () => void;
  getLabel?: LabelResolver;
};

export default function PdfPreviewModal({ open, onClose, cards, opts, onPrint, getLabel }: Props) {
  const t = useT();
  const p = t.pdfModal;
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || cards.length === 0) {
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
  }, [open, cards, opts, getLabel]);

  const labelsStr = opts.showLabels ? p.withLabels : p.withoutLabels;
  const orientStr = opts.orientation === "portrait" ? p.portrait : p.landscape;
  const subtitle = `${opts.size}, ${labelsStr}, ${orientStr}`;

  return (
    <Modal open={open} title={`${p.title} (${subtitle})`} onClose={onClose} width={780}>
      <div className="pdf-preview">
        {busy && <div className="muted">{p.loading}</div>}
        {!busy && url && (
          <iframe title={p.title} src={url} className="pdf-frame" />
        )}
        {!busy && !url && cards.length === 0 && (
          <div className="muted">{p.empty}</div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn-ghost" onClick={onClose}>{p.back}</button>
        <button
          className="btn-ghost"
          onClick={onPrint}
          disabled={cards.length === 0}
        >
          <IconPrint size={16} />
          <span>{p.print}</span>
        </button>
        <button
          className="btn-primary"
          onClick={() => downloadPdf(cards, opts, getLabel)}
          disabled={cards.length === 0}
        >
          <IconDownload size={16} />
          <span>{p.download}</span>
        </button>
      </div>
    </Modal>
  );
}
