import { useEffect, useState } from "react";

const KEY_COUNT = "pwa_visit_count";
const KEY_DATES = "pwa_visit_dates";
const KEY_DISMISSED = "pwa_dismissed_at";
const SESSION_KEY = "pwa_visit_tracked";

// Capture the event at module level — before React mounts — to avoid race conditions.
let _deferredPrompt: any = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  _deferredPrompt = e;
});

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isMobile() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function trackVisit() {
  if (sessionStorage.getItem(SESSION_KEY)) return;
  sessionStorage.setItem(SESSION_KEY, "1");

  const count = Number(localStorage.getItem(KEY_COUNT) ?? "0") + 1;
  localStorage.setItem(KEY_COUNT, String(count));

  const today = new Date().toISOString().slice(0, 10);
  const dates: string[] = JSON.parse(localStorage.getItem(KEY_DATES) ?? "[]");
  if (!dates.includes(today)) {
    dates.push(today);
    localStorage.setItem(KEY_DATES, JSON.stringify(dates));
  }
}

function shouldShowBanner(): boolean {
  if (!isMobile()) return false;
  if (isStandalone()) return false;

  const dismissed = localStorage.getItem(KEY_DISMISSED);
  if (dismissed === "installed") return false;
  if (dismissed) {
    const msSince = Date.now() - Number(dismissed);
    if (msSince < 30 * 24 * 60 * 60 * 1000) return false;
  }

  const count = Number(localStorage.getItem(KEY_COUNT) ?? "0");
  const dates: string[] = JSON.parse(localStorage.getItem(KEY_DATES) ?? "[]");
  return count >= 3 || dates.length >= 2;
}

export interface InstallPromptResult {
  shouldShow: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
}

export function useInstallPrompt(): InstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => _deferredPrompt);
  const [shouldShow, setShouldShow] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    trackVisit();
    if (!shouldShowBanner()) return;

    if (_deferredPrompt) {
      setDeferredPrompt(_deferredPrompt);
      setShouldShow(true);
      return;
    }

    if (ios) {
      setShouldShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      _deferredPrompt = e;
      setDeferredPrompt(e);
      setShouldShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, [ios]);

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      _deferredPrompt = null;
      setDeferredPrompt(null);
      setShouldShow(false);
      if (outcome === "accepted") {
        localStorage.setItem(KEY_DISMISSED, "installed");
      }
    }
  };

  const dismiss = () => {
    setShouldShow(false);
    localStorage.setItem(KEY_DISMISSED, String(Date.now()));
  };

  return { shouldShow, install, dismiss };
}
