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

export const CATEGORY_COLORS: Record<string, string> = {
  food:    "#f59e0b",
  drink:   "#60a5fa",
  actions: "#34d399",
  people:  "#f472b6",
  toys:    "#a78bfa",
  needs:   "#2dd4bf",
  emotions:"#fb7185",
  other:   "#9ca3af",
};

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
