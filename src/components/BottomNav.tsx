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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2a2 2 0 0 1 2 2v8l1.5-1.2a2 2 0 0 1 3.2 1.6V18a4 4 0 0 1-4 4h-2.5A5.5 5.5 0 0 1 6 16.5V12a2 2 0 0 1 4 0V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    key: "upgrades",
    label: "Апгрейди",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3l4 7h-8l4-7zm0 18v-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    key: "artifacts",
    label: "Артефакти",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3l7 7-7 11L5 10l7-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    key: "skins",
    label: "Скіни",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 4h8l-1 6H9L8 4zm1 10h6l1 6H8l1-6z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    key: "hc",
    label: "HC",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3l8 4v6c0 4.418-3.582 8-8 8s-8-3.582-8-8V7l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.5 12h7M12 9v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    )
  }
];

export default function BottomNav({ active, onChange }: Props) {
  // Центруємо fixed-панель навіть у Telegram WebView
  const fixedCenterStyle: React.CSSProperties = {
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(560px, 100vw)"
  };

  return (
    <nav className="bottom-nav" style={fixedCenterStyle} role="navigation" aria-label="Головна навігація">
      {items.map(it => (
        <button
          key={it.key}
          className={`bn-item ${active === it.key ? "active" : ""}`}
          onClick={() => onChange(it.key)}
          aria-current={active === it.key ? "page" : undefined}
          aria-label={it.label}
        >
          <span className="bn-icon">{it.icon}</span>
          <span className="bn-label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
