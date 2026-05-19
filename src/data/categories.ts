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
  { id: "numbers", label: "Цифры" },
  { id: "animals", label: "Животные" },
  { id: "transport", label: "Транспорт" },
  { id: "clothes", label: "Одежда" },
  { id: "school", label: "Школа" },
  { id: "medicine", label: "Медицина" },
  { id: "places", label: "Места" },
  { id: "household", label: "Дом" },
  { id: "objects", label: "Предметы" },
  { id: "shapes", label: "Формы" },
  { id: "colors", label: "Цвета" },
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
  numbers: "#38bdf8",
  animals: "#84cc16",
  transport:"#f97316",
  clothes: "#c084fc",
  school:  "#818cf8",
  medicine:"#ef4444",
  places:  "#14b8a6",
  household:"#a3a3a3",
  objects: "#64748b",
  shapes:  "#22c55e",
  colors:  "#ec4899",
  other:   "#9ca3af",
};

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
