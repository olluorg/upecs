import ru from "./ru";
import en from "./en";

export type Translations = typeof ru;

export const LOCALES: Record<string, Translations> = { ru, en };
export const LOCALE_KEYS = Object.keys(LOCALES) as (keyof typeof LOCALES)[];

export { ru, en };
