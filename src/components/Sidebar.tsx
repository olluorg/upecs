import type { ReactNode } from "react";
import type { View } from "../types";
import {
  IconHome,
  IconList,
  IconSettings,
  IconInfo,
  IconHeart,
  IconFolder,
} from "./Icons";
import { useT } from "../utils/I18nContext";

type Props = {
  view: View;
  setView: (v: View) => void;
  selectedCount: number;
  setsCount: number;
};

export default function Sidebar({ view, setView, selectedCount, setsCount }: Props) {
  const t = useT();

  const items: { id: View; label: string; sub: string; icon: ReactNode }[] = [
    { id: "library",      label: t.nav.library,      sub: t.nav.librarySub,      icon: <IconHome size={18} /> },
    { id: "myset",        label: t.nav.myset,        sub: t.nav.mysetSub,        icon: <IconList size={18} /> },
    { id: "sets",         label: t.nav.sets,         sub: t.nav.setsSub,         icon: <IconFolder size={18} /> },
    { id: "settings",     label: t.nav.settings,     sub: t.nav.settingsSub,     icon: <IconSettings size={18} /> },
    { id: "instructions", label: t.nav.instructions, sub: t.nav.instructionsSub, icon: <IconInfo size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <nav className="side-nav">
        {items.map((it) => (
          <button
            key={it.id}
            className={`side-nav-item ${view === it.id ? "active" : ""}`}
            onClick={() => setView(it.id)}
          >
            <span className="side-icon">{it.icon}</span>
            <span className="side-text">
              <span className="side-title">
                {it.label}
                {it.id === "myset" && selectedCount > 0 && (
                  <span className="side-badge">{selectedCount}</span>
                )}
                {it.id === "sets" && setsCount > 1 && (
                  <span className="side-badge">{setsCount}</span>
                )}
              </span>
              <span className="side-sub">{it.sub}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="promo">
        <div className="promo-title">
          <span className="promo-heart">
            <IconHeart size={16} />
          </span>
          {t.nav.promo}
        </div>
        <p className="promo-text">{t.nav.promoText}</p>
        <img src="/boy.png" alt="" />
      </div>

      <div className="side-footer">
        <span className="promo-heart small">
          <IconHeart size={14} />
        </span>
        <div>
          <div className="footer-title">{t.nav.footerTitle}</div>
          <div className="footer-sub">{t.nav.footerSub}</div>
        </div>
      </div>
    </aside>
  );
}
