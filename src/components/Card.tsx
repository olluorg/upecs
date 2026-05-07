import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as RKeyboardEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Card as CardT } from "../types";
import { IconPlus, IconCheck, IconPencil, IconTrash, IconDots } from "./Icons";

type Props = {
  card: CardT;
  selected: boolean;
  onToggle: () => void;
  tabIndex?: number;
  onMouseEnter?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function Card({
  card,
  selected,
  onToggle,
  tabIndex,
  onMouseEnter,
  onEdit,
  onDelete,
}: Props) {
  const [failed, setFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib:${card.id}`,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
  };

  const handleKey = (e: RKeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-tile ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
      onKeyDown={handleKey}
      onMouseEnter={onMouseEnter}
      {...attributes}
      {...listeners}
      tabIndex={tabIndex ?? 0}
    >
      <div className="card-img">
        {failed || !card.image ? (
          <div className="img-placeholder">
            <span>{card.label}</span>
          </div>
        ) : (
          <img src={card.image} alt={card.label} onError={() => setFailed(true)} />
        )}
        <div className="card-img-overlay">
          <button
            className={`card-add ${selected ? "is-on" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={selected ? "Убрать из набора" : "Добавить в набор"}
            tabIndex={-1}
          >
            {selected ? <IconCheck size={18} /> : <IconPlus size={18} />}
          </button>
        </div>
      </div>
      <div className="card-label">{card.label}</div>
      {card.custom && (onEdit || onDelete) && (
        <div ref={menuRef} className="card-menu-wrap">
          <button
            className="card-menu-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label="Действия с карточкой"
          >
            <IconDots size={14} />
          </button>
          {menuOpen && (
            <div className="card-menu">
              {onEdit && (
                <button
                  className="card-menu-item"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                >
                  <IconPencil size={13} /> Редактировать
                </button>
              )}
              {onDelete && (
                <button
                  className="card-menu-item danger"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                >
                  <IconTrash size={13} /> Удалить
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
