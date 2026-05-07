import { useState } from "react";
import type { CSSProperties } from "react";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../types";
import {
  IconClose,
  IconDrag,
  IconPlus,
  IconTrash,
  IconDownload,
  IconEye,
  IconPrint,
  IconChevronLeft,
  IconChevronRight,
  IconGrid,
} from "./Icons";
import { useT } from "../utils/I18nContext";
import { getCardLabel } from "../utils/cardLabel";

type SetOption = { id: string; name: string };

type Props = {
  cards: Card[];
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onClear: () => void;
  onAddCustom: () => void;
  onDownloadPdf: () => void;
  onPreviewPdf: () => void;
  onPrint: () => void;
  sets: SetOption[];
  currentSetId: string;
  onSwitchSet: (id: string) => void;
  onOpenBoard: () => void;
};

export default function MySetView({
  cards,
  onRemove,
  onMove,
  onClear,
  onAddCustom,
  onDownloadPdf,
  onPreviewPdf,
  onPrint,
  sets,
  currentSetId,
  onSwitchSet,
  onOpenBoard,
}: Props) {
  const t = useT();
  const m = t.myset;

  return (
    <div className="myset">
      <div className="library-head">
        <div>
          <h1 className="myset-title">
            {sets.length > 1 ? (
              <select
                className="set-switcher big"
                value={currentSetId}
                onChange={(e) => onSwitchSet(e.target.value)}
                aria-label="Switch set"
              >
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <span>{sets[0]?.name ?? t.selected.fallbackName}</span>
            )}
            <span className="muted small">{m.subtitle(cards.length)}</span>
          </h1>
          <p className="muted desktop-hint">{m.dragHint}</p>
          <p className="muted mobile-hint">{m.arrowHint}</p>
        </div>
        <div className="myset-actions">
          <button className="btn-ghost" onClick={onClear} disabled={cards.length === 0}>
            <IconTrash size={14} /> {m.clear}
          </button>
          <button className="btn-ghost" onClick={onPreviewPdf} disabled={cards.length === 0}>
            <IconEye size={14} /> {m.preview}
          </button>
          <button className="btn-ghost" onClick={onPrint} disabled={cards.length === 0}>
            <IconPrint size={14} /> {m.print}
          </button>
          <button className="btn-ghost" onClick={onOpenBoard} disabled={cards.length === 0}>
            <IconGrid size={14} /> {t.commboard.openBoard}
          </button>
          <button className="btn-primary" onClick={onDownloadPdf} disabled={cards.length === 0}>
            <IconDownload size={14} /> {m.download}
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty large">
          <p>{m.empty}</p>
        </div>
      ) : (
        <SortableContext items={cards.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="myset-grid">
            {cards.map((c, i) => (
              <SortableTile
                key={c.id}
                card={c}
                index={i}
                total={cards.length}
                onRemove={() => onRemove(c.id)}
                onMoveLeft={() => onMove(c.id, -1)}
                onMoveRight={() => onMove(c.id, 1)}
              />
            ))}
            <button
              className="sel-add big"
              onClick={onAddCustom}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <IconPlus size={26} />
              <span>{m.addCard}</span>
            </button>
          </div>
        </SortableContext>
      )}
    </div>
  );
}

function SortableTile({
  card,
  index,
  total,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: {
  card: Card;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  const t = useT();
  const m = t.myset;
  const label = getCardLabel(t, card);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  const [failed, setFailed] = useState(false);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  const stopProp = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div ref={setNodeRef} style={style} className="myset-tile" {...attributes} {...listeners}>
      <span className="sel-handle" aria-hidden>
        <IconDrag size={14} />
      </span>
      <button
        className="sel-x"
        onClick={onRemove}
        onPointerDown={stopProp}
        aria-label={m.remove}
      >
        <IconClose size={14} />
      </button>
      <div className="myset-img">
        {failed || !card.image ? (
          <div className="img-placeholder">
            <span>{label}</span>
          </div>
        ) : (
          <img src={card.image} alt={label} onError={() => setFailed(true)} />
        )}
      </div>
      <div className="myset-label">{label}</div>
      <div className="tile-arrows">
        <button
          className="tile-arrow"
          onClick={onMoveLeft}
          onPointerDown={stopProp}
          disabled={index === 0}
          aria-label={m.moveLeft}
        >
          <IconChevronLeft size={14} />
        </button>
        <button
          className="tile-arrow"
          onClick={onMoveRight}
          onPointerDown={stopProp}
          disabled={index === total - 1}
          aria-label={m.moveRight}
        >
          <IconChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
