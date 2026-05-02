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
import { IconClose, IconDrag, IconPlus, IconTrash, IconDownload, IconEye } from "./Icons";

type Props = {
  cards: CardT[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onAddCustom: () => void;
  onDownloadPdf: () => void;
  onPreviewPdf: () => void;
};

export default function SelectedPanel({
  cards,
  onClear,
  onRemove,
  onAddCustom,
  onDownloadPdf,
  onPreviewPdf,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "drop-selected" });

  return (
    <div ref={setNodeRef} className={`sel-panel ${isOver ? "is-over" : ""}`}>
      <div className="sel-head">
        <h3>
          Мой набор <span className="sel-count-pill">({cards.length})</span>
        </h3>
        <button className="link-btn danger" onClick={onClear} disabled={cards.length === 0}>
          <IconTrash size={14} />
          <span>Очистить</span>
        </button>
      </div>

      <p className="muted small">
        Перетаскивайте карточки из библиотеки или меняйте порядок
      </p>

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
            <span>Добавить карточку</span>
          </button>
        </div>
      </SortableContext>

      <div className="sel-count-row">
        <span className="info-dot" />
        <span>Выбрано: {cards.length} карточек</span>
      </div>

      <button
        className="btn-primary block"
        onClick={onDownloadPdf}
        disabled={cards.length === 0}
      >
        <IconDownload size={16} />
        <span>Скачать PDF</span>
      </button>

      <button
        className="btn-ghost block"
        onClick={onPreviewPdf}
        disabled={cards.length === 0}
      >
        <IconEye size={16} />
        <span>Предпросмотр PDF</span>
      </button>
    </div>
  );
}

function SortableTile({ card, onRemove }: { card: CardT; onRemove: () => void }) {
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
        aria-label="Удалить"
      >
        <IconClose size={12} />
      </button>
      <div className="sel-img">
        {failed || !card.image ? (
          <div className="img-placeholder small">
            <span>{card.label}</span>
          </div>
        ) : (
          <img src={card.image} alt={card.label} onError={() => setFailed(true)} />
        )}
      </div>
      <div className="sel-label">{card.label}</div>
    </div>
  );
}
