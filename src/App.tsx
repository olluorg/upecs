import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import cardsData from "./data/cards.json";
import type {
  Card,
  CardSet,
  ModalKind,
  Orientation,
  PrintSize,
  View,
} from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Library from "./components/Library";
import SelectedPanel from "./components/SelectedPanel";
import MySetView from "./components/MySetView";
import SetsView from "./components/SetsView";
import PrintSettingsView from "./components/PrintSettingsView";
import InstructionsView from "./components/InstructionsView";
import PrintSettings from "./components/PrintSettings";
import AddCustomCardModal from "./components/AddCustomCardModal";
import PdfPreviewModal from "./components/PdfPreviewModal";
import HowItWorksModal from "./components/HowItWorksModal";
import PrintTipsModal from "./components/PrintTipsModal";
import WelcomeModal from "./components/WelcomeModal";
import { IconHeart } from "./components/Icons";
import { useIdbState } from "./utils/useIdbState";
import { idbGet } from "./utils/idb";
import { downloadPdf, printPdf } from "./utils/generatePdf";

const newId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function App() {
  const [sets, setSets, setsLoaded] = useIdbState<CardSet[]>("sets", []);
  const [currentSetId, setCurrentSetId, currentLoaded] = useIdbState<string>(
    "currentSetId",
    "",
  );
  const [customCards, setCustomCards, customLoaded] = useIdbState<Card[]>(
    "custom",
    [],
  );
  const [size, setSize, sizeLoaded] = useIdbState<PrintSize>("size", "3x3");
  const [showLabels, setShowLabels, labelsLoaded] = useIdbState<boolean>(
    "labels",
    true,
  );
  const [orientation, setOrientation, orientLoaded] = useIdbState<Orientation>(
    "orient",
    "portrait",
  );
  const [welcomeSeen, setWelcomeSeen, welcomeLoaded] = useIdbState<boolean>(
    "welcome",
    false,
  );

  const [view, setView] = useState<View>("library");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeDragCard, setActiveDragCard] = useState<Card | null>(null);
  const [activeDragKind, setActiveDragKind] = useState<"lib" | "sort" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Initialize / migrate sets once IDB has loaded
  useEffect(() => {
    if (!setsLoaded || sets.length > 0) return;
    let canceled = false;
    (async () => {
      const legacy = await idbGet<string[]>("selected").catch(() => undefined);
      if (canceled) return;
      const initial: CardSet = {
        id: newId("set"),
        name: "Мой набор",
        cardIds: Array.isArray(legacy) ? legacy : [],
      };
      setSets([initial]);
      setCurrentSetId(initial.id);
    })();
    return () => {
      canceled = true;
    };
  }, [setsLoaded, sets, setSets, setCurrentSetId]);

  // Make sure currentSetId always points to a real set
  useEffect(() => {
    if (sets.length === 0) return;
    if (!sets.some((s) => s.id === currentSetId)) {
      setCurrentSetId(sets[0].id);
    }
  }, [sets, currentSetId, setCurrentSetId]);

  const allLoaded =
    setsLoaded &&
    currentLoaded &&
    customLoaded &&
    sizeLoaded &&
    labelsLoaded &&
    orientLoaded &&
    welcomeLoaded;
  const appReady = allLoaded && sets.length > 0;

  const allCards: Card[] = useMemo(
    () => [...(cardsData as Card[]), ...customCards],
    [customCards],
  );

  const currentSet = useMemo(
    () => sets.find((s) => s.id === currentSetId) ?? sets[0] ?? null,
    [sets, currentSetId],
  );
  const selectedIds = currentSet?.cardIds ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCards.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (q && !c.label.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allCards, category, query]);

  const selectedCards = useMemo(() => {
    const map = new Map(allCards.map((c) => [c.id, c]));
    return selectedIds
      .map((id) => map.get(id))
      .filter((c): c is Card => Boolean(c));
  }, [selectedIds, allCards]);

  const updateCurrent = (fn: (ids: string[]) => string[]) => {
    if (!currentSet) return;
    const id = currentSet.id;
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, cardIds: fn(s.cardIds) } : s)),
    );
  };

  const toggleCard = (id: string) =>
    updateCurrent((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const removeCard = (id: string) =>
    updateCurrent((prev) => prev.filter((x) => x !== id));
  const clearSet = () => updateCurrent(() => []);

  const addCustom = (card: Card) => {
    setCustomCards((prev) => [...prev, card]);
    updateCurrent((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]));
  };

  // Set ops
  const createSetWithName = (name: string) => {
    const s: CardSet = { id: newId("set"), name, cardIds: [] };
    setSets((prev) => [...prev, s]);
    setCurrentSetId(s.id);
  };
  const renameSet = (id: string, name: string) => {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };
  const duplicateSet = (id: string) => {
    setSets((prev) => {
      const src = prev.find((s) => s.id === id);
      if (!src) return prev;
      const dup: CardSet = {
        id: newId("set"),
        name: src.name + " (копия)",
        cardIds: [...src.cardIds],
      };
      setCurrentSetId(dup.id);
      return [...prev, dup];
    });
  };
  const deleteSet = (id: string) => {
    setSets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const empty: CardSet = {
          id: newId("set"),
          name: "Мой набор",
          cardIds: [],
        };
        setCurrentSetId(empty.id);
        return [empty];
      }
      if (id === currentSetId) {
        setCurrentSetId(next[0].id);
      }
      return next;
    });
  };
  const switchSet = (id: string) => setCurrentSetId(id);

  const printOpts = useMemo(
    () => ({ size, orientation, showLabels }),
    [size, orientation, showLabels],
  );
  const onDownloadPdf = () => downloadPdf(selectedCards, printOpts);
  const onPreviewPdf = () => setModal("pdfPreview");
  const onPrint = () => printPdf(selectedCards, printOpts);

  const showRightPanel = view === "library";

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith("lib:")) {
      const cardId = id.slice(4);
      const card = allCards.find((c) => c.id === cardId);
      if (card) {
        setActiveDragCard(card);
        setActiveDragKind("lib");
      }
    } else {
      const card = allCards.find((c) => c.id === id);
      if (card) {
        setActiveDragCard(card);
        setActiveDragKind("sort");
      }
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragCard(null);
    setActiveDragKind(null);

    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    if (activeId.startsWith("lib:")) {
      const cardId = activeId.slice(4);
      updateCurrent((prev) => {
        if (prev.includes(cardId)) return prev;
        if (overId !== "drop-selected" && prev.includes(overId)) {
          const idx = prev.indexOf(overId);
          return [...prev.slice(0, idx), cardId, ...prev.slice(idx)];
        }
        return [...prev, cardId];
      });
      return;
    }

    if (activeId !== overId) {
      updateCurrent((prev) => {
        const oldIdx = prev.indexOf(activeId);
        const newIdx = prev.indexOf(overId);
        if (oldIdx < 0 || newIdx < 0) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const showWelcome = welcomeLoaded && !welcomeSeen;
  const dismissWelcome = (action?: View) => {
    setWelcomeSeen(true);
    if (action) setView(action);
  };

  const setOptions = sets.map((s) => ({ id: s.id, name: s.name }));

  if (!appReady) {
    return (
      <div className="splash">
        <div className="splash-logo">
          <span className="logo-mark">
            <IconHeart size={20} />
          </span>
          <div className="logo-text">
            <strong>PECS</strong>
            <span>КОНСТРУКТОР</span>
          </div>
        </div>
        <div className="splash-spinner" />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        onHowItWorks={() => setModal("how")}
        onPrintTips={() => setModal("tips")}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={`app-body ${showRightPanel ? "" : "no-right"}`}>
          <Sidebar
            view={view}
            setView={setView}
            selectedCount={selectedIds.length}
            setsCount={sets.length}
          />

          <main className="main">
            {view === "library" && (
              <Library
                cards={filtered}
                selectedIds={selectedIds}
                category={category}
                setCategory={setCategory}
                query={query}
                setQuery={setQuery}
                onToggle={toggleCard}
              />
            )}
            {view === "myset" && (
              <MySetView
                cards={selectedCards}
                onRemove={removeCard}
                onClear={clearSet}
                onAddCustom={() => setModal("addCustom")}
                onDownloadPdf={onDownloadPdf}
                onPreviewPdf={onPreviewPdf}
                onPrint={onPrint}
                sets={setOptions}
                currentSetId={currentSetId}
                onSwitchSet={switchSet}
              />
            )}
            {view === "sets" && (
              <SetsView
                sets={sets}
                currentSetId={currentSetId}
                onSelect={(id) => {
                  switchSet(id);
                  setView("myset");
                }}
                onCreate={createSetWithName}
                onRename={renameSet}
                onDuplicate={duplicateSet}
                onDelete={deleteSet}
              />
            )}
            {view === "settings" && (
              <PrintSettingsView
                size={size}
                setSize={setSize}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
                orientation={orientation}
                setOrientation={setOrientation}
                selectedCount={selectedIds.length}
                onDownloadPdf={onDownloadPdf}
                onPreviewPdf={onPreviewPdf}
                onPrint={onPrint}
              />
            )}
            {view === "instructions" && <InstructionsView />}
          </main>

          {showRightPanel && (
            <aside className="right-col">
              <SelectedPanel
                cards={selectedCards}
                onClear={clearSet}
                onRemove={removeCard}
                onAddCustom={() => setModal("addCustom")}
                onDownloadPdf={onDownloadPdf}
                onPreviewPdf={onPreviewPdf}
                onPrint={onPrint}
                sets={setOptions}
                currentSetId={currentSetId}
                onSwitchSet={switchSet}
              />
              <div className="settings-card">
                <PrintSettings
                  size={size}
                  setSize={setSize}
                  showLabels={showLabels}
                  setShowLabels={setShowLabels}
                  orientation={orientation}
                  setOrientation={setOrientation}
                />
              </div>
            </aside>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragCard && (
            <div
              className={`card-tile drag-preview ${activeDragKind === "lib" ? "from-lib" : ""}`}
            >
              <div className="card-img">
                {activeDragCard.image ? (
                  <img src={activeDragCard.image} alt={activeDragCard.label} />
                ) : (
                  <div className="img-placeholder">
                    <span>{activeDragCard.label}</span>
                  </div>
                )}
              </div>
              <div className="card-label">{activeDragCard.label}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <nav className="mobile-nav">
        <button
          className={view === "library" ? "active" : ""}
          onClick={() => setView("library")}
        >
          Библиотека
        </button>
        <button
          className={view === "myset" ? "active" : ""}
          onClick={() => setView("myset")}
        >
          Набор {selectedIds.length > 0 && <span className="m-badge">{selectedIds.length}</span>}
        </button>
        <button
          className={view === "sets" ? "active" : ""}
          onClick={() => setView("sets")}
        >
          Наборы
        </button>
        <button
          className={view === "settings" ? "active" : ""}
          onClick={() => setView("settings")}
        >
          Печать
        </button>
        <button
          className={view === "instructions" ? "active" : ""}
          onClick={() => setView("instructions")}
        >
          Помощь
        </button>
      </nav>

      <WelcomeModal
        open={showWelcome}
        onClose={() => dismissWelcome()}
        onOpenDocs={() => dismissWelcome("instructions")}
      />
      <AddCustomCardModal
        open={modal === "addCustom"}
        onClose={() => setModal(null)}
        onAdd={addCustom}
      />
      <PdfPreviewModal
        open={modal === "pdfPreview"}
        onClose={() => setModal(null)}
        cards={selectedCards}
        opts={printOpts}
        onPrint={onPrint}
      />
      <HowItWorksModal open={modal === "how"} onClose={() => setModal(null)} />
      <PrintTipsModal open={modal === "tips"} onClose={() => setModal(null)} />
    </div>
  );
}
