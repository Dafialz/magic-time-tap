import React from "react";

export type TabKey = "tap" | "upgrades" | "artifacts" | "craft" | "skins" | "leaders";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

/* ТАПАТИ — контур руки 1-в-1 */
const HandIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* суцільний замкнений контур; лінії скруглені */}
    <path
      d="
        M7.1 18.6
        C7.1 20.2 8.3 21.5 10.0 21.5
        H16.3
        C18.9 21.5 20.9 19.6 20.9 17.0
        V11.2
        C20.9 10.3 20.2 9.6 19.3 9.6
        C18.4 9.6 17.7 10.3 17.7 11.2
        V13.0
        H15.9
        V6.1
        C15.9 4.9 14.9 4.0 13.7 4.0
        C12.5 4.0 11.6 4.9 11.6 6.1
        V12.8
        H9.9
        V9.5
        C9.9 8.3 8.9 7.3 7.7 7.3
        C6.5 7.3 5.5 8.3 5.5 9.5
        V15.0
        C5.5 16.7 6.3 17.8 7.1 18.6
        Z
      "
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* невелика база-зап’ястя — як у зразку */}
    <path d="M8 21.5H16.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
