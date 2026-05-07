import { useEffect, useRef, useState } from "react";
import type { Card as CardT } from "../types";
import { CATEGORIES } from "../data/categories";
import Card from "./Card";
import { IconSearch } from "./Icons";
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

const PER_PAGE = 24;
const NAV_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
]);

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
  const [page, setPage] = useState(1);
  const [tabIdx, setTabIdx] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const tabIdxRef = useRef(0);
  const mouseInGridRef = useRef(false);

  useEffect(() => {
    setPage(1);
  }, [category, query]);

  const total = cards.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageCards = cards.slice(start, start + PER_PAGE);

  useEffect(() => {
    setTabIdx(0);
    tabIdxRef.current = 0;
  }, [safePage, category, query]);

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
          >
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
            {pageCards.map((c, i) => (
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

          {totalPages > 1 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}

          <div className="pager-info">
            {t.library.showing(start + 1, Math.min(start + PER_PAGE, total), total)}
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

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const items = pageItems(page, totalPages);
  return (
    <div className="pager">
      <button
        className="pager-nav"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Prev"
      >
        ‹
      </button>
      {items.map((p, i) =>
        p === "..." ? (
          <span key={`d${i}`} className="pager-dots">…</span>
        ) : (
          <button
            key={p}
            className={`pager-num ${p === page ? "active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        className="pager-nav"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}

function pageItems(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}
