export type Card = {
  id: string;
  label: string;
  image: string;
  category: string;
  custom?: boolean;
};

export type CategoryDef = {
  id: string;
  label: string;
};

export type View = "library" | "myset" | "settings" | "instructions";
export type PrintSize = "2x2" | "3x3" | "4x4";
export type Orientation = "portrait" | "landscape";

export type ModalKind =
  | "how"
  | "tips"
  | "addCustom"
  | "pdfPreview"
  | null;

export type PrintOpts = {
  size: PrintSize;
  orientation: Orientation;
  showLabels: boolean;
};
