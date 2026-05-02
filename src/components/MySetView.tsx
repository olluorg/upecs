import { useState } from "react";
import type { CSSProperties } from "react";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../types";
import { IconClose, IconDrag, IconPlus, IconTrash, IconDownload, IconEye } from "./Icons";

type Props = {
  cards: Card[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onAddCustom: () => void;
  onDownloadPdf: () => void;
  onPreviewPdf: () => void;
};

export default function MySetView({
  cards,
  onRemove,
  onClear,
  onAddCustom,
  onDownloadPdf,
  onPreviewPdf,
}: Props) {
  return (
    <div className="myset">
      <div className="library-head">
        <div>
          <h1>
            Мой набор <span className="muted small">({cards.length})</span>
          </h1>
          <p className="muted">Перетаскивайте карточки, чтобы изменить порядок</p>
        </div>
        <div className="myset-actions">
          <button className="btn-ghost" onClick={onClear} disabled={cards.length === 0}>
            <IconTrash size={14} /> Очистить
          </button>
          <button className="btn-ghost" onClick={onPreviewPdf} disabled={cards.length === 0}>
            <IconEye size={14} /> Предпросмотр
          </button>
          <button className="btn-primary" onClick={onDownloadPdf} disabled={cards.length === 0}>
            <IconDownload size={14} /> Скачать PDF
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty large">
          <p>В наборе пока пусто. Перейдите в библиотеку и добавьте карточки.</p>
        </div>
      ) : (
        <SortableContext items={cards.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="myset-grid">
            {cards.map((c) => (
              <SortableTile key={c.id} card={c} onRemove={() => onRemove(c.id)} />
            ))}
            <button
              className="sel-add big"
              onClick={onAddCustom}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <IconPlus size={26} />
              <span>Добавить карточку</span>
            </button>
          </div>
        </SortableContext>
      )}
    </div>
  );
}

function SortableTile({ card, onRemove }: { card: Card; onRemove: () => void }) {
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
    <div ref={setNodeRef} style={style} className="myset-tile" {...attributes} {...listeners}>
      <span className="sel-handle" aria-hidden>
        <IconDrag size={14} />
      </span>
      <button
        className="sel-x"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Удалить"
      >
        <IconClose size={14} />
      </button>
      <div className="myset-img">
        {failed || !card.image ? (
          <div className="img-placeholder">
            <span>{card.label}</span>
          </div>
        ) : (
          <img src={card.image} alt={card.label} onError={() => setFailed(true)} />
        )}
      </div>
      <div className="myset-label">{card.label}</div>
    </div>
  );
}
