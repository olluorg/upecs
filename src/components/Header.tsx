import { useRef, useState } from "react";
import { IconHelp, IconPrint } from "./Icons";
import { useLang, useT } from "../utils/I18nContext";
import { LOCALE_KEYS, LOCALES } from "../locales";

type Props = {
  onHowItWorks: () => void;
  onPrintTips: () => void;
};

export default function Header({ onHowItWorks, onPrintTips }: Props) {
  const t = useT();
  const { lang, setLang } = useLang();
  const [animating, setAnimating] = useState(false);
  const leaving = useRef(false);

  const handleMouseEnter = () => {
    leaving.current = false;
    setAnimating(true);
  };
  const handleMouseLeave = () => {
    leaving.current = true;
  };
  const handleIteration = () => {
    if (leaving.current) {
      setAnimating(false);
      leaving.current = false;
    }
  };

  return (
    <header className="header">
      <a
        href="#library"
        className={`logo${animating ? " logo-animating" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="logo-mark">
          <img src="/logo.png" alt="PECS logo" width={36} height={36} />
        </span>
        <div className="logo-text">
          <strong>
            <span style={{ color: "#3D93E6" }} onAnimationIteration={handleIteration}>P</span>
            <span style={{ color: "#75C54A" }}>E</span>
            <span style={{ color: "#FFB41D" }}>C</span>
            <span style={{ color: "#F05D4D" }}>S</span>
          </strong>
          <span>{t.header.logoSub}</span>
        </div>
      </a>

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
