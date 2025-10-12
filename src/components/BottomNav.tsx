import React from "react";

export type TabKey = "tap" | "upgrades" | "artifacts" | "skins" | "hc";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

const items: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  {
    key: "tap",
    label: "Тапати",
    icon: (
      // рука-тап (мінімалістичний SVG, підлаштовується під currentColor)
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 11v-1a2 2 0 1 1 4 0v4" strokeLinecap="round" />
        <path d="M12 10v6" strokeLinecap="round" />
        <path d="M12 16c0 2 1.5 3.5 3.5 3.5h.5a3 3 0 0 0 3-3v-3a2 2 0 0 0-4 0" strokeLinecap="round" />
        <path d="M6 21c1.2-1 2.3-2.5 2.3-4.2V11" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "upgrades",
    label: "Апгрейди",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 6v12M6 12h12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "artifacts",
    label: "Артефакти",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l6 6-6 12L6 9l6-6z" />
      </svg>
    ),
  },
  {
    key: "skins",
    label: "Скіни",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 8h6l1 10H8L9 8z" />
        <path d="M8 8l4-3 4 3" />
      </svg>
    ),
  },
  {
    key: "hc",
    label: "HC",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="7" />
        <path d="M9 12h6M12 9v6" />
      </svg>
    ),
  },
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
