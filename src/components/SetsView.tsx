import { useState } from "react";
import type { CardSet } from "../types";
import { IconPlus, IconFolder, IconGrid } from "./Icons";
import { useT } from "../utils/I18nContext";

type Props = {
  sets: CardSet[];
  currentSetId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenBoard: (id: string) => void;
};

export default function SetsView({
  sets,
  currentSetId,
  onSelect,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onOpenBoard,
}: Props) {
  const t = useT();
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
    onCreate(t.sets.setName(sets.length + 1));
  };
  const handleDelete = (s: CardSet) => {
    if (window.confirm(t.sets.deleteConfirm(s.name))) {
      onDelete(s.id);
    }
  };

  return (
    <div className="sets-view">
      <div className="library-head">
        <div>
          <h1>{t.sets.title}</h1>
          <p className="muted">{t.sets.subtitle}</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <IconPlus size={14} /> {t.sets.newSet}
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
                  {pluralize(s.cardIds.length, t.common.cardOne, t.common.cardFew, t.common.cardMany)}
                </span>
              </div>
              <div className="set-actions">
                {isCurrent ? (
                  <span className="set-badge">{t.common.current}</span>
                ) : (
                  <button className="btn-ghost small-btn" onClick={() => onSelect(s.id)}>
                    {t.common.open}
                  </button>
                )}
                <button
                  className="btn-ghost small-btn"
                  onClick={() => onOpenBoard(s.id)}
                  title={t.commboard.openBoard}
                >
                  <IconGrid size={13} /> {t.commboard.openBoard}
                </button>
                <button
                  className="btn-ghost small-btn"
                  onClick={() => startRename(s)}
                  disabled={isRenaming}
                >
                  {t.common.rename}
                </button>
                <button
                  className="btn-ghost small-btn"
                  onClick={() => onDuplicate(s.id)}
                >
                  {t.common.duplicate}
                </button>
                <button
                  className="btn-ghost small-btn danger-btn"
                  onClick={() => handleDelete(s)}
                >
                  {t.common.delete}
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
