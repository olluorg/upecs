import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as RPointerEvent } from "react";
import Modal from "./Modal";
import { CATEGORIES } from "../data/categories";
import type { Card } from "../types";
import { renderCardImage } from "../utils/renderCardImage";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (card: Card) => void;
};

const STAGE = 240;
const OUTPUT = 768;

export default function AddCustomCardModal({ open, onClose, onAdd }: Props) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("other");
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    sx: number;
    sy: number;
    bx: number;
    by: number;
  } | null>(null);

  const reset = () => {
    setLabel("");
    setCategory("other");
    setImgSrc(null);
    setImg(null);
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => {
    if (!imgSrc) {
      setImg(null);
      return;
    }
    const i = new Image();
    i.onload = () => {
      setImg(i);
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    i.src = imgSrc;
  }, [imgSrc]);

  useEffect(() => {
    if (!img) {
      setPreviewUrl(null);
      return;
    }
    const id = window.setTimeout(() => {
      setPreviewUrl(
        renderCardImage({
          img,
          scale,
          rotation,
          offsetX: offset.x,
          offsetY: offset.y,
          stageSize: STAGE,
          outputSize: OUTPUT,
        }),
      );
    }, 30);
    return () => window.clearTimeout(id);
  }, [img, scale, rotation, offset]);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      bx: offset.x,
      by: offset.y,
    };
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset({ x: d.bx + (e.clientX - d.sx), y: d.by + (e.clientY - d.sy) });
  };
  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const handleSave = () => {
    if (!label.trim()) return;
    let imageData = "";
    if (img && previewUrl) {
      imageData = previewUrl;
    } else if (img) {
      imageData = renderCardImage({
        img,
        scale,
        rotation,
        offsetX: offset.x,
        offsetY: offset.y,
        stageSize: STAGE,
        outputSize: OUTPUT,
      });
    }
    const card: Card = {
      id: `custom_${Date.now()}`,
      label: label.trim(),
      image: imageData,
      category,
      custom: true,
    };
    onAdd(card);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const fitScale = img ? Math.min(STAGE / img.width, STAGE / img.height) : 1;

  return (
    <Modal
      open={open}
      title="Добавить свою карточку"
      onClose={handleClose}
      width={620}
    >
      <div className="form">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />

        <div className="add-card-grid">
          <div className="card-editor">
            <div
              className="editor-stage"
              style={{ width: STAGE, height: STAGE }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {img ? (
                <>
                  <div
                    className="editor-image-wrap"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
                    }}
                  >
                    <img
                      src={imgSrc!}
                      alt=""
                      draggable={false}
                      style={{
                        width: img.width * fitScale,
                        height: img.height * fitScale,
                      }}
                    />
                  </div>
                  <div className="editor-frame" />
                </>
              ) : (
                <button
                  type="button"
                  className="editor-empty"
                  onClick={() => fileRef.current?.click()}
                >
                  <span>Нажмите, чтобы загрузить изображение</span>
                  <small>JPEG, PNG, любой размер</small>
                </button>
              )}
            </div>

            {img && (
              <div className="editor-controls">
                <div className="ctrl">
                  <label>Масштаб</label>
                  <input
                    type="range"
                    min="0.2"
                    max="4"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                  />
                  <span className="ctrl-val">{scale.toFixed(2)}×</span>
                </div>
                <div className="ctrl">
                  <label>Поворот</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                  />
                  <span className="ctrl-val">{rotation}°</span>
                </div>
                <div className="editor-buttons">
                  <button
                    type="button"
                    className="btn-ghost small-btn"
                    onClick={() =>
                      setRotation((r) => normalizeRotation(r + 90))
                    }
                  >
                    Повернуть 90°
                  </button>
                  <button
                    type="button"
                    className="btn-ghost small-btn"
                    onClick={() => {
                      setScale(1);
                      setRotation(0);
                      setOffset({ x: 0, y: 0 });
                    }}
                  >
                    Сбросить
                  </button>
                  <button
                    type="button"
                    className="btn-ghost small-btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    Заменить файл
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card-preview-wrap">
            <div className="card-preview-label">Превью карточки</div>
            <div className="card-tile preview-tile">
              <div className="card-img">
                {previewUrl ? (
                  <img src={previewUrl} alt="" />
                ) : (
                  <div className="img-placeholder">
                    <span>{label || "Название"}</span>
                  </div>
                )}
              </div>
              <div className="card-label">{label || "Название"}</div>
            </div>
            <small className="muted center">
              Так карточка будет выглядеть в наборе и в PDF
            </small>
          </div>
        </div>

        <label className="form-row">
          <span>Название</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Например: Мама"
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

        <small className="muted">
          Без картинки карточка появится как серый плейсхолдер с подписью.
        </small>

        <div className="form-actions">
          <button className="btn-ghost" onClick={handleClose}>
            Отмена
          </button>
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

function normalizeRotation(deg: number): number {
  let r = deg;
  while (r > 180) r -= 360;
  while (r < -180) r += 360;
  return r;
}
