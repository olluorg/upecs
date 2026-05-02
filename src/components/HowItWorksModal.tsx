import Modal from "./Modal";
import { IconList, IconHand, IconUsers, IconHeart } from "./Icons";

type Props = { open: boolean; onClose: () => void };

const STEPS = [
  {
    icon: <IconList size={18} />,
    title: "1. Выберите карточки",
    text: "Откройте библиотеку и добавьте карточки, которые ваш ребёнок очень хочет.",
  },
  {
    icon: <IconHand size={18} />,
    title: "2. Настройте печать",
    text: "Выберите размер сетки (2×2, 3×3 или 4×4), ориентацию и нужны ли подписи.",
  },
  {
    icon: <IconUsers size={18} />,
    title: "3. Скачайте PDF",
    text: "Нажмите «Скачать PDF» и распечатайте набор. Можно сначала открыть предпросмотр.",
  },
  {
    icon: <IconHeart size={18} />,
    title: "4. Используйте с ребёнком",
    text: "Вырежьте, заламинируйте и используйте на липучках или в папке PECS.",
  },
];

export default function HowItWorksModal({ open, onClose }: Props) {
  return (
    <Modal open={open} title="Как это работает?" onClose={onClose} width={560}>
      <div className="steps">
        {STEPS.map((s) => (
          <div key={s.title} className="step">
            <span className="step-icon">{s.icon}</span>
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
