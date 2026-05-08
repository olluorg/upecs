import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
import PrintAndPreviewModal from "./components/PrintAndPreviewModal";
import CommBoardView from "./components/CommBoardView";
import AddCustomCardModal from "./components/AddCustomCardModal";
import HowItWorksModal from "./components/HowItWorksModal";
import PrintTipsModal from "./components/PrintTipsModal";
import WelcomeModal from "./components/WelcomeModal";
import InstallBanner from "./components/InstallBanner";
import { useInstallPrompt } from "./utils/useInstallPrompt";
import { IconPrint, IconGrid, IconChevronLeft } from "./components/Icons";
import { useIdbState } from "./utils/useIdbState";
import { useHashView } from "./utils/useHashView";
import { useT } from "./utils/I18nContext";
import { getCardLabel } from "./utils/cardLabel";
import { CATEGORY_COLORS } from "./data/categories";
import { idbGet } from "./utils/idb";
import { printPdf } from "./utils/generatePdf";
import { encodeShare, decodeShare } from "./utils/shareSet";
import type { SharePayload } from "./utils/shareSet";
import ImportSetModal from "./components/ImportSetModal";

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
  const [cutMarks, setCutMarks, cutMarksLoaded] = useIdbState<boolean>(
    "cutMarks",
    false,
  );
  const [cmyk, setCmyk, cmykLoaded] = useIdbState<boolean>("cmyk", false);
  const [welcomeSeen, setWelcomeSeen, welcomeLoaded] = useIdbState<boolean>(
    "welcome",
    false,
  );
  const [lastBoardSetId, setLastBoardSetId, lastBoardLoaded] = useIdbState<string>("lastBoardSetId", "");

  const t = useT();
  const installPrompt = useInstallPrompt();
  const [view, commBoardSetId, setView] = useHashView();
  const boardSourceView = useRef<View>(
    (sessionStorage.getItem("boardSourceView") as View | null) ?? "library",
  );
  const [category, setCategory] = useState(() => {
    const parts = window.location.hash.replace(/^#\/?/, "").split("/");
    if (parts[0] !== "library" || !parts[1] || /^\d+$/.test(parts[1])) return "all";
    const valid = new Set(["all","food","drink","actions","people","toys","needs","emotions","other"]);
    return valid.has(parts[1]) ? parts[1] : "all";
  });
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [activeDragCard, setActiveDragCard] = useState<Card | null>(null);
  const [activeDragKind, setActiveDragKind] = useState<"lib" | "sort" | null>(null);
  const [importData, setImportData] = useState<SharePayload | null>(null);
  const [rightCollapsed, setRightCollapsed] = useIdbState<boolean>("rightCollapsed", false);
  const [toast, setToast] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Detect ?share= on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("share");
    if (!raw) return;
    const decoded = decodeShare(raw);
    if (decoded) setImportData(decoded);
  }, []);

  // Initialize / migrate sets once IDB has loaded
  useEffect(() => {
    if (!setsLoaded || sets.length > 0) return;
    let canceled = false;
    (async () => {
      const legacy = await idbGet<string[]>("selected").catch(() => undefined);
      if (canceled) return;
      const initial: CardSet = {
        id: newId("set"),
        name: t.selected.fallbackName,
        cardIds: Array.isArray(legacy) ? legacy : [],
      };
      setSets([initial]);
      setCurrentSetId(initial.id);
    })();
    return () => {
      canceled = true;
    };
  }, [setsLoaded, sets, setSets, setCurrentSetId, t]);

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
    cutMarksLoaded &&
    cmykLoaded &&
    welcomeLoaded &&
    lastBoardLoaded;
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
      if (q && !getCardLabel(t, c).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allCards, category, query, t]);

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
  const moveCard = (id: string, direction: -1 | 1) =>
    updateCurrent((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      return arrayMove(prev, idx, next);
    });

  const addCustom = (card: Card) => {
    setCustomCards((prev) => [...prev, card]);
    updateCurrent((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]));
  };

  const editCustom = (card: Card) => {
    setCustomCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
  };

  const deleteCustomCard = (id: string) => {
    setCustomCards((prev) => prev.filter((c) => c.id !== id));
    setSets((prev) => prev.map((s) => ({ ...s, cardIds: s.cardIds.filter((cid) => cid !== id) })));
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
          name: t.selected.fallbackName,
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

  const handleShare = (id: string) => {
    const s = sets.find((x) => x.id === id);
    if (!s) return;
    const url = `${window.location.origin}/?share=${encodeShare(s.name, s.cardIds)}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast(t.share.copied);
      setTimeout(() => setToast(null), 3000);
    });
  };

  const handleImport = () => {
    if (!importData) return;
    const knownIds = new Set(allCards.map((c) => c.id));
    const validIds = importData.c.filter((id) => knownIds.has(id));
    const s: CardSet = { id: newId("set"), name: importData.n, cardIds: validIds };
    setSets((prev) => [...prev, s]);
    setCurrentSetId(s.id);
    setImportData(null);
    window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    setView("myset");
  };

  const printOpts = useMemo(
    () => ({ size, orientation, showLabels, cutMarks, cmyk }),
    [size, orientation, showLabels, cutMarks, cmyk],
  );
  const getLabel = useMemo(() => (card: Card) => getCardLabel(t, card), [t]);
  const openPrintModal = () => setModal("printPreview");
  const onDownloadPdf = openPrintModal;
  const onPreviewPdf = openPrintModal;
  const onPrint = openPrintModal;

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

  const openBoard = (setId: string) => {
    boardSourceView.current = view;
    sessionStorage.setItem("boardSourceView", view);
    setLastBoardSetId(setId);
    setView("commboard", setId);
  };

  if (appReady && view === "commboard") {
    const resolvedSetId = commBoardSetId ?? lastBoardSetId ?? currentSetId;
    const boardSet = sets.find((s) => s.id === resolvedSetId) ?? currentSet;
    const boardCards = boardSet
      ? boardSet.cardIds
          .map((id) => allCards.find((c) => c.id === id))
          .filter((c): c is Card => Boolean(c))
      : [];
    return (
      <CommBoardView
        cards={boardCards}
        onBack={() => setView(boardSourceView.current)}
      />
    );
  }

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
            <img src="/logo.png" alt="PECS logo" width={36} height={36} />
          </span>
          <div className="logo-text">
            <strong>
              <span style={{ color: "#3D93E6" }}>P</span>
              <span style={{ color: "#75C54A" }}>E</span>
              <span style={{ color: "#FFB41D" }}>C</span>
              <span style={{ color: "#F05D4D" }}>S</span>
            </strong>
            <span>{t.header.logoSub}</span>
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
        <div className={`app-body ${showRightPanel ? (rightCollapsed ? "right-mini" : "") : "no-right"}`}>
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
                onEditCard={(card) => { setEditingCard(card); setModal("editCustom"); }}
                onDeleteCard={deleteCustomCard}
              />
            )}
            {view === "myset" && (
              <MySetView
                cards={selectedCards}
                onRemove={removeCard}
                onMove={moveCard}
                onClear={clearSet}
                onAddCustom={() => setModal("addCustom")}
                onDownloadPdf={onDownloadPdf}
                onPreviewPdf={onPreviewPdf}
                onPrint={onPrint}
                sets={setOptions}
                currentSetId={currentSetId}
                onSwitchSet={switchSet}
                onOpenBoard={() => openBoard(currentSetId)}
                onShare={() => handleShare(currentSetId)}
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
                onOpenBoard={(id) => {
                  switchSet(id);
                  openBoard(id);
                }}
                onShare={handleShare}
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
                cutMarks={cutMarks}
                setCutMarks={setCutMarks}
                cmyk={cmyk}
                setCmyk={setCmyk}
                selectedCount={selectedIds.length}
                onDownloadPdf={onDownloadPdf}
                onPreviewPdf={onPreviewPdf}
                onPrint={onPrint}
              />
            )}
            {view === "instructions" && <InstructionsView />}
          </main>

          {showRightPanel && (
            <aside className={`right-col ${rightCollapsed ? "right-col--mini" : ""}`}>
              {rightCollapsed ? (
                <>
                  <button
                    className="mini-expand-btn"
                    onClick={() => setRightCollapsed(false)}
                    title={t.common.expand}
                  >
                    <IconChevronLeft size={14} />
                    {selectedIds.length > 0 && (
                      <span className="right-toggle-count">{selectedIds.length}</span>
                    )}
                  </button>
                  <div className="right-scroll">
                    <div className="mini-cards">
                      {selectedCards.map((card) => {
                        const label = getCardLabel(t, card);
                        return (
                          <div key={card.id} className="mini-card" title={label} style={CATEGORY_COLORS[card.category] ? { "--cat-color": CATEGORY_COLORS[card.category] } as CSSProperties : undefined}>
                            {card.image ? (
                              <img src={card.image} alt={label} />
                            ) : (
                              <div className="mini-card-placeholder">
                                <span>{label.slice(0, 2)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="right-scroll">
                  <SelectedPanel
                    cards={selectedCards}
                    onClear={clearSet}
                    onRemove={removeCard}
                    onAddCustom={() => setModal("addCustom")}
                    onCollapse={() => setRightCollapsed(true)}
                    sets={setOptions}
                    currentSetId={currentSetId}
                    onSwitchSet={switchSet}
                  />
                </div>
              )}

              <div className="right-footer">
                <button
                  className="btn-primary block"
                  onClick={openPrintModal}
                  disabled={selectedIds.length === 0}
                  title={t.selected.printAndSave}
                >
                  <IconPrint size={16} />
                  {!rightCollapsed && <span>{t.selected.printAndSave}</span>}
                </button>
                <button
                  className="btn-ghost block"
                  onClick={() => openBoard(currentSetId)}
                  disabled={selectedIds.length === 0}
                  title={t.commboard.openBoard}
                >
                  <IconGrid size={16} />
                  {!rightCollapsed && <span>{t.commboard.openBoard}</span>}
                </button>
              </div>
            </aside>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragCard && (() => {
            const dragLabel = getCardLabel(t, activeDragCard);
            return (
              <div className={`card-tile drag-preview ${activeDragKind === "lib" ? "from-lib" : ""}`}>
                <div className="card-img">
                  {activeDragCard.image ? (
                    <img src={activeDragCard.image} alt={dragLabel} />
                  ) : (
                    <div className="img-placeholder">
                      <span>{dragLabel}</span>
                    </div>
                  )}
                </div>
                <div className="card-label">{dragLabel}</div>
              </div>
            );
          })()}
        </DragOverlay>
      </DndContext>

      <InstallBanner {...installPrompt} />
      <nav className="mobile-nav">
        <button className={view === "library" ? "active" : ""} onClick={() => setView("library")}>
          {t.mobile.library}
        </button>
        <button className={view === "myset" ? "active" : ""} onClick={() => setView("myset")}>
          {t.mobile.myset}{selectedIds.length > 0 && <span className="m-badge">{selectedIds.length}</span>}
        </button>
        <button className={view === "sets" ? "active" : ""} onClick={() => setView("sets")}>
          {t.mobile.sets}
        </button>
        <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>
          {t.mobile.settings}
        </button>
        <button className={view === "instructions" ? "active" : ""} onClick={() => setView("instructions")}>
          {t.mobile.help}
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
      <AddCustomCardModal
        open={modal === "editCustom"}
        onClose={() => { setModal(null); setEditingCard(null); }}
        onAdd={addCustom}
        initialCard={editingCard ?? undefined}
        onEdit={editCustom}
      />
      <PrintAndPreviewModal
        open={modal === "printPreview"}
        onClose={() => setModal(null)}
        cards={selectedCards}
        size={size}
        setSize={setSize}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        orientation={orientation}
        setOrientation={setOrientation}
        cutMarks={cutMarks}
        setCutMarks={setCutMarks}
        cmyk={cmyk}
        setCmyk={setCmyk}
        onPrint={() => { printPdf(selectedCards, printOpts, getLabel); setModal(null); }}
        getLabel={getLabel}
      />
      <HowItWorksModal open={modal === "how"} onClose={() => setModal(null)} />
      <PrintTipsModal open={modal === "tips"} onClose={() => setModal(null)} />
      <ImportSetModal
        open={appReady && importData !== null}
        name={importData?.n ?? ""}
        cardCount={importData?.c.length ?? 0}
        onImport={handleImport}
        onClose={() => {
          setImportData(null);
          window.history.replaceState({}, "", window.location.pathname + window.location.hash);
        }}
      />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
