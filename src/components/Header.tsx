import { IconHelp, IconPrint, IconHeart } from "./Icons";
import { useLang, useT } from "../utils/I18nContext";
import { LOCALE_KEYS, LOCALES } from "../locales";

type Props = {
  onHowItWorks: () => void;
  onPrintTips: () => void;
};

export default function Header({ onHowItWorks, onPrintTips }: Props) {
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <header className="header">
      <div className="logo">
        <span className="logo-mark">
          <IconHeart size={18} />
        </span>
        <div className="logo-text">
          <strong>PECS</strong>
          <span>{t.header.logoSub}</span>
        </div>
      </div>

      <nav className="header-nav">
        <button className="link-btn" onClick={onHowItWorks}>
          <IconHelp size={18} />
          <span>{t.header.howItWorks}</span>
        </button>
        <button className="link-btn" onClick={onPrintTips}>
          <IconPrint size={18} />
          <span>{t.header.printTips}</span>
        </button>
        <div className="lang-switch" role="group" aria-label="Language">
          {LOCALE_KEYS.map((key) => (
            <button
              key={key}
              className={`lang-option ${key === lang ? "active" : ""}`}
              onClick={() => setLang(key)}
              title={LOCALES[key].langFull}
              aria-pressed={key === lang}
            >
              {LOCALES[key].lang}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
