import Modal from "./Modal";
import { useT } from "../utils/I18nContext";

type Props = { open: boolean; onClose: () => void };

export default function PrintTipsModal({ open, onClose }: Props) {
  const t = useT();
  const p = t.printTips;

  return (
    <Modal open={open} title={p.title} onClose={onClose} width={520}>
      <div className="tips">
        <h4>{p.paperTitle}</h4>
        <p>{p.paperText}</p>

        <h4>{p.laminateTitle}</h4>
        <p>{p.laminateText}</p>

        <h4>{p.mountTitle}</h4>
        <p>{p.mountText}</p>

        <h4>{p.sizeTitle}</h4>
        <ul>
          <li><b>2×2</b> — {p.size2x2}</li>
          <li><b>3×3</b> — {p.size3x3}</li>
          <li><b>4×4</b> — {p.size4x4}</li>
        </ul>

        <h4>{p.tipTitle}</h4>
        <p>{p.tipText}</p>
      </div>
    </Modal>
  );
}
