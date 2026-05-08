import { useT } from "../utils/I18nContext";
import type { InstallPromptResult } from "../utils/useInstallPrompt";

export default function InstallBanner({ shouldShow, install, dismiss }: InstallPromptResult) {
  const t = useT();

  if (!shouldShow) return null;

  return (
    <div className="install-banner" role="region" aria-label={t.installBanner.title}>
      <div className="install-banner-icon">📲</div>
      <div className="install-banner-body">
        <strong>{t.installBanner.title}</strong>
        <span>{t.installBanner.hint}</span>
      </div>
      <div className="install-banner-actions">
        <button className="btn-primary install-banner-btn" onClick={install}>
          {t.installBanner.install}
        </button>
        <button className="install-banner-close" onClick={dismiss} aria-label={t.common.close}>
          ✕
        </button>
      </div>
    </div>
  );
}
