import { useMemo, useState } from "react";
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
import type { Card, ModalKind, Orientation, PrintSize, View } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Library from "./components/Library";
import SelectedPanel from "./components/SelectedPanel";
import MySetView from "./components/MySetView";
import PrintSettingsView from "./components/PrintSettingsView";
import InstructionsView from "./components/InstructionsView";
import PrintSettings from "./components/PrintSettings";
import AddCustomCardModal from "./components/AddCustomCardModal";
import PdfPreviewModal from "./components/PdfPreviewModal";
import HowItWorksModal from "./components/HowItWorksModal";
import PrintTipsModal from "./components/PrintTipsModal";
import WelcomeModal from "./components/WelcomeModal";
import { useIdbState } from "./utils/useIdbState";
import { downloadPdf } from "./utils/generatePdf";

export default function App() {
  const [selectedIds, setSelectedIds] = useIdbState<string[]>("selected", []);
  const [customCards, setCustomCards] = useIdbState<Card[]>("custom", []);
  const [size, setSize] = useIdbState<PrintSize>("size", "3x3");
  const [showLabels, setShowLabels] = useIdbState<boolean>("labels", true);
  const [orientation, setOrientation] = useIdbState<Orientation>("orient", "portrait");
  const [welcomeSeen, setWelcomeSeen, welcomeLoaded] = useIdbState<boolean>("welcome", false);

  const [view, setView] = useState<View>("library");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeDragCard, setActiveDragCard] = useState<Card | null>(null);
  const [activeDragKind, setActiveDragKind] = useState<"lib" | "sort" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const allCards: Card[] = useMemo(
    () => [...(cardsData as Card[]), ...customCards],
    [customCards],
  );

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
    return selectedIds.map((id) => map.get(id)).filter((c): c is Card => Boolean(c));
  }, [selectedIds, allCards]);

  const addCard = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const removeCard = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };
  const clearSet = () => setSelectedIds([]);

  const addCustom = (card: Card) => {
    setCustomCards((prev) => [...prev, card]);
    setSelectedIds((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]));
  };

  const printOpts = { size, orientation, showLabels };
  const onDownloadPdf = () => downloadPdf(selectedCards, printOpts);
  const onPreviewPdf = () => setModal("pdfPreview");

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
      setSelectedIds((prev) => {
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
      setSelectedIds((prev) => {
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
          <Sidebar view={view} setView={setView} selectedCount={selectedIds.length} />

          <main className="main">
            {view === "library" && (
              <Library
                cards={filtered}
                selectedIds={selectedIds}
                category={category}
                setCategory={setCategory}
                query={query}
                setQuery={setQuery}
                onAdd={addCard}
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
        onChoose={dismissWelcome}
        setCount={selectedIds.length}
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
      />
      <HowItWorksModal open={modal === "how"} onClose={() => setModal(null)} />
      <PrintTipsModal open={modal === "tips"} onClose={() => setModal(null)} />
    </div>
  );
}
