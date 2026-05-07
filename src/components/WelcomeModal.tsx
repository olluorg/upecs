import Modal from "./Modal";
import { useT } from "../utils/I18nContext";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenDocs: () => void;
};

export default function WelcomeModal({ open, onClose, onOpenDocs }: Props) {
  const t = useT();
  const w = t.welcome;

  return (
    <Modal open={open} title={w.title} onClose={onClose} width={520}>
      <div className="welcome-v2">
        <p>{w.intro}</p>

        <div className="welcome-steps">
          {[
            { title: w.step1Title, text: w.step1Text },
            { title: w.step2Title, text: w.step2Text },
            { title: w.step3Title, text: w.step3Text },
          ].map((s, i) => (
            <div key={i} className="welcome-step">
              <span className="welcome-step-num">{i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="welcome-actions">
          <button className="btn-ghost" onClick={onOpenDocs}>
            {w.learnMore}
          </button>
          <button className="btn-primary" onClick={onClose}>
            {w.start}
          </button>
        </div>
      </div>
    </Modal>
  );
}
