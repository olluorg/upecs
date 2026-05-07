import { useCallback, useEffect, useState } from "react";
import type { View } from "../types";

const VIEWS: View[] = ["library", "myset", "sets", "settings", "instructions", "commboard"];

function parseHash(): { view: View; setId: string | null } {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/");
  const viewStr = parts[0];
  const view = (VIEWS.includes(viewStr as View) ? viewStr : "library") as View;
  const setId = view === "commboard" && parts[1] ? decodeURIComponent(parts[1]) : null;
  return { view, setId };
}

export function useHashView(): [View, string | null, (v: View, setId?: string) => void] {
  const [state, setState] = useState<{ view: View; setId: string | null }>(parseHash);

  const setView = useCallback((v: View, setId?: string) => {
    window.location.hash = v === "commboard" && setId ? `${v}/${encodeURIComponent(setId)}` : v;
    setState({ view: v, setId: setId ?? null });
  }, []);

  useEffect(() => {
    const onHashChange = () => setState(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return [state.view, state.setId, setView];
}
