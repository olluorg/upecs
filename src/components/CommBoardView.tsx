import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../types";
import { CATEGORIES } from "../data/categories";
import { useT } from "../utils/I18nContext";
import { getCardLabel } from "../utils/cardLabel";
import {
  IconChevronLeft,
  IconVolume,
  IconVolumeOff,
  IconTrash,
  IconMessageSquare,
  IconGrid,
  IconClose,
} from "./Icons";

type SentenceItem = { uid: string; card: Card };
type DragPayload =
  | { type: "grid"; card: Card }
  | { type: "sentence"; item: SentenceItem };

type Props = {
  cards: Card[];
  onBack: () => void;
};

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍎",
  drink: "🥤",
  actions: "✋",
  people: "👤",
  toys: "🏀",
  needs: "🚿",
  emotions: "😊",
  other: "📦",
};

let uidCounter = 0;
const newUid = () => `si_${++uidCounter}`;

export default function CommBoardView({ cards, onBack }: Props) {
  const t = useT();
  const cb = t.commboard;
  const [sentence, setSentence] = useState<SentenceItem[]>(() => {
    try {
      const saved = sessionStorage.getItem("commboard_sentence");
      if (!saved) return [];
      const ids: string[] = JSON.parse(saved);
      return ids
        .map((id) => {
          const card = cards.find((c) => c.id === id);
          return card ? { uid: newUid(), card } : null;
        })
        .filter((item): item is SentenceItem => item !== null);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem(
      "commboard_sentence",
      JSON.stringify(sentence.map((item) => item.card.id)),
    );
  }, [sentence]);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const presentCategories = useMemo(() => {
    const cats = new Set(cards.map((c) => c.category));
    return CATEGORIES.filter((cat) => cat.id === "all" || cats.has(cat.id));
  }, [cards]);

  const filteredCards = useMemo(() => {
    if (activeCategory === "all") return cards;
    return cards.filter((c) => c.category === activeCategory);
  }, [cards, activeCategory]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = t.lang === "RU" ? "ru-RU" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const addToSentence = (card: Card) => {
    setSentence((prev) => [...prev, { uid: newUid(), card }]);
    if (autoSpeak) speak(getCardLabel(t, card));
  };

  const removeFromSentence = (uid: string) => {
    setSentence((prev) => prev.filter((item) => item.uid !== uid));
  };

  const saySentence = () => {
    const text = sentence.map((item) => getCardLabel(t, item.card)).join(" ");
    if (text) speak(text);
  };

  const handleDragStart = (e: DragStartEvent) => {
    const activeId = String(e.active.id);
    if (activeId.startsWith("grid:")) {
      const cardId = activeId.slice(5);
      const card = cards.find((c) => c.id === cardId);
      if (card) setDragPayload({ type: "grid", card });
    } else {
      const item = sentence.find((s) => s.uid === activeId);
      if (item) setDragPayload({ type: "sentence", item });
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setDragPayload(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("grid:")) {
      const cardId = activeId.slice(5);
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      setSentence((prev) => {
        const newItem: SentenceItem = { uid: newUid(), card };
        const idx = prev.findIndex((s) => s.uid === overId);
        if (idx >= 0) {
          return [...prev.slice(0, idx), newItem, ...prev.slice(idx)];
        }
        return [...prev, newItem];
      });
      return;
    }

    // Reorder within sentence
    if (activeId !== overId) {
      setSentence((prev) => {
        const oldIdx = prev.findIndex((s) => s.uid === activeId);
        const newIdx = prev.findIndex((s) => s.uid === overId);
        if (oldIdx < 0 || newIdx < 0) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const isDraggingFromGrid = dragPayload?.type === "grid";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="commboard">
        <div className="commboard-header">
          <button className="commboard-back btn-ghost" onClick={onBack}>
            <IconChevronLeft size={18} />
            <span>{cb.back}</span>
          </button>
          <h1 className="commboard-title">{cb.title}</h1>
          <div className="commboard-speak-toggle">
            {autoSpeak ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
            <span>{cb.speak}</span>
            <button
              className={`toggle-pill ${autoSpeak ? "on" : ""}`}
              onClick={() => setAutoSpeak((v) => !v)}
              aria-label={cb.speak}
            />
          </div>
        </div>

        <SentenceBar
          sentence={sentence}
          cb={cb}
          t={t}
          isDraggingFromGrid={isDraggingFromGrid}
          onRemove={removeFromSentence}
          onClear={() => setSentence([])}
          onSay={saySentence}
        />

        <div className="commboard-body">
          <div className="commboard-cats">
            {presentCategories.map((cat) => (
              <button
                key={cat.id}
                className={`commboard-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="cat-icon">
                  {cat.id === "all" ? (
                    <IconGrid size={18} />
                  ) : (
                    <span className="cat-emoji">{CATEGORY_EMOJI[cat.id] ?? "📦"}</span>
                  )}
                </span>
                <span className="cat-label">{t.categories[cat.id] ?? cat.label}</span>
              </button>
            ))}
          </div>

          <div className="commboard-grid">
            {cards.length === 0 ? (
              <div className="empty large commboard-empty">
                <p>{cb.empty}</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="empty commboard-empty">
                <p>{t.library.nothingFound}</p>
              </div>
            ) : (
              filteredCards.map((card) => {
                const label = getCardLabel(t, card);
                return (
                  <DraggableGridCard
                    key={card.id}
                    card={card}
                    label={label}
                    onClick={() => addToSentence(card)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragPayload?.type === "grid" && (
          <div className="commboard-card drag-preview">
            <div className="commboard-card-img">
              {dragPayload.card.image ? (
                <img src={dragPayload.card.image} alt={getCardLabel(t, dragPayload.card)} />
              ) : (
                <div className="img-placeholder">
                  <span>{getCardLabel(t, dragPayload.card)}</span>
                </div>
              )}
            </div>
            <div className="commboard-card-label">{getCardLabel(t, dragPayload.card)}</div>
          </div>
        )}
        {dragPayload?.type === "sentence" && (
          <SentenceCardTile
            item={dragPayload.item}
            label={getCardLabel(t, dragPayload.item.card)}
            onRemove={() => {}}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ── Sentence bar ────────────────────────────────────────────────────────────

function SentenceBar({
  sentence,
  cb,
  t,
  isDraggingFromGrid,
  onRemove,
  onClear,
  onSay,
}: {
  sentence: SentenceItem[];
  cb: { promptTitle: string; promptSub: string; clear: string; say: string };
  t: ReturnType<typeof useT>;
  isDraggingFromGrid: boolean;
  onRemove: (uid: string) => void;
  onClear: () => void;
  onSay: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "sentence-zone" });

  return (
    <div className="commboard-sentence-bar">
      <div className="sentence-prompt">
        <span className="sentence-prompt-icon">🤚</span>
        <div className="sentence-prompt-text">
          <strong>{cb.promptTitle}</strong>
          <span>{cb.promptSub}</span>
        </div>
      </div>

      <SortableContext
        items={sentence.map((s) => s.uid)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`sentence-cards ${isDraggingFromGrid && isOver ? "drop-highlight" : ""} ${isDraggingFromGrid && !isOver ? "drop-ready" : ""}`}
        >
          {sentence.map((item, i) => (
            <span key={item.uid} className="sentence-item">
              {i > 0 && <span className="sentence-plus">+</span>}
              <SortableSentenceCard
                item={item}
                label={getCardLabel(t, item.card)}
                onRemove={() => onRemove(item.uid)}
              />
            </span>
          ))}
          {sentence.length === 0 && isDraggingFromGrid && (
            <span className="sentence-drop-hint">{cb.promptSub}</span>
          )}
        </div>
      </SortableContext>

      <div className="sentence-actions">
        <button
          className="btn-ghost"
          onClick={onClear}
          disabled={sentence.length === 0}
        >
          <IconTrash size={14} />
          <span>{cb.clear}</span>
        </button>
        <button
          className="btn-primary commboard-say-btn"
          onClick={onSay}
          disabled={sentence.length === 0}
        >
          <IconMessageSquare size={16} />
          {cb.say}
        </button>
      </div>
    </div>
  );
}

// ── Sortable sentence card ───────────────────────────────────────────────────

function SortableSentenceCard({
  item,
  label,
  onRemove,
}: {
  item: SentenceItem;
  label: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.uid });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SentenceCardTile item={item} label={label} onRemove={onRemove} />
    </div>
  );
}

function SentenceCardTile({
  item,
  label,
  onRemove,
  isOverlay,
}: {
  item: SentenceItem;
  label: string;
  onRemove: () => void;
  isOverlay?: boolean;
}) {
  return (
    <div className={`sentence-card ${isOverlay ? "is-overlay" : ""}`}>
      <button
        className="sentence-card-remove"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Удалить"
        tabIndex={-1}
      >
        <IconClose size={10} />
      </button>
      <span className="sentence-card-img">
        {item.card.image ? (
          <img src={item.card.image} alt={label} />
        ) : (
          <span className="sentence-card-placeholder">{label}</span>
        )}
      </span>
      <span className="sentence-card-label">{label}</span>
    </div>
  );
}

// ── Draggable grid card ──────────────────────────────────────────────────────

function DraggableGridCard({
  card,
  label,
  onClick,
}: {
  card: Card;
  label: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `grid:${card.id}`,
  });

  return (
    <button
      ref={setNodeRef}
      className="commboard-card"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="commboard-card-img">
        {card.image ? (
          <img src={card.image} alt={label} />
        ) : (
          <div className="img-placeholder">
            <span>{label}</span>
          </div>
        )}
      </div>
      <div className="commboard-card-label">{label}</div>
    </button>
  );
}
