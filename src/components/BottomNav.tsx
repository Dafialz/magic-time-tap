import React from "react";

export type TabKey = "tap" | "upgrades" | "artifacts" | "craft" | "skins" | "leaders";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

/* ===== Magic Time icon set (fantasy / arcane) =====
   - Ті ж розміри (22x22), stroke="currentColor"
   - Стиль: руни/магія/алхімія, м’які скруглення
*/

/* ТАПАТИ — руна “клік/імпульс” (палець + іскра) */
const HandIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 21H15.2c2.4 0 4.3-1.7 4.3-4.1V11c0-.9-.7-1.6-1.6-1.6S16.3 10.1 16.3 11v2.4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.3 13V6.4c0-1.2-1-2.2-2.2-2.2S12 5.2 12 6.4V13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12.6V9.6c0-1.1-.9-2-2-2s-2 .9-2 2v6.1c0 1.2.5 2.3 1.4 3.1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M8.4 4.6l.6-1.4.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M11 3.2l.3-.8.3.8.8.3-.8.3-.3.8-.3-.8-.8-.3.8-.3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      opacity="0.9"
    />
  </svg>
);

/* ДРУЗІ — “portal / links” (магічне коло з вузлами) */
const HourglassIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M7.4 12c1.4-2.4 3.1-3.6 4.6-3.6s3.2 1.2 4.6 3.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M7.4 12c1.4 2.4 3.1 3.6 4.6 3.6s3.2-1.2 4.6-3.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.9"
    />
    <circle cx="12" cy="6.2" r="1.1" fill="currentColor" />
    <circle cx="6.2" cy="12" r="1.1" fill="currentColor" />
    <circle cx="17.8" cy="12" r="1.1" fill="currentColor" />
    <circle cx="12" cy="17.8" r="1.1" fill="currentColor" />
  </svg>
);

/* АРТЕФАКТИ — кристал з рунами */
const ObeliskIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l6 7-6 11L6 10l6-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
    <path d="M9.2 12.1h5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    <path
      d="M10.2 15.2l1.8 1.2 1.8-1.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
  </svg>
);

/* КРАФТ — алхімічний реторт + бульбашки */
const FlaskIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M10 3h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 3v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M12 9c0 3.5-6 4.1-6 8.3 0 2 1.6 3.7 3.7 3.7h4.6c2.1 0 3.7-1.7 3.7-3.7 0-4.2-6-4.8-6-8.3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M8.4 16.2c1.1.9 2.4 1.4 3.6 1.4s2.5-.5 3.6-1.4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.9"
    />
    <circle cx="9.1" cy="14.1" r="0.9" fill="currentColor" opacity="0.9" />
    <circle cx="14.8" cy="13.3" r="0.7" fill="currentColor" opacity="0.85" />
    <circle cx="12.9" cy="15.2" r="0.5" fill="currentColor" opacity="0.8" />
  </svg>
);

/* СУНДУКИ — скриня + замок-руна */
const TrophyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M5.5 10.2h13c.9 0 1.7.8 1.7 1.7v6.3c0 1-.8 1.8-1.8 1.8H5.6c-1 0-1.8-.8-1.8-1.8v-6.3c0-.9.8-1.7 1.7-1.7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 10.2c.7-2.3 2.6-3.8 5.5-3.8s4.8 1.5 5.5 3.8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M12 10.2v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
    <path
      d="M10.2 14.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v.8H10.2v-.8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M10 16h4v3h-4v-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 17.1v.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
  </svg>
);

// “Лідери” у нижній навігації не показуємо
const items: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "tap", label: "Тапати", icon: <HandIcon /> },
  { key: "upgrades", label: "Друзі", icon: <HourglassIcon /> },
  { key: "artifacts", label: "Артефакти", icon: <ObeliskIcon /> },
  { key: "craft", label: "Крафт", icon: <FlaskIcon /> },
  { key: "skins", label: "Сундуки", icon: <TrophyIcon /> },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Основна навігація">
      {items.map(({ key, label, icon }) => {
        const isActive = key === active;
        return (
          <button key={key} className={`bn-item${isActive ? " active" : ""}`} onClick={() => onChange(key)}>
            <div className="bn-card">
              <div className="bn-icon" aria-hidden="true">
                {icon}
              </div>
            </div>
            <div className="bn-label">{label}</div>
          </button>
        );
      })}
    </nav>
  );
}
