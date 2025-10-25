import React, { useMemo, useState } from "react";

type Props = {
  onTap: () => void;
  tapStyle?: React.CSSProperties;

  currentEnergy: number;

  meteorVisible: boolean;
  onMeteorClick: () => void;
  meteorBuffLeft: number;
  meteorSpawnIn: number;

  meteorBonus?: number;
  meteorMultiplier?: number;

  // NEW: опційний колбек — додати бонус у баланс (mgp/MTP)
  onDailyBonusClaim?: (amount: number) => void;
};

/* ===== ЩОДЕННИЙ БОНУС ===== */
const DAILY_KEY = "mt_daily_v1";

type DailyState = {
  day: number;                // 1..30
  lastClaimLocalISO: string | null; // YYYY-MM-DD (локальна дата)
};

function two(n: number) { return String(n).padStart(2, "0"); }
function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}
function dateDiffDays(aISO: string, bISO: string): number {
  // різниця календарних днів у локальному часовому поясі
  const [ay, am, ad] = aISO.split("-").map(Number);
  const [by, bm, bd] = bISO.split("-").map(Number);
  const a = new Date(ay, (am || 1) - 1, ad || 1).setHours(0, 0, 0, 0);
  const b = new Date(by, (bm || 1) - 1, bd || 1).setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000);
}
function loadDaily(): DailyState {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyState;
      if (typeof parsed.day === "number") return parsed;
    }
  } catch {}
  return { day: 1, lastClaimLocalISO: null };
}
function saveDaily(s: DailyState) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(s)); } catch {}
}
function computeDay(state: DailyState, todayISO: string): { day: number; claimedToday: boolean } {
  if (!state.lastClaimLocalISO) return { day: 1, claimedToday: false };
  if (state.lastClaimLocalISO === todayISO) return { day: state.day, claimedToday: true };
  const diff = dateDiffDays(state.lastClaimLocalISO, todayISO);
  if (diff === 1) return { day: state.day >= 30 ? 1 : state.day + 1, claimedToday: false };
  // пропуск більше ніж на день → скидання
  return { day: 1, claimedToday: false };
}
function dailyReward(day: number): number {
  // День 1…29: 500 + 2264 × (день − 1); День 30: +160 (разом 66 316)
  return Math.floor(500 + 2264 * (day - 1) + (day === 30 ? 160 : 0));
}
/* ===== /ЩОДЕННИЙ БОНУС ===== */

export default function TapArea({
  onTap,
  currentEnergy,
  meteorVisible,
  onMeteorClick,
  meteorBuffLeft,
  meteorSpawnIn,
  meteorBonus = 0,
  meteorMultiplier = 10,
  onDailyBonusClaim,
}: Props) {
  const spawnIn = Math.max(0, Math.floor(meteorSpawnIn));
  const buffLeft = Math.max(0, Math.floor(meteorBuffLeft));

  // daily
  const [dailyState, setDailyState] = useState<DailyState>(() => loadDaily());
  const [dailyOpen, setDailyOpen] = useState(false);
  const todayISO = todayLocalISO();
  const dayInfo = useMemo(() => computeDay(dailyState, todayISO), [dailyState, todayISO]);
  const reward = useMemo(() => dailyReward(dayInfo.day), [dayInfo.day]);

  const claimDaily = () => {
    if (dayInfo.claimedToday) return;
    onDailyBonusClaim?.(reward); // прокинути у App
    const next: DailyState = { day: dayInfo.day, lastClaimLocalISO: todayISO };
    setDailyState(next);
    saveDaily(next);
    setDailyOpen(false);
  };

  return (
    <div
      className="tap-area"
      onContextMenu={(e) => e.preventDefault()} // блокуємо контекстне меню (long-press)
    >
      {/* HERO */}
      <div className="hero" style={{ position: "relative" }}>
        <h1 className="hero__title" style={{ pointerEvents: "none" }}>MAGIC TIME</h1>

        {/* Кругла FAB-кнопка з календарем */}
        <button
          type="button"
          aria-label="Щоденний бонус"
          onClick={() => setDailyOpen(true)}
          style={fabStyle}
        >
          {/* Іконка календаря */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* бейдж із номером дня */}
          <span style={fabBadgeStyle}>{dayInfo.day}</span>
        </button>

        {/* Годинник фіксованого розміру */}
        <div className="hero__clock">
          <img
            src="/hero-hourglass.png"
            alt=""
            aria-hidden="true"
            className="hero__img"
            decoding="async"
          />
          {/* клікабельна зона рівно по годиннику */}
          <button
            type="button"
            className="hero__tap"
            onClick={onTap}
            aria-label="Tap"
          />
        </div>
      </div>

      {/* MTP */}
      <section className="stat-card" aria-live="polite">
        <div className="stat-card__caption">MegicTimePoint</div>
        <div className="stat-card__value">{formatNumber(currentEnergy)}</div>
      </section>

      {/* Метеор */}
      <button
        type="button"
        className={`meteor-card${meteorVisible ? " meteor-card--active" : ""}`}
        onClick={meteorVisible ? onMeteorClick : undefined}
        aria-label="Золотий Метеорит"
      >
        <div className="meteor-card__icon">☄️</div>

        <div className="meteor-card__text">
          <div className="meteor-card__title">
            {meteorVisible ? "Написати, щоб зібрати" : `Метеор через ~${spawnIn}s`}
          </div>
          <div className="meteor-card__subtitle">
            Золотий Метеорит{meteorVisible && buffLeft > 0 ? ` • ${buffLeft}s` : ""}
          </div>
        </div>

        <div className="meteor-card__bonus">
          <span>{meteorVisible ? `+${formatNumber(meteorBonus)}` : "+0"}</span>
          <small>{`x${meteorMultiplier}`}</small>
        </div>
      </button>

      {/* Модалка ЩОДЕННОГО БОНУСУ */}
      {dailyOpen && (
        <div style={modalRootStyle} role="dialog" aria-modal="true">
          <div style={modalBackdropStyle} onClick={() => setDailyOpen(false)} />
          <div style={modalPanelStyle}>
            <div style={modalIconStyle}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={modalTitleStyle}>Щоденний бонус</h3>
            <div style={modalTextStyle}>День <b>{dayInfo.day}</b> із 30</div>
            <div style={{ ...modalTextStyle, fontSize: 18 }}>Нагорода: <b>{formatNumber(reward)}</b> mgp</div>

            <button
              type="button"
              onClick={claimDaily}
              disabled={dayInfo.claimedToday}
              style={{
                marginTop: 14, width: "100%", padding: "12px 16px",
                borderRadius: 12, border: 0, cursor: dayInfo.claimedToday ? "default" : "pointer",
                background: "linear-gradient(180deg,#53ffa6 0%,#15d3c0 100%)",
                color: "#041d17", fontWeight: 900, opacity: dayInfo.claimedToday ? 0.6 : 1
              }}
            >
              {dayInfo.claimedToday ? "Вже отримано сьогодні" : `Забрати +${formatNumber(reward)} mgp`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== styles (inline, щоб не чіпати App.css) ===== */
const fabStyle: React.CSSProperties = {
  position: "absolute", top: 10, right: 14,
  width: 52, height: 52, borderRadius: 9999,
  border: 0, cursor: "pointer",
  background: "radial-gradient(55% 55% at 50% 50%, rgba(46,255,204,.25), rgba(111,82,255,.18))",
  color: "#84ffe0", display: "grid", placeItems: "center",
  boxShadow: "0 2px 10px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.08)"
};
const fabBadgeStyle: React.CSSProperties = {
  position: "absolute", bottom: -2, right: -2,
  background: "#15d3c0", color: "#041d17", borderRadius: 10,
  fontWeight: 900, padding: "1px 6px", fontSize: 12, lineHeight: 1.4,
  boxShadow: "0 2px 6px rgba(0,0,0,.35)"
};

const modalRootStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 1200 };
const modalBackdropStyle: React.CSSProperties = {
  position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)"
};
const modalPanelStyle: React.CSSProperties = {
  position: "absolute", left: 16, right: 16, top: "18%", bottom: "auto",
  background: "rgba(22,28,40,.96)", border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 18, padding: "20px 16px", textAlign: "center", color: "#eaf8f7",
  boxShadow: "0 24px 64px rgba(0,0,0,.45), inset 0 0 0 1px rgba(0,0,0,.2)"
};
const modalIconStyle: React.CSSProperties = {
  width: 78, height: 78, margin: "-58px auto 8px", borderRadius: 9999,
  display: "grid", placeItems: "center", color: "#28E7A8",
  background: "radial-gradient(ellipse at center, rgba(10,240,220,.25), transparent 60%)"
};
const modalTitleStyle: React.CSSProperties = { margin: "0 0 8px", fontWeight: 900, fontSize: 20, letterSpacing: .3 };
const modalTextStyle: React.CSSProperties = { opacity: .9, marginBottom: 6 };

/* ===== утиліти ===== */
function formatNumber(n: number) {
  return Math.floor(n).toLocaleString("uk-UA");
}
