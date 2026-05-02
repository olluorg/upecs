import { jsPDF } from "jspdf";
import type { Card, PrintOpts, PrintSize } from "../types";
import { loadImage } from "./loadImage";

const GRID: Record<PrintSize, number> = { "2x2": 2, "3x3": 3, "4x4": 4 };

export async function buildPdf(cards: Card[], opts: PrintOpts): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: opts.orientation,
    unit: "mm",
    format: "a4",
  });
  await drawCards(doc, cards, opts);
  return doc;
}

export async function downloadPdf(cards: Card[], opts: PrintOpts) {
  const doc = await buildPdf(cards, opts);
  doc.save("pecs.pdf");
}

export async function pdfDataUri(cards: Card[], opts: PrintOpts): Promise<string> {
  const doc = await buildPdf(cards, opts);
  return doc.output("datauristring");
}

export async function pdfBlob(cards: Card[], opts: PrintOpts): Promise<Blob> {
  const doc = await buildPdf(cards, opts);
  return doc.output("blob");
}

async function drawCards(doc: jsPDF, cards: Card[], opts: PrintOpts) {
  const grid = GRID[opts.size];
  const perPage = grid * grid;
  const margin = 8;
  const gap = 4;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cellW = (pageW - margin * 2 - gap * (grid - 1)) / grid;
  const cellH = (pageH - margin * 2 - gap * (grid - 1)) / grid;

  for (let i = 0; i < cards.length; i++) {
    const idx = i % perPage;
    if (i > 0 && idx === 0) doc.addPage();
    const col = idx % grid;
    const row = Math.floor(idx / grid);
    const x = margin + col * (cellW + gap);
    const y = margin + row * (cellH + gap);

    const dataUrl = await renderCardCanvas(cards[i], cellW, cellH, opts.showLabels);
    doc.addImage(dataUrl, "PNG", x, y, cellW, cellH);
  }
}

async function renderCardCanvas(
  card: Card,
  wMm: number,
  hMm: number,
  showLabel: boolean,
): Promise<string> {
  const dpi = 6; // 1mm ≈ 6px ~ 150dpi
  const w = Math.round(wMm * dpi);
  const h = Math.round(hMm * dpi);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Rounded border
  const r = Math.round(Math.min(w, h) * 0.04);
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2;
  roundedRect(ctx, 1, 1, w - 2, h - 2, r);
  ctx.stroke();

  const padding = Math.round(Math.min(w, h) * 0.06);
  const labelArea = showLabel ? Math.round(h * 0.18) : 0;
  const imgBox = {
    x: padding,
    y: padding,
    w: w - padding * 2,
    h: h - padding * 2 - labelArea,
  };

  const img = await loadImage(card.image);
  if (img && img.width > 0 && img.height > 0) {
    const ratio = Math.min(imgBox.w / img.width, imgBox.h / img.height);
    const dw = img.width * ratio;
    const dh = img.height * ratio;
    const dx = imgBox.x + (imgBox.w - dw) / 2;
    const dy = imgBox.y + (imgBox.h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    drawPlaceholder(ctx, imgBox.x, imgBox.y, imgBox.w, imgBox.h, card.label);
  }

  if (showLabel) {
    ctx.fillStyle = "#1f2937";
    const fontSize = Math.max(14, Math.round(labelArea * 0.42));
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textY = h - labelArea / 2 - padding / 2;
    ctx.fillText(card.label, w / 2, textY);
  }

  return canvas.toDataURL("image/png");
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
) {
  const r = Math.round(Math.min(w, h) * 0.05);
  ctx.fillStyle = "#eceef2";
  roundedRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.fillStyle = "#9ca3af";
  const fs = Math.max(12, Math.round(Math.min(w, h) * 0.12));
  ctx.font = `600 ${fs}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
