import { useT } from "../utils/I18nContext";
import type { InstallPromptResult } from "../utils/useInstallPrompt";

type Props = Pick<InstallPromptResult, "shouldShow" | "canInstallNatively" | "isIos" | "install" | "dismiss">;

export default function InstallBanner({ shouldShow, canInstallNatively, isIos, install, dismiss }: Props) {
  const t = useT();

  if (!shouldShow) return null;

  const hint = isIos
    ? t.installBanner.hintIos
    : canInstallNatively
    ? t.installBanner.hint
    : t.installBanner.hintAndroid;

  return (
    <div className="install-banner" role="region" aria-label={t.installBanner.title}>
      <div className="install-banner-icon">📲</div>
      <div className="install-banner-body">
        <strong>{t.installBanner.title}</strong>
        <span>{hint}</span>
      </div>
      <div className="install-banner-actions">
        {canInstallNatively && !isIos && (
          <button className="btn-primary install-banner-btn" onClick={install}>
            {t.installBanner.install}
          </button>
        )}
        <button className="install-banner-close" onClick={dismiss} aria-label={t.common.close}>
          ✕
        </button>
      </div>
    </div>
  );
}
