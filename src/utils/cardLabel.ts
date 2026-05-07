import type { Translations } from "../locales";
import type { Card } from "../types";

export function getCardLabel(t: Translations, card: Card): string {
  if (card.custom) return card.label;
  return t.cardLabels[card.id] ?? card.label;
}
