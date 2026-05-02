import Modal from "./Modal";
import { IconList, IconHand, IconDownload } from "./Icons";

type Action = "library" | "myset" | "settings";

type Props = {
  open: boolean;
  onClose: () => void;
  onChoose: (action: Action) => void;
  setCount: number;
};

export default function WelcomeModal({ open, onClose, onChoose, setCount }: Props) {
  return (
    <Modal open={open} title="Что хотите сделать?" onClose={onClose} width={520}>
      <div className="welcome">
        <p className="muted">
          Выбирайте готовые карточки из библиотеки и создавайте свои наборы для
          вашего ребёнка.
        </p>

        <div className="welcome-list">
          <button className="welcome-item" onClick={() => onChoose("library")}>
            <span className="welcome-icon blue">
              <IconList size={20} />
            </span>
            <div>
              <strong>Выбрать карточки из библиотеки</strong>
              <span>Просмотр и выбор готовых карточек</span>
            </div>
          </button>

          <button className="welcome-item" onClick={() => onChoose("myset")}>
            <span className="welcome-icon green">
              <IconHand size={20} />
            </span>
            <div>
              <strong>Мой набор</strong>
              <span>
                Смотреть выбранные карточки ({setCount})
              </span>
            </div>
          </button>

          <button className="welcome-item" onClick={() => onChoose("settings")}>
            <span className="welcome-icon purple">
              <IconDownload size={20} />
            </span>
            <div>
              <strong>Скачать PDF</strong>
              <span>Скачать и распечатать ваш набор</span>
            </div>
          </button>
        </div>

        <div className="hint">
          <span className="hint-dot" />
          <span>
            <b>Совет:</b> начните с 2–3 карточек, которые действительно
            интересуют вашего ребёнка.
          </span>
        </div>
      </div>
    </Modal>
  );
}
