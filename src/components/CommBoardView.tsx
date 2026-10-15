import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CATEGORIES, CATEGORY_COLORS } from "../data/categories";
import { useT } from "../utils/I18nContext";
import { getCardLabel } from "../utils/cardLabel";
import { checkAIAvailability, composeSentence } from "../utils/chromeAI";
import {
  loadAudioManifest,
  speakText,
  speakCard,
  speakCards,
  stopSpeaking,
  warmUpVoices,
  listVoices,
  getSpeechSettings,
  setSpeechSettings,
  subscribeSpeechSettings,
  RATE_MIN,
  RATE_MAX,
  type SpeechSettings,
} from "../utils/speech";
import {
  IconChevronLeft,
  IconVolume,
  IconVolumeOff,
  IconTrash,
  IconMessageSquare,
  IconGrid,
  IconClose,
  IconSparkles,
  IconSearch,
  IconStar,
  IconBackspace,
  IconRepeat,
  IconMaximize,
  IconMinimize,
  IconLock,
  IconSettings,
} from "./Icons";

type SentenceItem = { uid: string; card: Card };
type DragPayload =
  | { type: "grid"; card: Card }
  | { type: "sentence"; item: SentenceItem };
type AIStatus = "unavailable" | "ready" | "downloading";
type CardSize = "s" | "m" | "l";

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

const CARD_MIN_PX: Record<CardSize, number> = { s: 88, m: 110, l: 156 };
const CARD_IMG_PX: Record<CardSize, number> = { s: 56, m: 72, l: 108 };

const FREQUENT_ID = "__frequent";
const FREQUENT_LIMIT = 12;
/** Сколько раз карточку нужно выбрать, чтобы она попала в «Часто». */
const FREQUENT_MIN_HITS = 2;
/** Сколько держать кнопку выхода в режиме ребёнка, мс. */
const KIOSK_EXIT_HOLD_MS = 2000;

// ── Локальное хранилище доски ────────────────────────────────────────────────

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* приватный режим — просто не сохраняем */
  }
}

const SENTENCE_KEY = "pecs:commboard_sentence";
const PREFS_KEY = "pecs:commboard_prefs";
const FREQ_KEY = "pecs:commboard_freq";

type BoardPrefs = { cardSize: CardSize; autoSpeak: boolean; aiEnabled: boolean };
const DEFAULT_PREFS: BoardPrefs = { cardSize: "m", autoSpeak: true, aiEnabled: true };

let uidCounter = 0;
const newUid = () => `si_${++uidCounter}`;

export default function CommBoardView({ cards, onBack }: Props) {
  const t = useT();
  const cb = t.commboard;

  const [prefs, setPrefsState] = useState<BoardPrefs>(() => ({
    ...DEFAULT_PREFS,
    ...readJson<Partial<BoardPrefs>>(PREFS_KEY, {}),
  }));
  const setPrefs = useCallback((patch: Partial<BoardPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      writeJson(PREFS_KEY, next);
      return next;
    });
  }, []);

  // Фраза переживает перезагрузку: ребёнок может вернуться к ней позже,
  // а взрослый — случайно закрыть вкладку.
  const [sentence, setSentence] = useState<SentenceItem[]>(() => {
    const ids = readJson<string[]>(SENTENCE_KEY, []);
    return ids
      .map((id) => {
        const card = cards.find((c) => c.id === id);
        return card ? { uid: newUid(), card } : null;
      })
      .filter((item): item is SentenceItem => item !== null);
  });

  const [freq, setFreq] = useState<Record<string, number>>(() =>
    readJson<Record<string, number>>(FREQ_KEY, {}),
  );

  const [aiStatus, setAIStatus] = useState<AIStatus>("unavailable");
  const [composing, setComposing] = useState(false);
  // Фраза от ИИ привязана к конкретному набору слов: как только набор меняется,
  // старая формулировка перестаёт подходить и просто перестаёт показываться.
  const [composed, setComposed] = useState<{ key: string; text: string } | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [kiosk, setKiosk] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);

  const aiEnabled = prefs.aiEnabled;
  const autoSpeak = prefs.autoSpeak;

  const sentenceKey = useMemo(
    () => sentence.map((item) => item.card.id).join("|"),
    [sentence],
  );
  const composedText = composed?.key === sentenceKey ? composed.text : "";

  useEffect(() => {
    writeJson(SENTENCE_KEY, sentence.map((item) => item.card.id));
  }, [sentence]);

  useEffect(() => {
    loadAudioManifest();
    warmUpVoices();
    checkAIAvailability().then((status) => {
      if (status === "readily") setAIStatus("ready");
      else if (status === "after-download") setAIStatus("downloading");
      else setAIStatus("unavailable");
    });
    return () => stopSpeaking();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const frequentCards = useMemo(() => {
    return cards
      .filter((c) => (freq[c.id] ?? 0) >= FREQUENT_MIN_HITS)
      .sort((a, b) => (freq[b.id] ?? 0) - (freq[a.id] ?? 0))
      .slice(0, FREQUENT_LIMIT);
  }, [cards, freq]);

  const presentCategories = useMemo(() => {
    const cats = new Set(cards.map((c) => c.category));
    return CATEGORIES.filter((cat) => cat.id === "all" || cats.has(cat.id));
  }, [cards]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Поиск всегда идёт по всему набору — иначе легко «не найти» карточку,
    // которая просто лежит в другой категории.
    if (q) return cards.filter((c) => getCardLabel(t, c).toLowerCase().includes(q));
    if (activeCategory === FREQUENT_ID) return frequentCards;
    if (activeCategory === "all") return cards;
    return cards.filter((c) => c.category === activeCategory);
  }, [cards, activeCategory, query, frequentCards, t]);

  const bumpFrequency = useCallback((cardId: string) => {
    setFreq((prev) => {
      const next = { ...prev, [cardId]: (prev[cardId] ?? 0) + 1 };
      writeJson(FREQ_KEY, next);
      return next;
    });
  }, []);

  const addToSentence = (card: Card) => {
    setSentence((prev) => [...prev, { uid: newUid(), card }]);
    bumpFrequency(card.id);
    if (autoSpeak) {
      speakCard({ id: card.id, label: getCardLabel(t, card), custom: card.custom }, t.lang);
    }
  };

  const removeFromSentence = (uid: string) => {
    setSentence((prev) => prev.filter((item) => item.uid !== uid));
  };

  const removeLast = () => {
    setSentence((prev) => prev.slice(0, -1));
  };

  const speakWords = useCallback(() => {
    const list = sentence.map((item) => ({
      id: item.card.id,
      label: getCardLabel(t, item.card),
      custom: item.card.custom,
    }));
    speakCards(list, t.lang, { onIndex: setSpeakingIndex });
  }, [sentence, t]);

  const saySentence = async () => {
    if (!sentence.length) return;

    // Повторное нажатие не пересоставляет фразу — просто проигрывает готовую.
    if (composedText) {
      speakText(composedText, t.lang);
      return;
    }

    if (aiEnabled && aiStatus === "ready") {
      setComposing(true);
      try {
        const words = sentence.map((item) => getCardLabel(t, item.card));
        const text = await composeSentence(words, t.lang as "RU" | "EN");
        setComposed({ key: sentenceKey, text });
        speakText(text, t.lang);
      } catch {
        speakWords();
      } finally {
        setComposing(false);
      }
      return;
    }

    speakWords();
  };

  // ── Режим ребёнка ──────────────────────────────────────────────────────────

  const enterKiosk = () => {
    setSettingsOpen(false);
    setKiosk(true);
    document.documentElement.requestFullscreen?.().catch(() => {
      /* браузер может отказать — режим всё равно включается визуально */
    });
  };

  const exitKiosk = useCallback(() => {
    setKiosk(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  // Выход из полноэкранного режима по Esc должен снимать и режим ребёнка,
  // иначе доска залипает без видимой кнопки «Назад».
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setKiosk(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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
      bumpFrequency(card.id);
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

  const boardStyle = {
    "--cb-card-min": `${CARD_MIN_PX[prefs.cardSize]}px`,
    "--cb-card-img": `${CARD_IMG_PX[prefs.cardSize]}px`,
  } as CSSProperties;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`commboard ${kiosk ? "is-kiosk" : ""}`} style={boardStyle}>
        <div className="commboard-header">
          {kiosk ? (
            <HoldToExitButton label={cb.kioskExit} hint={cb.kioskHint} onExit={exitKiosk} />
          ) : (
            <button className="commboard-back btn-ghost" onClick={onBack}>
              <IconChevronLeft size={18} />
              <span>{cb.back}</span>
            </button>
          )}
          <h1 className="commboard-title">{cb.title}</h1>
          <div className="commboard-header-controls">
            {!kiosk && aiStatus !== "unavailable" && (
              <button
                className={`ai-toggle-btn ${aiEnabled && aiStatus === "ready" ? "active" : ""}`}
                onClick={() => setPrefs({ aiEnabled: !aiEnabled })}
                disabled={aiStatus === "downloading"}
                title={aiStatus === "downloading" ? cb.aiDownloading : cb.aiLabel}
              >
                <IconSparkles size={14} />
                <span>{cb.aiLabel}</span>
              </button>
            )}
            <div className="commboard-speak-toggle">
              {autoSpeak ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
              <span>{cb.speak}</span>
              <button
                className={`toggle-pill ${autoSpeak ? "on" : ""}`}
                onClick={() => setPrefs({ autoSpeak: !autoSpeak })}
                aria-label={cb.speak}
              />
            </div>
            {!kiosk && (
              <SpeechSettingsMenu
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                cardSize={prefs.cardSize}
                onCardSize={(cardSize) => setPrefs({ cardSize })}
              />
            )}
            <button
              className="commboard-icon-btn"
              onClick={kiosk ? exitKiosk : enterKiosk}
              title={kiosk ? cb.kioskExit : cb.kiosk}
              aria-label={kiosk ? cb.kioskExit : cb.kiosk}
            >
              {kiosk ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
            </button>
          </div>
        </div>

        <SentenceBar
          sentence={sentence}
          cb={cb}
          t={t}
          isDraggingFromGrid={isDraggingFromGrid}
          speakingIndex={speakingIndex}
          onRemove={removeFromSentence}
          onRemoveLast={removeLast}
          onClear={() => {
            stopSpeaking();
            setSentence([]);
          }}
          onSay={saySentence}
          onRepeat={() => (composedText ? speakText(composedText, t.lang) : speakWords())}
          composing={composing}
          hasComposed={Boolean(composedText)}
        />
        {composedText && (
          <div className="composed-banner" role="status" aria-live="polite">
            <IconSparkles size={13} />
            <span>{cb.aiComposed}</span>
            <em>{composedText}</em>
          </div>
        )}

        {!kiosk && (
          <div className="commboard-searchbar">
            <div className="commboard-search">
              <IconSearch size={15} />
              <input
                type="search"
                value={query}
                placeholder={cb.searchPlaceholder}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim()) setActiveCategory("all");
                }}
              />
              {query && (
                <button
                  className="commboard-search-clear"
                  onClick={() => setQuery("")}
                  aria-label={cb.close}
                >
                  <IconClose size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="commboard-body">
          <div className="commboard-cats">
            {(frequentCards.length > 0 || activeCategory === FREQUENT_ID) && (
              <button
                className={`commboard-cat-btn ${activeCategory === FREQUENT_ID && !query ? "active" : ""}`}
                onClick={() => {
                  setQuery("");
                  setActiveCategory(FREQUENT_ID);
                }}
              >
                <span className="cat-icon">
                  <IconStar size={18} />
                </span>
                <span className="cat-label">{cb.frequent}</span>
              </button>
            )}
            {presentCategories.map((cat) => (
              <button
                key={cat.id}
                className={`commboard-cat-btn ${activeCategory === cat.id && !query ? "active" : ""}`}
                onClick={() => {
                  setQuery("");
                  setActiveCategory(cat.id);
                }}
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
                <p>{activeCategory === FREQUENT_ID && !query ? cb.frequentEmpty : t.library.nothingFound}</p>
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
          <div
            className="commboard-card drag-preview"
            style={CATEGORY_COLORS[dragPayload.card.category] ? { "--cat-color": CATEGORY_COLORS[dragPayload.card.category] } as CSSProperties : undefined}
          >
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

// ── Кнопка выхода из режима ребёнка ─────────────────────────────────────────
//
// Обычный тап ребёнок нажмёт случайно, поэтому выход — только удержанием.

function HoldToExitButton({
  label,
  hint,
  onExit,
}: {
  label: string;
  hint: string;
  onExit: () => void;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
  }, []);

  useEffect(() => cancel, [cancel]);

  const start = () => {
    setHolding(true);
    timer.current = setTimeout(() => {
      cancel();
      onExit();
    }, KIOSK_EXIT_HOLD_MS);
  };

  return (
    <button
      className={`kiosk-exit-btn ${holding ? "holding" : ""}`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      title={hint}
      aria-label={`${label} — ${hint}`}
      style={{ "--hold-ms": `${KIOSK_EXIT_HOLD_MS}ms` } as CSSProperties}
    >
      <span className="kiosk-exit-fill" />
      <IconLock size={16} />
      <span className="kiosk-exit-label">{label}</span>
    </button>
  );
}

// ── Настройки озвучки ────────────────────────────────────────────────────────

function SpeechSettingsMenu({
  open,
  onOpenChange,
  cardSize,
  onCardSize,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cardSize: CardSize;
  onCardSize: (size: CardSize) => void;
}) {
  const t = useT();
  const cb = t.commboard;
  const [speech, setSpeech] = useState<SpeechSettings>(getSpeechSettings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeSpeechSettings(setSpeech), []);

  useEffect(() => {
    if (!open) return;
    const refresh = () => setVoices(listVoices(t.lang));
    refresh();
    return warmUpVoices(refresh);
  }, [open, t.lang]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const langKey = t.lang === "RU" ? "ru" : "en";

  return (
    <div className="commboard-settings" ref={wrapRef}>
      <button
        className={`commboard-icon-btn ${open ? "active" : ""}`}
        onClick={() => onOpenChange(!open)}
        title={cb.voiceSettings}
        aria-label={cb.voiceSettings}
        aria-expanded={open}
      >
        <IconSettings size={18} />
      </button>

      {open && (
        <div className="commboard-popover" role="dialog" aria-label={cb.voiceSettings}>
          <div className="popover-row">
            <label>{cb.voiceSource}</label>
            <div className="segmented">
              <button
                className={!speech.preferSynth ? "active" : ""}
                onClick={() => setSpeechSettings({ preferSynth: false })}
              >
                {cb.voiceSourceRecorded}
              </button>
              <button
                className={speech.preferSynth ? "active" : ""}
                onClick={() => setSpeechSettings({ preferSynth: true })}
                disabled={voices.length === 0}
              >
                {cb.voiceSourceSystem}
              </button>
            </div>
            <p className="popover-note">{cb.voiceSourceHint}</p>
          </div>

          <div className="popover-row">
            <label htmlFor="cb-voice">{cb.voiceSelect}</label>
            {voices.length === 0 ? (
              <p className="popover-note">{cb.voiceNone}</p>
            ) : (
              <select
                id="cb-voice"
                value={speech.voiceURI[langKey] ?? ""}
                onChange={(e) => setSpeechSettings({ voiceURI: { [langKey]: e.target.value || null } })}
              >
                <option value="">{cb.voiceAuto}</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <SliderRow
            id="cb-rate"
            label={cb.voiceRate}
            min={RATE_MIN}
            max={RATE_MAX}
            step={0.05}
            value={speech.rate}
            format={(v) => `${v.toFixed(2)}×`}
            onChange={(rate) => setSpeechSettings({ rate })}
          />
          <SliderRow
            id="cb-pitch"
            label={cb.voicePitch}
            min={0.5}
            max={1.5}
            step={0.05}
            value={speech.pitch}
            format={(v) => v.toFixed(2)}
            onChange={(pitch) => setSpeechSettings({ pitch })}
          />
          <SliderRow
            id="cb-gap"
            label={cb.voiceGap}
            min={0}
            max={600}
            step={20}
            value={speech.gapMs}
            format={(v) => `${Math.round(v)} ${cb.voiceGapUnit}`}
            onChange={(gapMs) => setSpeechSettings({ gapMs })}
          />

          <div className="popover-row">
            <label>{cb.cardSize}</label>
            <div className="segmented">
              {(["s", "m", "l"] as CardSize[]).map((size) => (
                <button
                  key={size}
                  className={cardSize === size ? "active" : ""}
                  onClick={() => onCardSize(size)}
                >
                  {size === "s" ? cb.cardSizeS : size === "m" ? cb.cardSizeM : cb.cardSizeL}
                </button>
              ))}
            </div>
          </div>

          <div className="popover-actions">
            <button
              className="btn-ghost"
              onClick={() =>
                setSpeechSettings({ rate: 0.95, pitch: 1, gapMs: 140, voiceURI: { [langKey]: null } })
              }
            >
              {cb.voiceReset}
            </button>
            <button className="btn-primary" onClick={() => speakText(cb.voiceTestPhrase, t.lang)}>
              <IconVolume size={14} />
              {cb.voiceTest}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SliderRow({
  id,
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="popover-row">
      <label htmlFor={id}>
        {label}
        <span className="popover-value">{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ── Sentence bar ────────────────────────────────────────────────────────────

function SentenceBar({
  sentence,
  cb,
  t,
  isDraggingFromGrid,
  speakingIndex,
  onRemove,
  onRemoveLast,
  onClear,
  onSay,
  onRepeat,
  composing,
  hasComposed,
}: {
  sentence: SentenceItem[];
  cb: ReturnType<typeof useT>["commboard"];
  t: ReturnType<typeof useT>;
  isDraggingFromGrid: boolean;
  speakingIndex: number | null;
  onRemove: (uid: string) => void;
  onRemoveLast: () => void;
  onClear: () => void;
  onSay: () => void;
  onRepeat: () => void;
  composing: boolean;
  hasComposed: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "sentence-zone" });
  const empty = sentence.length === 0;

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
                speaking={speakingIndex === i}
                onRemove={() => onRemove(item.uid)}
              />
            </span>
          ))}
          {empty && isDraggingFromGrid && (
            <span className="sentence-drop-hint">{cb.promptSub}</span>
          )}
        </div>
      </SortableContext>

      <div className="sentence-actions">
        <button
          className="commboard-icon-btn"
          onClick={onRemoveLast}
          disabled={empty}
          title={cb.undo}
          aria-label={cb.undo}
        >
          <IconBackspace size={16} />
        </button>
        <button
          className="commboard-icon-btn"
          onClick={onRepeat}
          disabled={empty || composing}
          title={cb.repeat}
          aria-label={cb.repeat}
        >
          <IconRepeat size={16} />
        </button>
        <button
          className="commboard-icon-btn"
          onClick={onClear}
          disabled={empty}
          title={cb.clear}
          aria-label={cb.clear}
        >
          <IconTrash size={16} />
        </button>
        <button
          className="btn-primary commboard-say-btn"
          onClick={onSay}
          disabled={empty || composing}
        >
          {composing ? (
            <>
              <span className="ai-spinner" />
              {cb.aiComposing}
            </>
          ) : (
            <>
              {hasComposed ? <IconRepeat size={16} /> : <IconMessageSquare size={16} />}
              {cb.say}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Sortable sentence card ───────────────────────────────────────────────────

function SortableSentenceCard({
  item,
  label,
  speaking,
  onRemove,
}: {
  item: SentenceItem;
  label: string;
  speaking: boolean;
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
      <SentenceCardTile item={item} label={label} speaking={speaking} onRemove={onRemove} />
    </div>
  );
}

function SentenceCardTile({
  item,
  label,
  speaking,
  onRemove,
  isOverlay,
}: {
  item: SentenceItem;
  label: string;
  speaking?: boolean;
  onRemove: () => void;
  isOverlay?: boolean;
}) {
  const catColor = CATEGORY_COLORS[item.card.category];
  return (
    <div
      className={`sentence-card ${isOverlay ? "is-overlay" : ""} ${speaking ? "is-speaking" : ""}`}
      style={catColor ? { "--cat-color": catColor } as CSSProperties : undefined}
    >
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

  const catColor = CATEGORY_COLORS[card.category];
  return (
    <button
      ref={setNodeRef}
      className="commboard-card"
      style={{ opacity: isDragging ? 0.4 : 1, ...(catColor ? { "--cat-color": catColor } as CSSProperties : {}) }}
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
