import React from "react";

export type TabKey = "tap" | "upgrades" | "artifacts" | "skins" | "hc";

type Item = { label: string; icon: React.ReactNode; key: TabKey };

const Grad = () => (
  <defs>
    <linearGradient id="mtpGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#28E7A8" />
      <stop offset="100%" stopColor="#6F52FF" />
    </linearGradient>
  </defs>
);

const IconWrap = ({ children }: { children: React.ReactNode }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
    <Grad />
    {children}
  </svg>
);

// 🕹️ Tap (hand)
const IHand = () => (
  <IconWrap>
    <path
      d="M7 11v2.5c0 1.933 1.567 3.5 3.5 3.5h4A2.5 2.5 0 0 0 17 14.5V12a1 1 0 1 0-2 0v1M7 11l.5-2.5A1.5 1.5 0 0 1 9 7h0a1.5 1.5 0 0 1 1.5 1.5V11M10.5 7V6a1.5 1.5 0 0 1 3 0v5M13.5 6V5a1.5 1.5 0 0 1 3 0v6"
      fill="none"
      stroke="url(#mtpGrad)"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconWrap>
);

// ⚙️ Upgrades (gear)
const IGear = () => (
  <IconWrap>
    <circle cx="12" cy="12" r="3" fill="none" stroke="url(#mtpGrad)" strokeWidth="1.7" />
    <path
      d="M19 12a7 7 0 0 0-.14-1.4l1.7-1.24-1.8-3.12-1.98.7A7 7 0 0 0 14.4 5L14 3h-4l-.4 2a7 7 0 0 0-2.38 1.94l-1.98-.7-1.8 3.12 1.7 1.24A7 7 0 0 0 5 12c0 .47.05.93.14 1.37l-1.7 1.25 1.8 3.12 1.98-.7A7 7 0 0 0 9.6 19l.4 2h4l.4-2a7 7 0 0 0 2.38-1.96l1.98.7 1.8-3.12-1.7-1.25c.09-.44.14-.9.14-1.37Z"
      fill="none"
      stroke="url(#mtpGrad)"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconWrap>
);

// 💎 Artifacts (crystal)
const ICrystal = () => (
  <IconWrap>
    <path
      d="M12 2l4 5-4 15-4-15 4-5Zm0 0l6 7-6 13-6-13 6-7Z"
      fill="none"
      stroke="url(#mtpGrad)"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </IconWrap>
);

// 🎭 Skins (mask/trophy hybrid)
const IMask = () => (
  <IconWrap>
    <path
      d="M4 5h16v4a8 8 0 0 1-16 0V5Zm3 4a2 2 0 0 0 4 0M13 9a2 2 0 0 0 4 0M9 17v2h6v-2"
      fill="none"
      stroke="url(#mtpGrad)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconWrap>
);

// 💰 HC (hex + spark)
const IHC = () => (
  <IconWrap>
    <path
      d="M12 3 5 7v10l7 4 7-4V7l-7-4Z"
      fill="none"
      stroke="url(#mtpGrad)"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M9 12h6M9 9h6M9 15h6" stroke="url(#mtpGrad)" strokeWidth="1.4" strokeLinecap="round" />
  </IconWrap>
);

const ITEMS: Item[] = [
  { key: "tap", label: "Тапати", icon: <IHand /> },
  { key: "upgrades", label: "Апгрейди", icon: <IGear /> },
  { key: "artifacts", label: "Артефакти", icon: <ICrystal /> },
  { key: "skins", label: "Скіни", icon: <IMask /> },
  { key: "hc", label: "HC", icon: <IHC /> },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ key, label, icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            className={`bn-item ${isActive ? "active" : ""}`}
            onClick={() => onChange(key)}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
          >
            <span className="bn-icon">{icon}</span>
            <span className="bn-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
