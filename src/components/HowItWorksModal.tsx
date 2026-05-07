import Modal from "./Modal";
import { IconList, IconHand, IconUsers, IconHeart } from "./Icons";
import { useT } from "../utils/I18nContext";

const ICONS = [
  <IconList size={18} />,
  <IconHand size={18} />,
  <IconUsers size={18} />,
  <IconHeart size={18} />,
];

type Props = { open: boolean; onClose: () => void };

export default function HowItWorksModal({ open, onClose }: Props) {
  const t = useT();

  return (
    <Modal open={open} title={t.howItWorks.title} onClose={onClose} width={560}>
      <div className="steps">
        {t.howItWorks.steps.map((s, i) => (
          <div key={i} className="step">
            <span className="step-icon">{ICONS[i]}</span>
            <div>
              <div className="step-title">{s.title}</div>
              <div className="step-text">{s.text}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
