import React from "react";

export type TabKey = "tap" | "upgrades" | "artifacts" | "skins" | "hc";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

const items: Array<{ key: TabKey; icon: string; label: string }> = [
  { key: "tap",       icon: "☝️", label: "Тапати" },
  { key: "upgrades",  icon: "🛠️", label: "Апгрейди" },
  { key: "artifacts", icon: "🗼",  label: "Артефакти" },
  { key: "skins",     icon: "👑",  label: "Скіни" },
  { key: "hc",        icon: "💠",  label: "HC" },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Основна навігація">
      {items.map(({ key, icon, label }) => {
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
