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

export default function Library({
  cards,
  selectedIds,
  category,
  setCategory,
  query,
  setQuery,
  onAdd,
}: Props) {
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

      {cards.length === 0 ? (
        <div className="empty">Ничего не найдено</div>
      ) : (
        <div className="cards-grid">
          {cards.map((c) => (
            <Card
              key={c.id}
              card={c}
              selected={selectedIds.includes(c.id)}
              onAdd={() => onAdd(c.id)}
            />
          ))}
        </div>
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
