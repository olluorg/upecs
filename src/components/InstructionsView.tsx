import { IconStar, IconHand, IconUsers, IconHeart, IconSparkles } from "./Icons";

const STEPS = [
  {
    icon: <IconStar size={20} />,
    title: "1. Выберите карточки",
    text: "Начните с 2–3 карточек, которые ваш ребёнок очень хочет.",
  },
  {
    icon: <IconHand size={20} />,
    title: "2. Предложите выбор",
    text: "Покажите карточки и дайте ребёнку возможность выбрать.",
  },
  {
    icon: <IconUsers size={20} />,
    title: "3. Помогите обменять",
    text: "Помогите ребёнку передать карточку вам.",
  },
  {
    icon: <IconHeart size={20} />,
    title: "4. Дайте желаемое",
    text: "Сразу дайте то, что ребёнок попросил. Похвалите его!",
  },
];

export default function InstructionsView() {
  return (
    <div className="instructions">
      <h1>Как использовать PECS</h1>
      <p className="muted">
        Простая пошаговая инструкция для родителей и педагогов.
      </p>

      <div className="instr-list">
        {STEPS.map((s) => (
          <div key={s.title} className="instr-row">
            <span className="instr-icon">{s.icon}</span>
            <div>
              <div className="instr-title">{s.title}</div>
              <div className="instr-text">{s.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="instr-tip">
        <IconSparkles size={18} />
        <span>
          Постепенно добавляйте новые карточки и расширяйте коммуникацию.
        </span>
      </div>
    </div>
  );
}
