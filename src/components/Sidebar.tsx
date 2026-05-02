import type { ReactNode } from "react";
import type { View } from "../types";
import { IconHome, IconList, IconSettings, IconInfo, IconHeart } from "./Icons";

type Props = {
  view: View;
  setView: (v: View) => void;
  selectedCount: number;
};

const items: { id: View; label: string; sub: string; icon: ReactNode }[] = [
  {
    id: "library",
    label: "Библиотека",
    sub: "Все карточки",
    icon: <IconHome size={18} />,
  },
  {
    id: "myset",
    label: "Мой набор",
    sub: "Выбранные карточки",
    icon: <IconList size={18} />,
  },
  {
    id: "settings",
    label: "Настройки печати",
    sub: "Размер, подписи, ориентация",
    icon: <IconSettings size={18} />,
  },
  {
    id: "instructions",
    label: "Инструкция",
    sub: "Как использовать PECS",
    icon: <IconInfo size={18} />,
  },
];

export default function Sidebar({ view, setView, selectedCount }: Props) {
  return (
    <aside className="sidebar">
      <nav className="side-nav">
        {items.map((it) => (
          <button
            key={it.id}
            className={`side-nav-item ${view === it.id ? "active" : ""}`}
            onClick={() => setView(it.id)}
          >
            <span className="side-icon">{it.icon}</span>
            <span className="side-text">
              <span className="side-title">
                {it.label}
                {it.id === "myset" && selectedCount > 0 && (
                  <span className="side-badge">{selectedCount}</span>
                )}
              </span>
              <span className="side-sub">{it.sub}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="promo">
        <div className="promo-title">
          <span className="promo-heart">
            <IconHeart size={16} />
          </span>
          PECS помогает детям выразить свои желания
        </div>
        <p className="promo-text">
          Начните с 2–3 карточек, которые ребёнок очень хочет. Постепенно
          добавляйте новые.
        </p>
        <img src="/boy.png" alt="" />
      </div>

      <div className="side-footer">
        <span className="promo-heart small">
          <IconHeart size={14} />
        </span>
        <div>
          <div className="footer-title">Сделано с заботой</div>
          <div className="footer-sub">
            Бесплатный инструмент для помощи детям и родителям
          </div>
        </div>
      </div>
    </aside>
  );
}
