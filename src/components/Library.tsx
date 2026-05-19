import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Card as CardT } from "../types";
import { CATEGORIES, CATEGORY_COLORS } from "../data/categories";
import Card from "./Card";
import {
  IconSearch, IconGrid, IconUtensils, IconCup, IconHand,
  IconUsers, IconDice, IconHeart, IconSmile, IconDots,
  IconList, IconFolder, IconHome, IconScissors, IconPencil,
  IconPlus, IconStar,
} from "./Icons";
import { useT } from "../utils/I18nContext";

type Props = {
  cards: CardT[];
  selectedIds: string[];
  category: string;
  setCategory: (c: string) => void;
  query: string;
  setQuery: (q: string) => void;
  onToggle: (id: string) => void;
  onEditCard?: (card: CardT) => void;
  onDeleteCard?: (id: string) => void;
};

const CATEGORY_ICONS: Record<string, ReactNode> = {
  all:     <IconGrid    size={13} />,
  food:    <IconUtensils size={13} />,
  drink:   <IconCup     size={13} />,
  actions: <IconHand    size={13} />,
  people:  <IconUsers   size={13} />,
  toys:    <IconDice    size={13} />,
  needs:   <IconHeart   size={13} />,
  emotions:<IconSmile   size={13} />,
  numbers: <IconList    size={13} />,
  animals: <IconStar    size={13} />,
  transport:<IconFolder  size={13} />,
  clothes: <IconScissors size={13} />,
  school:  <IconPencil  size={13} />,
  medicine:<IconPlus    size={13} />,
  places:  <IconFolder  size={13} />,
  household:<IconHome   size={13} />,
  objects: <IconFolder  size={13} />,
  shapes:  <IconGrid    size={13} />,
  colors:  <IconDots    size={13} />,
  other:   <IconDots    size={13} />,
};

const PER_PAGE = 24;
const SCROLL_THRESHOLD = 300; // px from bottom before loading more
const NAV_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
]);

function getInitialCount(): number {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/");
  if (parts[0] !== "library") return PER_PAGE;
  const p1 = parts[1];
  const p2 = parts[2];
  if (!p1) return PER_PAGE;
  // Backward compat: #library/48
  const p1Num = parseInt(p1, 10);
  if (!isNaN(p1Num) && /^\d+$/.test(p1)) return Math.max(PER_PAGE, p1Num);
  // New format: #library/category/48
  if (p2) {
    const n = parseInt(p2, 10);
    if (!isNaN(n) && n > 0) return Math.max(PER_PAGE, n);
  }
  return PER_PAGE;
}

function buildLibraryHash(category: string, count: number): string {
  if (category === "all" && count <= PER_PAGE) return "#library";
  if (count <= PER_PAGE) return `#library/${category}`;
  return `#library/${category}/${count}`;
}

export default function Library({
  cards,
  selectedIds,
  category,
  setCategory,
  query,
  setQuery,
  onToggle,
  onEditCard,
  onDeleteCard,
}: Props) {
  const t = useT();
  const [count, setCount] = useState(getInitialCount);
  const [tabIdx, setTabIdx] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const tabIdxRef = useRef(0);
  const mouseInGridRef = useRef(false);
  const isFirstMount = useRef(true);

  // Reset count on filter change (skip initial mount to preserve hash-restored count)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setCount(PER_PAGE);
  }, [category, query]);

  // Sync category + count to hash without triggering hashchange
  useEffect(() => {
    history.replaceState(null, "", buildLibraryHash(category, count));
  }, [category, count]);

  const total = cards.length;
  const visibleCount = Math.min(count, total);
  const visibleCards = cards.slice(0, visibleCount);

  // Fill visible area on mount + load more on scroll. Single effect keeps ordering deterministic
  // and avoids IntersectionObserver firing eagerly before fill() sets the right count.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const main = grid.closest<HTMLElement>(".main");
    if (!main) return;
    let rafId = 0;

    const fill = () => {
      const tiles = grid.querySelectorAll<HTMLElement>(".card-tile");
      if (!tiles.length) return;
      const tile = tiles[0];
      const tileH = tile.offsetHeight;
      if (!tileH) return;
      const cols = computeCols(grid, tile);
      const style = window.getComputedStyle(grid);
      const rowGap = parseFloat(style.rowGap || style.gap || "0");
      // Subtract the space above the grid (header inside main, pills, padding)
      // so we get only the height actually available for cards.
      const gridOffsetFromTop = Math.max(
        0,
        grid.getBoundingClientRect().top - main.getBoundingClientRect().top,
      );
      const availableH = main.clientHeight - gridOffsetFromTop;
      const rows = Math.ceil(availableH / (tileH + rowGap)) + 1; // +1 for partial last row
      setCount((prev) => Math.max(prev, cols * rows));
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const remaining = main.scrollHeight - main.scrollTop - main.clientHeight;
        if (remaining < SCROLL_THRESHOLD) {
          setCount((c) => c + PER_PAGE);
        }
      });
    };

    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(fill);
    };

    fill();
    main.addEventListener("scroll", handleScroll, { passive: true });
    const ro = new ResizeObserver(handleResize);
    ro.observe(grid);
    return () => {
      cancelAnimationFrame(rafId);
      main.removeEventListener("scroll", handleScroll);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    setTabIdx(0);
    tabIdxRef.current = 0;
  }, [count, category, query]);

  const updateTab = (i: number) => {
    tabIdxRef.current = i;
    setTabIdx(i);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!NAV_KEYS.has(e.key)) return;
      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.isContentEditable)
      ) {
        return;
      }

      const grid = gridRef.current;
      if (!grid) return;
      const focusInGrid = !!tgt && grid.contains(tgt);
      if (!focusInGrid && !mouseInGridRef.current) return;

      const tiles = Array.from(
        grid.querySelectorAll<HTMLElement>(".card-tile"),
      );
      if (tiles.length === 0) return;

      let from = Math.min(Math.max(tabIdxRef.current, 0), tiles.length - 1);
      if (focusInGrid && tgt) {
        const tile = tgt.closest(".card-tile");
        if (tile) {
          const i = tiles.indexOf(tile as HTMLElement);
          if (i >= 0) from = i;
        }
      }

      const cols = computeCols(grid, tiles[0]);
      let next = from;
      switch (e.key) {
        case "ArrowRight": next = from + 1; break;
        case "ArrowLeft":  next = from - 1; break;
        case "ArrowDown":  next = from + cols; break;
        case "ArrowUp":    next = from - cols; break;
        case "Home":       next = 0; break;
        case "End":        next = tiles.length - 1; break;
      }
      if (next < 0 || next >= tiles.length) return;
      e.preventDefault();
      updateTab(next);
      tiles[next]?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="library">
      <div className="library-head">
        <div>
          <h1>{t.library.title}</h1>
          <p className="muted">{t.library.subtitle}</p>
        </div>
        <div className="search">
          <IconSearch size={16} />
          <input
            placeholder={t.library.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="pills">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`pill ${category === c.id ? "active" : ""}`}
            onClick={() => setCategory(c.id)}
            style={CATEGORY_COLORS[c.id] ? { "--cat-color": CATEGORY_COLORS[c.id] } as CSSProperties : undefined}
          >
            {CATEGORY_ICONS[c.id]}
            {t.categories[c.id] ?? c.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="empty">{t.library.nothingFound}</div>
      ) : (
        <>
          <div
            ref={gridRef}
            className="cards-grid"
            onMouseEnter={() => { mouseInGridRef.current = true; }}
            onMouseLeave={() => { mouseInGridRef.current = false; }}
          >
            {visibleCards.map((c, i) => (
              <Card
                key={c.id}
                card={c}
                selected={selectedIds.includes(c.id)}
                onToggle={() => onToggle(c.id)}
                tabIndex={i === tabIdx ? 0 : -1}
                onMouseEnter={() => updateTab(i)}
                onEdit={c.custom && onEditCard ? () => onEditCard(c) : undefined}
                onDelete={c.custom && onDeleteCard ? () => onDeleteCard(c.id) : undefined}
              />
            ))}
          </div>

          <div className="pager-info">
            {t.library.showing(1, visibleCount, total)}
          </div>
        </>
      )}

      <div className="hint">
        <span className="hint-dot" />
        <span>
          <b>Tip:</b> {t.library.tip}
        </span>
      </div>
    </div>
  );
}

function computeCols(grid: HTMLElement, sample: HTMLElement): number {
  const gridStyle = window.getComputedStyle(grid);
  const gap = parseFloat(gridStyle.columnGap || gridStyle.gap || "0");
  const sampleW = sample.offsetWidth;
  if (!sampleW) return 1;
  return Math.max(1, Math.floor((grid.clientWidth + gap) / (sampleW + gap)));
}
