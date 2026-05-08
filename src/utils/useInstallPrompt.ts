import { useEffect, useState } from "react";

const KEY_COUNT = "pwa_visit_count";
const KEY_DATES = "pwa_visit_dates";
const KEY_DISMISSED = "pwa_dismissed_at";
const SESSION_KEY = "pwa_visit_tracked";

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
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
  if (isStandalone()) return false;

  const dismissed = localStorage.getItem(KEY_DISMISSED);
  if (dismissed) {
    const msSince = Date.now() - Number(dismissed);
    if (msSince < 30 * 24 * 60 * 60 * 1000) return false;
  }

  const count = Number(localStorage.getItem(KEY_COUNT) ?? "0");
  const dates: string[] = JSON.parse(localStorage.getItem(KEY_DATES) ?? "[]");
  return count >= 3 || dates.length >= 2;
}

interface InstallPromptResult {
  shouldShow: boolean;
  isIos: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
}

export function useInstallPrompt(): InstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const isIos = isIOS();

  useEffect(() => {
    trackVisit();

    const ready = shouldShowBanner();
    if (!ready) return;

    if (isIos) {
      setShouldShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShouldShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, [isIos]);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShouldShow(false);
    if (outcome === "accepted") {
      localStorage.setItem(KEY_DISMISSED, "installed");
    }
  };

  const dismiss = () => {
    setShouldShow(false);
    localStorage.setItem(KEY_DISMISSED, String(Date.now()));
  };

  return { shouldShow, isIos, install, dismiss };
}
