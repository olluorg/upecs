import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LOCALES, type Translations } from "../locales";

const STORAGE_KEY = "lang";
const DEFAULT_LANG = "ru";

function getInitialLang(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LOCALES[stored]) return stored;
  const browser = navigator.language.split("-")[0];
  if (LOCALES[browser]) return browser;
  return DEFAULT_LANG;
}

type I18nContextValue = {
  t: Translations;
  lang: string;
  setLang: (lang: string) => void;
};

const I18nContext = createContext<I18nContextValue>({
  t: LOCALES[DEFAULT_LANG],
  lang: DEFAULT_LANG,
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<string>(getInitialLang);

  const setLang = (next: string) => {
    if (!LOCALES[next]) return;
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  };

  useEffect(() => {
    document.title = LOCALES[lang].pageTitle;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ t: LOCALES[lang], lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT(): Translations {
  return useContext(I18nContext).t;
}

export function useLang(): { lang: string; setLang: (l: string) => void } {
  const { lang, setLang } = useContext(I18nContext);
  return { lang, setLang };
}
