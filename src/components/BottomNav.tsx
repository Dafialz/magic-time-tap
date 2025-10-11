import React from "react";

export type TabKey = "tap" | "upgrades" | "artifacts" | "skins" | "hc";

const LABELS: Record<TabKey, { icon: string; label: string }> = {
  tap: { icon: "🕹️", label: "Тап" },
  upgrades: { icon: "⚙️", label: "Апгрейди" },
  artifacts: { icon: "💎", label: "Артефакти" },
  skins: { icon: "🎭", label: "Скіни" },
  hc: { icon: "💰", label: "HC" },
};

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <nav className="bottom-nav">
      {(Object.keys(LABELS) as TabKey[]).map((k) => {
        const item = LABELS[k];
        const isActive = active === k;
        return (
          <button
            key={k}
            className={`bn-item ${isActive ? "active" : ""}`}
            onClick={() => onChange(k)}
          >
            <div className="bn-icon" aria-hidden>{item.icon}</div>
            <div className="bn-label">{item.label}</div>
          </button>
        );
      })}
    </nav>
  );
}
