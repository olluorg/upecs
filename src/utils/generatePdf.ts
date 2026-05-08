import { jsPDF } from "jspdf";
import type { Card, PrintOpts, PrintSize } from "../types";
import { loadImage } from "./loadImage";

export type LabelResolver = (card: Card) => string;

const GRID: Record<PrintSize, number> = { "2x2": 2, "3x3": 3, "4x4": 4 };

const BLEED_MM = 3;
const MARK_OFFSET_MM = 3;   // gap between trim box and start of crop mark
const MARK_LEN_MM = 5;      // length of each crop mark line
const REG_R = 3.5;          // registration mark circle radius in mm

const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 300 / 25.4; // 300 dpi canvas rendering

export async function buildPdf(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: opts.orientation,
    unit: "mm",
    format: "a4",
  });
  await drawCards(doc, cards, opts, getLabel);
  return doc;
}

export async function downloadPdf(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver) {
  const blob = await buildEnhancedBlob(cards, opts, getLabel);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pecs.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

export async function pdfDataUri(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<string> {
  const blob = await buildEnhancedBlob(cards, opts, getLabel);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function pdfBlob(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<Blob> {
  return buildEnhancedBlob(cards, opts, getLabel);
}

async function buildEnhancedBlob(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<Blob> {
  const doc = await buildPdf(cards, opts, getLabel);
  setPdfPageBoxes(doc, opts);
  return doc.output("blob") as Blob;
}

// jsPDF 4.x stores trimBox/bleedBox on the pageContext object (initially null).
// No public setter exists — we access pageContext directly before calling output().
// Coordinates are in PDF points (y=0 at bottom), margins are symmetric.
function setPdfPageBoxes(doc: jsPDF, opts: PrintOpts) {
  const pt = (mm: number) => mm * MM_TO_PT;
  const pageWpt = pt(doc.internal.pageSize.getWidth());
  const pageHpt = pt(doc.internal.pageSize.getHeight());
  const margin = opts.cutMarks ? 14 : 8;
  const bleed  = opts.cutMarks ? BLEED_MM : 0;

  const makeBox = (inset: number) => ({
    bottomLeftX: pt(inset),
    bottomLeftY: pt(inset),
    topRightX:   pageWpt - pt(inset),
    topRightY:   pageHpt - pt(inset),
  });

  const trimBox  = makeBox(margin);
  const bleedBox = makeBox(margin - bleed);

  const count = doc.internal.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    const ctx = doc.internal.getPageInfo(i).pageContext as Record<string, unknown>;
    ctx.trimBox  = trimBox;
    ctx.bleedBox = bleedBox;
  }
}

export async function printPdf(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<void> {
  if (cards.length === 0) return;
  const doc = await buildPdf(cards, opts, getLabel);
  doc.autoPrint();
  setPdfPageBoxes(doc, opts);
  const blob = doc.output("blob") as Blob;
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;";
  iframe.src = url;
  iframe.onload = () => {
    window.setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.open(url, "_blank");
      }
    }, 200);
  };
  document.body.appendChild(iframe);

  window.setTimeout(() => {
    if (iframe.parentElement) iframe.parentElement.removeChild(iframe);
    URL.revokeObjectURL(url);
  }, 60_000);
}

async function drawCards(doc: jsPDF, cards: Card[], opts: PrintOpts, getLabel?: LabelResolver) {
  const grid = GRID[opts.size];
  const perPage = grid * grid;

  // When cut marks are on, increase gap and margin to accommodate marks and bleed
  const gap    = opts.cutMarks ? 18 : 4;
  const margin = opts.cutMarks ? 14 : 8;
  const bleed  = opts.cutMarks ? BLEED_MM : 0;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cellW = (pageW - margin * 2 - gap * (grid - 1)) / grid;
  const cellH = (pageH - margin * 2 - gap * (grid - 1)) / grid;

  if (opts.cutMarks) {
    drawRegistrationMarks(doc, pageW, pageH, margin);
  }

  for (let i = 0; i < cards.length; i++) {
    const idx = i % perPage;
    if (i > 0 && idx === 0) {
      doc.addPage();
      if (opts.cutMarks) {
        drawRegistrationMarks(doc, pageW, pageH, margin);
      }
    }
    const col = idx % grid;
    const row = Math.floor(idx / grid);
    const x = margin + col * (cellW + gap);
    const y = margin + row * (cellH + gap);

    await renderCard(doc, cards[i], x, y, cellW, cellH, bleed, opts, getLabel);

    if (opts.cutMarks) {
      drawCropMarks(doc, x, y, cellW, cellH);
    }
  }
}

// Canvas-based rendering: entire card (background, image, border, label) drawn at 300 dpi.
// Canvas uses the system font (Inter, sans-serif), which supports Cyrillic and CJK.
async function renderCard(
  doc: jsPDF,
  card: Card,
  trimX: number,
  trimY: number,
  trimW: number,
  trimH: number,
  bleedMm: number,
  opts: PrintOpts,
  getLabel?: LabelResolver,
) {
  const label = getLabel ? getLabel(card) : card.label;
  const totalW = trimW + 2 * bleedMm;
  const totalH = trimH + 2 * bleedMm;
  const canvasW = Math.round(totalW * MM_TO_PX);
  const canvasH = Math.round(totalH * MM_TO_PX);
  const bleedPx = bleedMm * MM_TO_PX;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  await renderCardCanvas(ctx, card, label, canvasW, canvasH, bleedPx, opts);

  const dataUrl = canvas.toDataURL("image/png");
  doc.addImage(dataUrl, "PNG", trimX - bleedMm, trimY - bleedMm, totalW, totalH);
}

async function renderCardCanvas(
  ctx: CanvasRenderingContext2D,
  card: Card,
  label: string,
  w: number,
  h: number,
  bleedPx: number,
  opts: PrintOpts,
) {
  const trimX = bleedPx;
  const trimY = bleedPx;
  const trimW = w - 2 * bleedPx;
  const trimH = h - 2 * bleedPx;

  const padding   = Math.min(trimW, trimH) * 0.06;
  const labelArea = opts.showLabels ? trimH * 0.18 : 0;
  const cornerR   = Math.min(trimW, trimH) * 0.04;

  // 1. White background (full canvas including bleed)
  ctx.fillStyle = "#ffffff";
  roundedRectPath(ctx, 0, 0, w, h, cornerR);
  ctx.fill();

  // 2. Image
  const imgX = trimX + padding;
  const imgY = trimY + padding;
  const imgW = trimW - padding * 2;
  const imgH = trimH - padding * 2 - labelArea;

  const img = await loadImage(card.image);
  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const ratio = Math.min(imgW / img.naturalWidth, imgH / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    const dx = imgX + (imgW - dw) / 2;
    const dy = imgY + (imgH - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    // Placeholder
    ctx.fillStyle = "#eceff2";
    roundedRectPath(ctx, imgX, imgY, imgW, imgH, cornerR * 0.5);
    ctx.fill();
    const placeholderFs = Math.max(12, Math.min(imgW, imgH) * 0.12);
    ctx.fillStyle = "#9ca3af";
    ctx.font = `bold ${placeholderFs}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, imgX + imgW / 2, imgY + imgH / 2);
  }

  // 3. Border at trim line
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 0.3 * MM_TO_PX;
  roundedRectPath(ctx, trimX, trimY, trimW, trimH, cornerR);
  ctx.stroke();

  // 4. Label text
  if (opts.showLabels) {
    const labelFs = Math.max(10, labelArea * 0.42);
    ctx.fillStyle = "#1f2937";
    ctx.font = `bold ${labelFs}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, trimX + trimW / 2, trimY + trimH - labelArea * 0.5);
  }
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Professional crop marks: MARK_OFFSET_MM gap from trim box, then MARK_LEN_MM long.
// Gap needed between adjacent cards: 2 × (MARK_OFFSET_MM + MARK_LEN_MM) + 2 = 18mm
function drawCropMarks(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(0, 0, 0, 100); // CMYK registration black
  doc.setLineWidth(0.15);
  const o = MARK_OFFSET_MM;
  const m = MARK_LEN_MM;

  // top-left
  doc.line(x - o - m, y, x - o, y);
  doc.line(x, y - o - m, x, y - o);
  // top-right
  doc.line(x + w + o, y, x + w + o + m, y);
  doc.line(x + w, y - o - m, x + w, y - o);
  // bottom-left
  doc.line(x - o - m, y + h, x - o, y + h);
  doc.line(x, y + h + o, x, y + h + o + m);
  // bottom-right
  doc.line(x + w + o, y + h, x + w + o + m, y + h);
  doc.line(x + w, y + h + o, x + w, y + h + o + m);
}

// Registration marks: crosshair inside circle at each page corner.
// Plotters use these optically to calibrate the cut origin.
function drawRegistrationMarks(doc: jsPDF, pageW: number, pageH: number, margin: number) {
  doc.setDrawColor(0, 0, 0, 100);
  doc.setLineWidth(0.2);
  const r = REG_R;
  const pos = margin / 2;
  const corners: [number, number][] = [
    [pos, pos],
    [pageW - pos, pos],
    [pos, pageH - pos],
    [pageW - pos, pageH - pos],
  ];
  for (const [cx, cy] of corners) {
    doc.circle(cx, cy, r, "S");
    doc.circle(cx, cy, 0.7, "S");
    doc.line(cx - r - 1.5, cy, cx + r + 1.5, cy);
    doc.line(cx, cy - r - 1.5, cx, cy + r + 1.5);
  }
}
