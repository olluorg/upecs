import { useCallback, useEffect, useState } from "react";
import type { View } from "../types";

const VIEWS: View[] = ["library", "myset", "sets", "settings", "instructions"];

function parseHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return (VIEWS.includes(hash as View) ? hash : "library") as View;
}

export function useHashView(): [View, (v: View) => void] {
  const [view, setViewState] = useState<View>(parseHash);

  const setView = useCallback((v: View) => {
    window.location.hash = v;
    setViewState(v);
  }, []);

  useEffect(() => {
    const onHashChange = () => setViewState(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return [view, setView];
}
