import Modal from "./Modal";
import { useT } from "../utils/I18nContext";

type Props = {
  open: boolean;
  name: string;
  cardCount: number;
  onImport: () => void;
  onClose: () => void;
};

export default function ImportSetModal({ open, name, cardCount, onImport, onClose }: Props) {
  const t = useT();
  return (
    <Modal open={open} title={t.share.importTitle} onClose={onClose} width={440}>
      <p style={{ marginBottom: 20 }}>{t.share.importText(name, cardCount)}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn-ghost" onClick={onClose}>{t.common.cancel}</button>
        <button className="btn-primary" onClick={onImport}>{t.share.importBtn}</button>
      </div>
    </Modal>
  );
}
