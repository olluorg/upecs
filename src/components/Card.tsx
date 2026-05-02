import { useState } from "react";
import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Card as CardT } from "../types";
import { IconPlus } from "./Icons";

type Props = {
  card: CardT;
  selected: boolean;
  onAdd: () => void;
};

export default function Card({ card, selected, onAdd }: Props) {
  const [failed, setFailed] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib:${card.id}`,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-tile ${selected ? "is-selected" : ""}`}
      onClick={onAdd}
      {...attributes}
      {...listeners}
    >
      <button
        className={`card-add ${selected ? "is-on" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={selected ? "Уже в наборе" : "Добавить"}
      >
        <IconPlus size={14} />
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
