import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Modal from "./Modal";
import { CATEGORIES } from "../data/categories";
import type { Card } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
};

export default function AddCustomCardModal({ open, onClose, onAdd }: Props) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("other");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setLabel("");
    setCategory("other");
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!label.trim()) return;
    const card: Card = {
      id: `custom_${Date.now()}`,
      label: label.trim(),
      image: image ?? "",
      category,
      custom: true,
    };
    onAdd(card);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Добавить свою карточку"
      onClose={() => {
        reset();
        onClose();
      }}
      width={460}
    >
      <div className="form">
        <label className="form-row">
          <span>Название</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Например: Мама"
            autoFocus
          />
        </label>

        <label className="form-row">
          <span>Категория</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="form-row">
          <span>Картинка</span>
          <div className="file-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
            />
            {image && (
              <div className="file-preview">
                <img src={image} alt="Превью" />
              </div>
            )}
          </div>
          <small className="muted">
            Если не загрузить — вместо картинки будет серый плейсхолдер с названием.
          </small>
        </div>

        <div className="form-actions">
          <button className="btn-ghost" onClick={onClose}>Отмена</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!label.trim()}
          >
            Добавить
          </button>
        </div>
      </div>
    </Modal>
  );
}
