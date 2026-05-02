import { IconHelp, IconPrint, IconHeart } from "./Icons";

type Props = {
  onHowItWorks: () => void;
  onPrintTips: () => void;
};

export default function Header({ onHowItWorks, onPrintTips }: Props) {
  return (
    <header className="header">
      <div className="logo">
        <span className="logo-mark">
          <IconHeart size={18} />
        </span>
        <div className="logo-text">
          <strong>PECS</strong>
          <span>КОНСТРУКТОР</span>
        </div>
      </div>

      <nav className="header-nav">
        <button className="link-btn" onClick={onHowItWorks}>
          <IconHelp size={18} />
          <span>Как это работает?</span>
        </button>
        <button className="link-btn" onClick={onPrintTips}>
          <IconPrint size={18} />
          <span>Печать и советы</span>
        </button>
        <span className="lang-pill">RU</span>
      </nav>
    </header>
  );
}
