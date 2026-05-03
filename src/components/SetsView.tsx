import { useState } from "react";
import type { CardSet } from "../types";
import { IconPlus, IconFolder } from "./Icons";

type Props = {
  sets: CardSet[];
  currentSetId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function SetsView({
  sets,
  currentSetId,
  onSelect,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
}: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (s: CardSet) => {
    setRenamingId(s.id);
    setRenameValue(s.name);
  };
  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };
  const handleCreate = () => {
    onCreate(`Набор ${sets.length + 1}`);
  };
  const handleDelete = (s: CardSet) => {
    if (window.confirm(`Удалить набор «${s.name}»? Карточки внутри останутся в библиотеке.`)) {
      onDelete(s.id);
    }
  };

  return (
    <div className="sets-view">
      <div className="library-head">
        <div>
          <h1>Мои наборы</h1>
          <p className="muted">
            Создавайте отдельные наборы под разные ситуации — завтрак, прогулка, школа.
          </p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <IconPlus size={14} /> Новый набор
        </button>
      </div>

      <div className="sets-list">
        {sets.map((s) => {
          const isCurrent = s.id === currentSetId;
          const isRenaming = renamingId === s.id;
          return (
            <div key={s.id} className={`set-row ${isCurrent ? "current" : ""}`}>
              <span className="set-icon">
                <IconFolder size={20} />
              </span>
              <div className="set-info">
                {isRenaming ? (
                  <input
                    className="set-name-input"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <span className="set-name">{s.name}</span>
                )}
                <span className="set-count muted small">
                  {s.cardIds.length}{" "}
                  {pluralize(s.cardIds.length, "карточка", "карточки", "карточек")}
                </span>
              </div>
              <div className="set-actions">
                {isCurrent ? (
                  <span className="set-badge">Текущий</span>
                ) : (
                  <button className="btn-ghost small-btn" onClick={() => onSelect(s.id)}>
                    Открыть
                  </button>
                )}
                <button
                  className="btn-ghost small-btn"
                  onClick={() => startRename(s)}
                  disabled={isRenaming}
                >
                  Переименовать
                </button>
                <button
                  className="btn-ghost small-btn"
                  onClick={() => onDuplicate(s.id)}
                >
                  Дублировать
                </button>
                <button
                  className="btn-ghost small-btn danger-btn"
                  onClick={() => handleDelete(s)}
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
