import {
  PDFDocument, PDFFont, PDFPage, PDFName, PDFString, rgb, cmyk,
  type PDFPageDrawLineOptions, type Color,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Card, PrintOpts, PrintSize } from "../types";
import { loadImage } from "./loadImage";

export type LabelResolver = (card: Card) => string;

const GRID: Record<PrintSize, number> = { "2x2": 2, "3x3": 3, "4x4": 4 };

const BLEED_MM = 3;
const MARK_OFFSET_MM = 3;
const MARK_LEN_MM = 5;
const REG_R = 3.5;

const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 300 / 25.4; // 300 dpi canvas for images

const A4_W = 210;
const A4_H = 297;

const pt = (mm: number) => mm * MM_TO_PT;
// Convert top-left y (mm) to pdf-lib bottom-left y (pt)
const fy = (yMm: number, pH: number) => pt(pH - yMm);
// y for placing a rectangle: pdf-lib wants the bottom edge
const fyRect = (yMm: number, hMm: number, pH: number) => pt(pH - yMm - hMm);

const REG_BLACK = cmyk(0, 0, 0, 1);

// Module-level font cache — avoids re-fetching the TTF on every export
let _fontBytes: ArrayBuffer | null = null;
async function loadInterFont(): Promise<ArrayBuffer> {
  if (!_fontBytes) _fontBytes = await fetch("/fonts/inter-bold.ttf").then((r) => r.arrayBuffer());
  return _fontBytes;
}

export async function buildPdf(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  pdfDoc.setProducer("PECS Builder");
  pdfDoc.setCreationDate(new Date());

  const fontBytes = await loadInterFont();
  // embedFont subsets automatically — only glyphs actually used end up in the file
  const font = await pdfDoc.embedFont(fontBytes);

  const pageW = opts.orientation === "portrait" ? A4_W : A4_H;
  const pageH = opts.orientation === "portrait" ? A4_H : A4_W;

  await drawCards(pdfDoc, font, cards, opts, pageW, pageH, getLabel);
  await attachOutputIntent(pdfDoc);
  markPdfX3(pdfDoc);

  return pdfDoc;
}

async function docToBlob(pdfDoc: PDFDocument): Promise<Blob> {
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export async function downloadPdf(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver) {
  const blob = await docToBlob(await buildPdf(cards, opts, getLabel));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pecs.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

export async function pdfDataUri(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<string> {
  const blob = await docToBlob(await buildPdf(cards, opts, getLabel));
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function pdfBlob(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<Blob> {
  return docToBlob(await buildPdf(cards, opts, getLabel));
}

export async function printPdf(cards: Card[], opts: PrintOpts, getLabel?: LabelResolver): Promise<void> {
  if (cards.length === 0) return;
  const pdfDoc = await buildPdf(cards, opts, getLabel);
  pdfDoc.catalog.set(
    PDFName.of("OpenAction"),
    pdfDoc.context.obj({ Type: "Action", S: "Named", N: "Print" }),
  );
  const blob = await docToBlob(pdfDoc);
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;";
  iframe.src = url;
  iframe.onload = () => {
    window.setTimeout(() => {
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
      catch { window.open(url, "_blank"); }
    }, 200);
  };
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    if (iframe.parentElement) iframe.parentElement.removeChild(iframe);
    URL.revokeObjectURL(url);
  }, 60_000);
}

async function drawCards(
  pdfDoc: PDFDocument,
  font: PDFFont,
  cards: Card[],
  opts: PrintOpts,
  pageW: number,
  pageH: number,
  getLabel?: LabelResolver,
) {
  const grid   = GRID[opts.size];
  const perPage = grid * grid;
  const gap    = opts.cutMarks ? 18 : 4;
  const margin = opts.cutMarks ? 14 : 8;
  const bleed  = opts.cutMarks ? BLEED_MM : 0;
  const cellW  = (pageW - margin * 2 - gap * (grid - 1)) / grid;
  const cellH  = (pageH - margin * 2 - gap * (grid - 1)) / grid;

  let page = addPage(pdfDoc, opts, pageW, pageH);
  if (opts.cutMarks) drawRegistrationMarks(page, pageW, pageH, margin);

  for (let i = 0; i < cards.length; i++) {
    const idx = i % perPage;
    if (i > 0 && idx === 0) {
      page = addPage(pdfDoc, opts, pageW, pageH);
      if (opts.cutMarks) drawRegistrationMarks(page, pageW, pageH, margin);
    }
    const col = idx % grid;
    const row = Math.floor(idx / grid);
    const x = margin + col * (cellW + gap);
    const y = margin + row * (cellH + gap);

    await renderCard(pdfDoc, page, font, cards[i], x, y, cellW, cellH, bleed, pageH, opts, getLabel);
    if (opts.cutMarks) drawCropMarks(page, x, y, cellW, cellH, pageH);
  }
}

function addPage(pdfDoc: PDFDocument, opts: PrintOpts, pageW: number, pageH: number): PDFPage {
  const page   = pdfDoc.addPage([pt(pageW), pt(pageH)]);
  const margin = opts.cutMarks ? 14 : 8;
  const bleed  = opts.cutMarks ? BLEED_MM : 0;
  page.node.set(PDFName.of("TrimBox"), pdfDoc.context.obj([
    pt(margin), pt(margin), pt(pageW - margin), pt(pageH - margin),
  ]));
  page.node.set(PDFName.of("BleedBox"), pdfDoc.context.obj([
    pt(margin - bleed), pt(margin - bleed),
    pt(pageW - margin + bleed), pt(pageH - margin + bleed),
  ]));
  return page;
}

// Hybrid rendering:
//   • background, border, text  → pdf-lib vectors with embedded Inter font (true CMYK when requested)
//   • image                     → canvas JPEG (always RGB — unavoidable in browser)
async function renderCard(
  pdfDoc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  card: Card,
  trimX: number,
  trimY: number,
  trimW: number,
  trimH: number,
  bleedMm: number,
  pageH: number,
  opts: PrintOpts,
  getLabel?: LabelResolver,
) {
  const label     = getLabel ? getLabel(card) : card.label;
  const padding   = Math.min(trimW, trimH) * 0.06;
  const labelArea = opts.showLabels ? trimH * 0.18 : 0;
  const cornerR   = Math.min(trimW, trimH) * 0.04;
  const totalW    = trimW + 2 * bleedMm;
  const totalH    = trimH + 2 * bleedMm;

  const imgX = trimX + padding;
  const imgY = trimY + padding;
  const imgW = trimW - padding * 2;
  const imgH = trimH - padding * 2 - labelArea;

  const col = (c: number, m: number, y: number, k: number, r: number, g: number, b: number): Color =>
    opts.cmyk ? cmyk(c, m, y, k) : rgb(r / 255, g / 255, b / 255);

  const white      = col(0, 0, 0, 0,    255, 255, 255);
  const border     = col(0, 0, 0, 0.15, 212, 212, 216);
  const textCol    = col(0, 0, 0, 0.88, 31,  41,  55);
  const phFill     = col(0, 0, 0, 0.08, 236, 238, 242);
  const phTextCol  = col(0, 0, 0, 0.40, 156, 163, 175);

  // 1. White background (extends into bleed)
  page.drawSvgPath(rrSvg(pt(totalW), pt(totalH), pt(cornerR)), {
    x: pt(trimX - bleedMm), y: fy(trimY - bleedMm, pageH),
    color: white,
  });

  // 2. Image (canvas JPEG) or placeholder
  const imgJpeg = await renderImageToJpeg(card, imgW, imgH);
  if (imgJpeg) {
    const jpg = await pdfDoc.embedJpg(dataUrlToBytes(imgJpeg));
    page.drawImage(jpg, {
      x: pt(imgX), y: fyRect(imgY, imgH, pageH),
      width: pt(imgW), height: pt(imgH),
    });
  } else {
    page.drawSvgPath(rrSvg(pt(imgW), pt(imgH), pt(cornerR * 0.5)), {
      x: pt(imgX), y: fy(imgY, pageH),
      color: phFill,
    });
    const pFs = Math.max(6, Math.min(imgW, imgH) * 0.12 * MM_TO_PT);
    const { text: pText, size: pSize } = fitLabel(font, label, pFs, pt(imgW * 0.88));
    page.drawText(pText, {
      x: pt(imgX + imgW / 2) - font.widthOfTextAtSize(pText, pSize) / 2,
      y: fy(imgY + imgH / 2, pageH) - font.heightAtSize(pSize) / 2,
      font, size: pSize, color: phTextCol,
    });
  }

  // 3. Border at trim line (stroke only — no fill so the image shows through)
  page.drawSvgPath(rrSvg(pt(trimW), pt(trimH), pt(cornerR)), {
    x: pt(trimX), y: fy(trimY, pageH),
    borderColor: border, borderWidth: pt(0.3),
  });

  // 4. Label — vector text with embedded Inter, font size shrinks then clips to fit
  if (opts.showLabels) {
    const fontSize = Math.max(6, labelArea * 0.42 * MM_TO_PT);
    const { text: labelText, size: lSize } = fitLabel(font, label, fontSize, pt(trimW * 0.88));
    const labelCenterY = trimY + trimH - labelArea / 2;
    page.drawText(labelText, {
      x: pt(trimX + trimW / 2) - font.widthOfTextAtSize(labelText, lSize) / 2,
      y: fy(labelCenterY, pageH) - font.heightAtSize(lSize) / 2,
      font, size: lSize, color: textCol,
    });
  }
}

// Render only the card image scaled/fitted into the given area (white background, JPEG output).
// Returns null when the card has no image.
async function renderImageToJpeg(card: Card, widthMm: number, heightMm: number): Promise<string | null> {
  const img = await loadImage(card.image);
  if (!img || img.naturalWidth === 0) return null;
  const cw = Math.round(widthMm * MM_TO_PX);
  const ch = Math.round(heightMm * MM_TO_PX);
  const canvas = document.createElement("canvas");
  canvas.width  = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cw, ch);
  const ratio = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.split(",")[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// SVG path for a rounded rectangle in SVG coordinate space (top-left origin, y-down).
// pdf-lib's drawSvgPath applies a y-flip, so this renders correctly in PDF.
function rrSvg(w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return (
    `M ${rr},0 L ${w - rr},0 Q ${w},0 ${w},${rr} ` +
    `L ${w},${h - rr} Q ${w},${h} ${w - rr},${h} ` +
    `L ${rr},${h} Q 0,${h} 0,${h - rr} ` +
    `L 0,${rr} Q 0,0 ${rr},0 Z`
  );
}

// Shrink font size to half the nominal size, then clip with ellipsis if still too wide.
function fitLabel(font: PDFFont, text: string, size: number, maxW: number): { text: string; size: number } {
  let fs = size;
  const minFs = size * 0.5;
  while (fs > minFs && font.widthOfTextAtSize(text, fs) > maxW) fs -= 0.5;
  if (font.widthOfTextAtSize(text, fs) > maxW) text = clipText(font, text, fs, maxW);
  return { text, size: fs };
}

function clipText(font: PDFFont, text: string, size: number, maxW: number): string {
  const ell = "…";
  if (font.widthOfTextAtSize(text, size) <= maxW) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (font.widthOfTextAtSize(text.slice(0, mid) + ell, size) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ell;
}

// Professional crop marks: MARK_OFFSET_MM gap from trim box, then MARK_LEN_MM long.
function drawCropMarks(page: PDFPage, x: number, y: number, w: number, h: number, pH: number) {
  const lo: Partial<PDFPageDrawLineOptions> = { thickness: pt(0.15), color: REG_BLACK };
  const o = MARK_OFFSET_MM, m = MARK_LEN_MM;
  const ln = (x1: number, y1: number, x2: number, y2: number) =>
    page.drawLine({ start: { x: pt(x1), y: fy(y1, pH) }, end: { x: pt(x2), y: fy(y2, pH) }, ...lo });

  ln(x - o - m, y, x - o, y);         ln(x, y - o - m, x, y - o);
  ln(x + w + o, y, x + w + o + m, y); ln(x + w, y - o - m, x + w, y - o);
  ln(x - o - m, y + h, x - o, y + h); ln(x, y + h + o, x, y + h + o + m);
  ln(x + w + o, y + h, x + w + o + m, y + h); ln(x + w, y + h + o, x + w, y + h + o + m);
}

// Registration marks: crosshair inside two concentric circles at each page corner.
function drawRegistrationMarks(page: PDFPage, pageW: number, pageH: number, margin: number) {
  const r = REG_R, pos = margin / 2;
  const corners: [number, number][] = [
    [pos, pos], [pageW - pos, pos], [pos, pageH - pos], [pageW - pos, pageH - pos],
  ];
  for (const [cx, cy] of corners) {
    const cpx = pt(cx), cpy = fy(cy, pageH);
    page.drawEllipse({ x: cpx, y: cpy, xScale: pt(r),   yScale: pt(r),   borderColor: REG_BLACK, borderWidth: pt(0.2) });
    page.drawEllipse({ x: cpx, y: cpy, xScale: pt(0.7), yScale: pt(0.7), borderColor: REG_BLACK, borderWidth: pt(0.2) });
    const lo: Partial<PDFPageDrawLineOptions> = { thickness: pt(0.2), color: REG_BLACK };
    page.drawLine({ start: { x: pt(cx - r - 1.5), y: cpy },               end: { x: pt(cx + r + 1.5), y: cpy },               ...lo });
    page.drawLine({ start: { x: cpx,               y: fy(cy - r - 1.5, pageH) }, end: { x: cpx, y: fy(cy + r + 1.5, pageH) }, ...lo });
  }
}

// PDF/X-3: add GTS_PDFXVersion to the Info dictionary.
// pdf-lib has no public API for custom Info entries — we access the dict directly.
function markPdfX3(pdfDoc: PDFDocument) {
  try {
    const infoRef = pdfDoc.catalog.get(PDFName.of("Info"));
    if (!infoRef) return;
    const info = pdfDoc.context.lookup(infoRef);
    if (!info || !("set" in info)) return;
    const d = info as { set: (k: unknown, v: unknown) => void };
    d.set(PDFName.of("GTS_PDFXVersion"),     PDFString.of("PDF/X-3:2003"));
    d.set(PDFName.of("GTS_PDFXConformance"), PDFString.of("PDF/X-3:2003"));
  } catch { /* non-critical */ }
}

// PDF/X-3 OutputIntent: embed sRGB ICC profile so RIP systems know the colour space.
async function attachOutputIntent(pdfDoc: PDFDocument) {
  let iccBytes: ArrayBuffer;
  try {
    const res = await fetch("/srgb.icc");
    if (!res.ok) return;
    iccBytes = await res.arrayBuffer();
  } catch { return; }

  const iccStream = pdfDoc.context.stream(new Uint8Array(iccBytes), {
    N: 3, Length: iccBytes.byteLength,
  });
  const iccRef = pdfDoc.context.register(iccStream);
  const intent = pdfDoc.context.obj({
    Type: "OutputIntent",
    S: PDFName.of("GTS_PDFX"),
    OutputConditionIdentifier: PDFString.of("sRGB IEC61966-2.1"),
    Info: PDFString.of("sRGB IEC61966-2.1"),
    DestOutputProfile: iccRef,
  });
  pdfDoc.catalog.set(
    PDFName.of("OutputIntents"),
    pdfDoc.context.obj([pdfDoc.context.register(intent)]),
  );
}
