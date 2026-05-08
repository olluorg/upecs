import { useState } from "react";
import type { CSSProperties } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card as CardT } from "../types";
import { IconClose, IconDrag, IconPlus, IconTrash } from "./Icons";
import { useT } from "../utils/I18nContext";
import { getCardLabel } from "../utils/cardLabel";

type SetOption = { id: string; name: string };

type Props = {
  cards: CardT[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onAddCustom: () => void;
  sets: SetOption[];
  currentSetId: string;
  onSwitchSet: (id: string) => void;
};

export default function SelectedPanel({
  cards,
  onClear,
  onRemove,
  onAddCustom,
  sets,
  currentSetId,
  onSwitchSet,
}: Props) {
  const t = useT();
  const s = t.selected;
  const { setNodeRef, isOver } = useDroppable({ id: "drop-selected" });

  return (
    <div ref={setNodeRef} className={`sel-panel ${isOver ? "is-over" : ""}`}>
      <div className="sel-head">
        <div className="sel-title">
          {sets.length > 1 ? (
            <select
              className="set-switcher"
              value={currentSetId}
              onChange={(e) => onSwitchSet(e.target.value)}
              aria-label="Switch set"
            >
              {sets.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          ) : (
            <h3>{sets[0]?.name ?? s.fallbackName}</h3>
          )}
          <span className="sel-count-pill">({cards.length})</span>
        </div>
        <button className="link-btn danger" onClick={onClear} disabled={cards.length === 0}>
          <IconTrash size={14} />
          <span>{s.clear}</span>
        </button>
      </div>

      <p className="muted small">{s.dragHint}</p>

      <SortableContext items={cards.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="sel-grid">
          {cards.map((c) => (
            <SortableTile key={c.id} card={c} onRemove={() => onRemove(c.id)} />
          ))}
          <button
            className="sel-add"
            onClick={onAddCustom}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <IconPlus size={20} />
            <span>{s.addCard}</span>
          </button>
        </div>
      </SortableContext>

      <div className="sel-count-row">
        <span className="info-dot" />
        <span>{s.selectedCount(cards.length)}</span>
      </div>
    </div>
  );
}

function SortableTile({ card, onRemove }: { card: CardT; onRemove: () => void }) {
  const t = useT();
  const label = getCardLabel(t, card);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });
  const [failed, setFailed] = useState(false);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="sel-tile" {...attributes} {...listeners}>
      <span className="sel-handle" aria-hidden>
        <IconDrag size={12} />
      </span>
      <button
        className="sel-x"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Remove"
      >
        <IconClose size={12} />
      </button>
      <div className="sel-img">
        {failed || !card.image ? (
          <div className="img-placeholder small">
            <span>{label}</span>
          </div>
        ) : (
          <img src={card.image} alt={label} onError={() => setFailed(true)} />
        )}
      </div>
      <div className="sel-label">{label}</div>
    </div>
  );
}
