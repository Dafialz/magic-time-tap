import React from "react";

export type TabKey = "tap" | "upgrades" | "artifacts" | "craft" | "skins" | "leaders";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

// Іконка "Тапати": контур руки з піднятим вказівним пальцем (максимально як у зразку)
const HandIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {/* єдиний замкнений контур долоні */}
    <path
      d="
        M7.2 18.8
        C7.2 20.1 8.3 21 9.8 21
        H16.2
        C18.8 21 20.8 19 20.8 16.4
        V11.4
        C20.8 10.6 20.1 10 19.3 10
        C18.5 10 17.8 10.6 17.8 11.4
        V13
        H16
        V6.3
        C16 5.0 14.9 4 13.6 4
        C12.3 4 11.2 5.0 11.2 6.3
        V12.9
        H9.6
        V9.6
        C9.6 8.3 8.6 7.3 7.3 7.3
        C6.0 7.3 5.0 8.3 5.0 9.6
        V14.9
        C5.0 16.9 6.0 18.0 7.2 18.8
        Z
      "
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* невелика основа зап’ястя для візуальної стабільності */}
    <path d="M8 21h7.8" strokeLinecap="round" />
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

// “Лідери” у нижній навігації не показуємо
const items: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "tap",       label: "Тапати",    icon: <HandIcon/> },
  { key: "upgrades",  label: "Друзі",     icon: <HourglassIcon/> },
  { key: "artifacts", label: "Артефакти", icon: <ObeliskIcon/> },
  { key: "craft",     label: "Крафт",     icon: <FlaskIcon/> },
  { key: "skins",     label: "Сундуки",   icon: <TrophyIcon/> },
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
