import { useCallback, useEffect, useState } from "react";
import { idbGet, idbSet } from "./idb";

type Setter<T> = (next: T | ((prev: T) => T)) => void;

export function useIdbState<T>(
  key: string,
  fallback: T,
): [T, Setter<T>, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const v = await idbGet<T>(key);
        if (canceled) return;
        if (v !== undefined) {
          setValue(v);
        } else {
          const ls = localStorage.getItem(`pecs:${key}`);
          if (ls !== null) {
            try {
              const parsed = JSON.parse(ls) as T;
              setValue(parsed);
              await idbSet(key, parsed);
            } catch {
              // ignore parse error
            }
            localStorage.removeItem(`pecs:${key}`);
          }
        }
      } catch {
        // ignore IDB errors, keep fallback
      } finally {
        if (!canceled) setLoaded(true);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    idbSet(key, value).catch(() => {});
  }, [key, value, loaded]);

  const setter = useCallback<Setter<T>>((next) => {
    setValue((prev) =>
      typeof next === "function" ? (next as (p: T) => T)(prev) : next,
    );
  }, []);

  return [value, setter, loaded];
}
