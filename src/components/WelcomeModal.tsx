import Modal from "./Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenDocs: () => void;
};

export default function WelcomeModal({ open, onClose, onOpenDocs }: Props) {
  return (
    <Modal
      open={open}
      title="Добро пожаловать в PECS Конструктор"
      onClose={onClose}
      width={520}
    >
      <div className="welcome-v2">
        <p>
          Это бесплатный конструктор карточек <strong>PECS</strong> — системы
          общения через изображения. Подходит для детей с аутизмом, задержкой
          речи и любых ситуаций, когда слова пока не работают, а просьбу
          выразить нужно.
        </p>

        <div className="welcome-steps">
          <div className="welcome-step">
            <span className="welcome-step-num">1</span>
            <div>
              <strong>Выберите карточки</strong>
              <span>
                Из готовой библиотеки или загрузите свои фотографии
              </span>
            </div>
          </div>
          <div className="welcome-step">
            <span className="welcome-step-num">2</span>
            <div>
              <strong>Соберите набор</strong>
              <span>
                Перетаскивайте карточки в правую панель и меняйте порядок
              </span>
            </div>
          </div>
          <div className="welcome-step">
            <span className="welcome-step-num">3</span>
            <div>
              <strong>Распечатайте PDF</strong>
              <span>
                Сетка 2×2, 3×3 или 4×4, с подписями или без — на обычной A4
              </span>
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="btn-ghost" onClick={onOpenDocs}>
            Узнать больше о PECS
          </button>
          <button className="btn-primary" onClick={onClose}>
            Начать
          </button>
        </div>
      </div>
    </Modal>
  );
}
