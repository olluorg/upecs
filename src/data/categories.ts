import type { CategoryDef } from "../types";

export const CATEGORIES: CategoryDef[] = [
  { id: "all", label: "Все" },
  { id: "food", label: "Еда" },
  { id: "drink", label: "Напитки" },
  { id: "actions", label: "Действия" },
  { id: "people", label: "Люди" },
  { id: "toys", label: "Игрушки" },
  { id: "needs", label: "Потребности" },
  { id: "emotions", label: "Эмоции" },
  { id: "other", label: "Другое" },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
