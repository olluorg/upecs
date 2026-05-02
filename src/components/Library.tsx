import { useEffect, useState } from "react";
import type { Card as CardT } from "../types";
import { CATEGORIES } from "../data/categories";
import Card from "./Card";
import { IconSearch } from "./Icons";

type Props = {
  cards: CardT[];
  selectedIds: string[];
  category: string;
  setCategory: (c: string) => void;
  query: string;
  setQuery: (q: string) => void;
  onAdd: (id: string) => void;
};

const PER_PAGE = 24;

export default function Library({
  cards,
  selectedIds,
  category,
  setCategory,
  query,
  setQuery,
  onAdd,
}: Props) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [category, query]);

  const total = cards.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageCards = cards.slice(start, start + PER_PAGE);

  return (
    <div className="library">
      <div className="library-head">
        <div>
          <h1>Библиотека карточек</h1>
          <p className="muted">
            Выбирайте карточки и добавляйте их в свой набор
          </p>
        </div>
        <div className="search">
          <IconSearch size={16} />
          <input
            placeholder="Поиск карточек..."
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
            {c.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="empty">Ничего не найдено</div>
      ) : (
        <>
          <div className="cards-grid">
            {pageCards.map((c) => (
              <Card
                key={c.id}
                card={c}
                selected={selectedIds.includes(c.id)}
                onAdd={() => onAdd(c.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          )}

          <div className="pager-info">
            Показано {start + 1}–{Math.min(start + PER_PAGE, total)} из {total}
          </div>
        </>
      )}

      <div className="hint">
        <span className="hint-dot" />
        <span>
          <b>Совет:</b> начните с 2–3 карточек, которые ребёнок очень хочет.
          Уберите остальные и постепенно добавляйте новые.
        </span>
      </div>
    </div>
  );
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
        aria-label="Предыдущая"
      >
        ‹
      </button>
      {items.map((p, i) =>
        p === "..." ? (
          <span key={`d${i}`} className="pager-dots">
            …
          </span>
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
        aria-label="Следующая"
      >
        ›
      </button>
    </div>
  );
}

function pageItems(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}
