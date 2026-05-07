import ru from "./ru";
import en from "./en";

type DeepWiden<T> =
  T extends (...args: infer A) => infer R
    ? (...args: A) => DeepWiden<R>
    : T extends readonly (infer U)[]
    ? readonly DeepWiden<U>[]
    : T extends string
    ? string
    : T extends object
    ? { readonly [K in keyof T]: DeepWiden<T[K]> }
    : T;

export type Translations = DeepWiden<typeof ru>;

export const LOCALES: Record<string, Translations> = { ru, en };
export const LOCALE_KEYS = Object.keys(LOCALES) as (keyof typeof LOCALES)[];

export { ru, en };
