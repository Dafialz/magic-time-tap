import React from "react";

export type TabKey = "tap" | "upgrades" | "artifacts" | "craft" | "skins" | "leaders";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

// SVG-іконки
const HandIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 11v3c0 1.8-1.1 3.3-2.3 4.2" strokeLinecap="round"/>
    <path d="M11 16c0 2 1.6 3.5 3.5 3.5h.5a3 3 0 0 0 3-3v-3a2 2 0 0 0-4 0" strokeLinecap="round"/>
    <path d="M11 6v7" strokeLinecap="round"/>
    <path d="M13.5 6v5" strokeLinecap="round"/>
    <path d="M9.5 8v5" strokeLinecap="round"/>
    <path d="M7.5 9v2" strokeLinecap="round"/>
  </svg>
);

const HourglassIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 4h12" strokeLinecap="round"/>
    <path d="M6 20h12" strokeLinecap="round"/>
    <path d="M7 5c0 4 10 4 10 8s-10 4-10 8" />
    <path d="M17 5c0 4-10 4-10 8s10 4 10 8" />
  </svg>
);

const ObeliskIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l3 5v12H9V8l3-5z" />
    <path d="M9 19h6l2 2H7l2-2z" />
  </svg>
);

const FlaskIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 3h4" strokeLinecap="round"/>
    <path d="M10 3v6" />
    <path d="M14 3v6" />
    <path d="M7 21h10l1.5-2.5a4.5 4.5 0 0 0-3.9-6.7H9.4a4.5 4.5 0 0 0-3.9 6.7L7 21z" />
    <path d="M9 13c.8 1 2.2 1.6 3 1.6s2.2-.6 3-1.6" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 5h8v3a4 4 0 0 1-8 0V5z" />
    <path d="M6 5h-3v2a4 4 0 0 0 4 4" />
    <path d="M18 5h3v2a4 4 0 0 1-4 4" />
    <path d="M12 12v4" />
    <path d="M9 20h6" />
    <path d="M8 20l1-4h6l1 4" />
  </svg>
);

const CrownIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7l4 4 5-6 5 6 4-4v10H3V7z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const items: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "tap",       label: "Тапати",     icon: <HandIcon/> },
  { key: "upgrades",  label: "Апгрейди",   icon: <HourglassIcon/> },
  { key: "artifacts", label: "Артефакти",  icon: <ObeliskIcon/> },
  { key: "craft",     label: "Крафт",      icon: <FlaskIcon/> },
  { key: "skins",     label: "СКІНИ",      icon: <TrophyIcon/> },
  { key: "leaders",   label: "Лідери",     icon: <CrownIcon/> },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Основна навігація">
      {items.map(({ key, label, icon }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            className={`bn-item${isActive ? " active" : ""}`}
            onClick={() => onChange(key)}
          >
            <div className="bn-card">
              <div className="bn-icon" aria-hidden="true">{icon}</div>
            </div>
            <div className="bn-label">{label}</div>
          </button>
        );
      })}
    </nav>
  );
}
