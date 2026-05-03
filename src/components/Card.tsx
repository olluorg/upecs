import { useState } from "react";
import type { CSSProperties, KeyboardEvent as RKeyboardEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Card as CardT } from "../types";
import { IconPlus, IconCheck } from "./Icons";

type Props = {
  card: CardT;
  selected: boolean;
  onToggle: () => void;
  tabIndex?: number;
  onMouseEnter?: () => void;
};

export default function Card({
  card,
  selected,
  onToggle,
  tabIndex,
  onMouseEnter,
}: Props) {
  const [failed, setFailed] = useState(false);
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
        {selected ? <IconCheck size={14} /> : <IconPlus size={14} />}
      </button>

      <div className="card-img">
        {failed || !card.image ? (
          <div className="img-placeholder">
            <span>{card.label}</span>
          </div>
        ) : (
          <img src={card.image} alt={card.label} onError={() => setFailed(true)} />
        )}
      </div>
      <div className="card-label">{card.label}</div>
    </div>
  );
}
