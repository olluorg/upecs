import { useEffect, useState } from "react";
import Modal from "./Modal";
import type { Card, PrintOpts } from "../types";
import { downloadPdf, pdfBlob } from "../utils/generatePdf";
import { IconDownload } from "./Icons";

type Props = {
  open: boolean;
  onClose: () => void;
  cards: Card[];
  opts: PrintOpts;
};

export default function PdfPreviewModal({ open, onClose, cards, opts }: Props) {
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
    pdfBlob(cards, opts)
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
  }, [open, cards, opts]);

  const subtitle = `${opts.size}, ${opts.showLabels ? "с подписями" : "без подписей"}, ${opts.orientation === "portrait" ? "книжная" : "альбомная"}`;

  return (
    <Modal open={open} title={`Предпросмотр PDF (${subtitle})`} onClose={onClose} width={780}>
      <div className="pdf-preview">
        {busy && <div className="muted">Готовлю предпросмотр...</div>}
        {!busy && url && (
          <iframe title="PDF предпросмотр" src={url} className="pdf-frame" />
        )}
        {!busy && !url && cards.length === 0 && (
          <div className="muted">Сначала добавьте карточки в набор.</div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn-ghost" onClick={onClose}>Назад</button>
        <button
          className="btn-primary"
          onClick={() => downloadPdf(cards, opts)}
          disabled={cards.length === 0}
        >
          <IconDownload size={16} />
          <span>Скачать PDF</span>
        </button>
      </div>
    </Modal>
  );
}
