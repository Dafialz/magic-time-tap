// src/components/TapArea.tsx
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  onTap: () => void;
  currentEnergy: number;

  meteorVisible: boolean;
  onMeteorClick?: () => void;
  meteorBuffLeft: number;
  meteorSpawnIn: number;
  meteorBonus: number;
  meteorMultiplier: number;

  // Daily bonus (щоденні)
  onDailyBonusClaim?: (amount: number) => void;

  // лідери
  onOpenLeaders?: () => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function formatNumber(n: number) {
  try {
    if (!Number.isFinite(n)) return "0";
    return Math.floor(n).toLocaleString("en-US");
  } catch {
    return String(Math.floor(n));
  }
}

/* ===== i18n (localStorage based) ===== */
type Lang = "en" | "zh" | "hi" | "es" | "ar" | "ru" | "fr";
const LS_LANG_KEY = "mt_lang_v1";

const LANGS: Lang[] = ["en", "zh", "hi", "es", "ar", "ru", "fr"];

function getLang(): Lang {
  try {
    const v = (localStorage.getItem(LS_LANG_KEY) || "").trim() as Lang;
    return LANGS.includes(v) ? v : "en";
  } catch {
    return "en";
  }
}

function applyLangToDom(lang: Lang) {
  try {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  } catch {}
}

function setLang(lang: Lang) {
  try {
    localStorage.setItem(LS_LANG_KEY, lang);
  } catch {}
  applyLangToDom(lang);
  try {
    window.dispatchEvent(new CustomEvent("mt_lang", { detail: lang }));
  } catch {}
}

/** прапори лежать у src/assets/flags/*.png (Vite) */
const FLAG_FILE: Record<Lang, string> = {
  en: "en.png",
  zh: "cn.png",
  hi: "in.png",
  es: "es.png",
  ar: "sa.png",
  ru: "ru.png",
  fr: "fr.png",
};

function flagSrc(code: Lang) {
  return new URL(`../assets/flags/${FLAG_FILE[code]}`, import.meta.url).toString();
}

const I18N: Record<
  Lang,
  {
    mtpCaption: string;
    meteorAria: string;
    meteorCollect: string;
    meteorIn: (s: number) => string;
    goldenMeteor: string;
    daily: string;
    dayOf: (d: number) => string;
    reward: string;
    claimedToday: string;
    claim: (amt: number) => string;
    openLeaders: string;
    missions: string;
  }
> = {
  en: {
    mtpCaption: "MGP",
    meteorAria: "Golden Meteor",
    meteorCollect: "Tap to collect",
    meteorIn: (s) => `Meteor in ~${s}s`,
    goldenMeteor: "Golden Meteor",
    daily: "Daily bonus",
    dayOf: (d) => `Day ${d} of 30`,
    reward: "Reward",
    claimedToday: "Already claimed today",
    claim: (amt) => `Claim +${formatNumber(amt)} MGP`,
    openLeaders: "Leaders",
    missions: "Daily",
  },
  zh: {
    mtpCaption: "MGP",
    meteorAria: "金色流星",
    meteorCollect: "点击领取",
    meteorIn: (s) => `流星还有 ~${s}秒`,
    goldenMeteor: "金色流星",
    daily: "每日奖励",
    dayOf: (d) => `第 ${d} 天 / 30`,
    reward: "奖励",
    claimedToday: "今天已领取",
    claim: (amt) => `领取 +${formatNumber(amt)} MGP`,
    openLeaders: "排行榜",
    missions: "每日",
  },
  hi: {
    mtpCaption: "MGP",
    meteorAria: "गोल्डन उल्का",
    meteorCollect: "इकट्ठा करने के लिए टैप करें",
    meteorIn: (s) => `उल्का ~${s}s में`,
    goldenMeteor: "गोल्डन उल्का",
    daily: "दैनिक बोनस",
    dayOf: (d) => `दिन ${d} / 30`,
    reward: "इनाम",
    claimedToday: "आज पहले ही लिया",
    claim: (amt) => `लें +${formatNumber(amt)} MGP`,
    openLeaders: "लीडर्स",
    missions: "दैनिक",
  },
  es: {
    mtpCaption: "MGP",
    meteorAria: "Meteorito Dorado",
    meteorCollect: "Toca para recoger",
    meteorIn: (s) => `Meteorito en ~${s}s`,
    goldenMeteor: "Meteorito Dorado",
    daily: "Bono diario",
    dayOf: (d) => `Día ${d} de 30`,
    reward: "Recompensa",
    claimedToday: "Ya reclamado hoy",
    claim: (amt) => `Reclamar +${formatNumber(amt)} MGP`,
    openLeaders: "Líderes",
    missions: "Diario",
  },
  ar: {
    mtpCaption: "MGP",
    meteorAria: "نيزك ذهبي",
    meteorCollect: "اضغط للتحصيل",
    meteorIn: (s) => `النيزك خلال ~${s}ث`,
    goldenMeteor: "نيزك ذهبي",
    daily: "مكافأة يومية",
    dayOf: (d) => `اليوم ${d} من 30`,
    reward: "المكافأة",
    claimedToday: "تم التحصيل اليوم",
    claim: (amt) => `تحصيل +${formatNumber(amt)} MGP`,
    openLeaders: "المتصدرون",
    missions: "يومي",
  },
  ru: {
    mtpCaption: "MGP",
    meteorAria: "Золотой метеорит",
    meteorCollect: "Нажми, чтобы собрать",
    meteorIn: (s) => `Метеор через ~${s}s`,
    goldenMeteor: "Золотой метеорит",
    daily: "Ежедневный бонус",
    dayOf: (d) => `День ${d} из 30`,
    reward: "Награда",
    claimedToday: "Уже получено сегодня",
    claim: (amt) => `Забрать +${formatNumber(amt)} MGP`,
    openLeaders: "Лидеры",
    missions: "Ежедневно",
  },
  fr: {
    mtpCaption: "MGP",
    meteorAria: "Météore Dorée",
    meteorCollect: "Appuie pour récupérer",
    meteorIn: (s) => `Météore dans ~${s}s`,
    goldenMeteor: "Météore Dorée",
    daily: "Bonus quotidien",
    dayOf: (d) => `Jour ${d} sur 30`,
    reward: "Récompense",
    claimedToday: "Déjà récupéré aujourd’hui",
    claim: (amt) => `Récupérer +${formatNumber(amt)} MGP`,
    openLeaders: "Classement",
    missions: "Quotidien",
  },
};

/** Daily bonus: 30-денний календар, один клейм на добу */
const LS_DAILY_KEY = "mt_daily_v1";
type DailyState = {
  startedAtDay: number;
  lastClaimDay: number;
  streakDay: number;
};
function getEpochDay(ts = Date.now()) {
  return Math.floor(ts / 86400000);
}
function loadDaily(): DailyState {
  try {
    const raw = localStorage.getItem(LS_DAILY_KEY);
    if (!raw) {
      const d = getEpochDay();
      const init: DailyState = { startedAtDay: d, lastClaimDay: -1, streakDay: 1 };
      localStorage.setItem(LS_DAILY_KEY, JSON.stringify(init));
      return init;
    }
    const j = JSON.parse(raw);
    return {
      startedAtDay: Number(j.startedAtDay ?? getEpochDay()),
      lastClaimDay: Number(j.lastClaimDay ?? -1),
      streakDay: clamp(Number(j.streakDay ?? 1), 1, 30),
    };
  } catch {
    const d = getEpochDay();
    return { startedAtDay: d, lastClaimDay: -1, streakDay: 1 };
  }
}
function saveDaily(s: DailyState) {
  try {
    localStorage.setItem(LS_DAILY_KEY, JSON.stringify(s));
  } catch {}
}
function dailyRewardForDay(day: number) {
  const base = 1000;
  const step = 1000;
  return base + (clamp(day, 1, 30) - 1) * step;
}

export default function TapArea({
  onTap,
  currentEnergy,

  meteorVisible,
  onMeteorClick,
  meteorBuffLeft,
  meteorSpawnIn,
  meteorBonus,
  meteorMultiplier,

  onDailyBonusClaim,
  onOpenLeaders,
}: Props) {
  const [dailyOpen, setDailyOpen] = useState(false);
  const [dayInfo, setDayInfo] = useState(() => loadDaily());

  const [lang, setLangState] = useState<Lang>(() => {
    const l = getLang();
    applyLangToDom(l);
    return l;
  });

  useEffect(() => {
    const onLang = (e: any) => {
      const next = String(e?.detail || "").trim() as Lang;
      const real = LANGS.includes(next) ? next : getLang();
      setLangState(real);
      applyLangToDom(real);
    };
    window.addEventListener("mt_lang", onLang as any);
    return () => window.removeEventListener("mt_lang", onLang as any);
  }, []);

  const t = useMemo(() => I18N[lang] ?? I18N.en, [lang]);

  const buffLeft = Math.max(0, Math.floor(meteorBuffLeft || 0));
  const reward = useMemo(() => dailyRewardForDay(dayInfo.streakDay), [dayInfo.streakDay]);

  useEffect(() => {
    const fresh = loadDaily();
    setDayInfo(fresh);
  }, []);

  const openDaily = () => {
    setDayInfo(loadDaily());
    setDailyOpen(true);
  };

  const claimDaily = () => {
    const today = getEpochDay();
    const s = loadDaily();

    if (s.lastClaimDay === today) return;

    if (s.lastClaimDay !== -1 && today - s.lastClaimDay > 1) {
      s.streakDay = 1;
    } else if (s.lastClaimDay !== -1) {
      s.streakDay = clamp(s.streakDay + 1, 1, 30);
    }

    s.lastClaimDay = today;
    saveDaily(s);
    setDayInfo(s);

    onDailyBonusClaim?.(dailyRewardForDay(s.streakDay));
    setTimeout(() => setDailyOpen(false), 150);
  };

  // ✅ кнопка мови без меню: натиснув → мова змінилась
  const cycleLang = () => {
    const idx = LANGS.indexOf(lang);
    const next = LANGS[(idx >= 0 ? idx + 1 : 0) % LANGS.length];
    setLang(next);
    setLangState(next);
  };

  const openSupport = () => {
    const url = "https://t.me/MagicTime_support";
    const tg = (window as any)?.Telegram?.WebApp;
    try {
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(url);
        return;
      }
    } catch {}
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // last resort
      (window.location as any).href = url;
    }
  };

  return (
    <div className="tap-area" style={{ position: "relative" }}>
      {/* HERO */}
      <section className="hero">
        <div className="hero__title">MAGIC TIME</div>

        <div className="hero__clock">
          <img className="hero__img" src="/hero-hourglass.png" alt="Magic Time" draggable={false} />
          <button type="button" className="hero__tap" onClick={onTap} aria-label="Tap" />
        </div>
      </section>

      {/* Нижній блок: actions row + MGP + Meteor */}
      <div className="tap-bottom">
        {/* ✅ Ряд кнопок як на скріні: прапор зліва, 2 кнопки по центру, підтримка справа */}
        <div style={actionsBarStyle} aria-label="Quick actions">
          <button
            type="button"
            onClick={cycleLang}
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => e.preventDefault()}
            aria-label="Language"
            title="Language"
            style={langFabInlineStyle}
          >
            <img
              src={flagSrc(lang)}
              alt={lang}
              style={{ width: 52, height: 52, borderRadius: 9999, display: "block" }}
              draggable={false}
            />
          </button>

          <div style={centerActionsStyle}>
            <button
              type="button"
              onClick={openDaily}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
              style={actionFabStyle}
              aria-label={t.daily}
              title={t.daily}
            >
              📅
              {dayInfo.lastClaimDay !== getEpochDay() ? <span style={fabBadgeStyle}>1</span> : null}
            </button>

            <button
              type="button"
              onClick={onOpenLeaders}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
              style={actionFabStyle}
              aria-label={t.openLeaders}
              title={t.openLeaders}
            >
              🏆
            </button>
          </div>

          <button
            type="button"
            onClick={openSupport}
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => e.preventDefault()}
            style={supportFabStyle}
            aria-label="Support"
            title="Support"
          >
            💬
          </button>
        </div>

        <section className="stat-card" aria-live="polite">
          <div className="stat-card__caption">{t.mtpCaption}</div>
          <div className="stat-card__value">{formatNumber(currentEnergy)}</div>
        </section>

        <button
          type="button"
          className={`meteor-card${meteorVisible ? " meteor-card--active" : ""}`}
          onClick={meteorVisible ? onMeteorClick : undefined}
          aria-label={t.meteorAria}
        >
          <div className="meteor-card__icon">☄️</div>

          <div className="meteor-card__text">
            <div className="meteor-card__title">
              {meteorVisible ? t.meteorCollect : t.meteorIn(Math.max(0, Math.floor(meteorSpawnIn)))}
            </div>
            <div className="meteor-card__subtitle">
              {t.goldenMeteor}
              {meteorVisible && buffLeft > 0 ? ` • ${buffLeft}s` : ""}
            </div>
          </div>

          <div className="meteor-card__bonus">
            <span>{meteorVisible ? `+${formatNumber(meteorBonus)}` : "+0"}</span>
            <small>{`x${meteorMultiplier}`}</small>
          </div>
        </button>
      </div>

      {/* Модалка ЩОДЕННОГО БОНУСУ */}
      {dailyOpen && (
        <div style={modalRootStyle} role="dialog" aria-modal="true">
          <div style={modalBackdropStyle} onClick={() => setDailyOpen(false)} />
          <div style={modalPanelStyle}>
            <div style={modalIconStyle}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3 style={modalTitleStyle}>{t.daily}</h3>
            <div style={modalTextStyle}>{t.dayOf(dayInfo.streakDay)}</div>
            <div style={{ ...modalTextStyle, fontSize: 18 }}>
              {t.reward}: <b>{formatNumber(reward)}</b> MGP
            </div>

            <button
              type="button"
              onClick={claimDaily}
              disabled={dayInfo.lastClaimDay === getEpochDay()}
              style={{
                marginTop: 14,
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: 0,
                cursor: dayInfo.lastClaimDay === getEpochDay() ? "default" : "pointer",
                background: "linear-gradient(180deg,#53ffa6 0%,#15d3c0 100%)",
                color: "#041d17",
                fontWeight: 900,
                opacity: dayInfo.lastClaimDay === getEpochDay() ? 0.6 : 1,
              }}
            >
              {dayInfo.lastClaimDay === getEpochDay() ? t.claimedToday : t.claim(reward)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== styles (inline) ===== */

const baseFab: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 9999,
  border: 0,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  position: "relative",
  outline: "none",
  WebkitTapHighlightColor: "transparent" as any,
  boxShadow: "0 2px 10px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.08)",
};

const actionsBarStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  margin: "0 auto 10px",
  padding: "0 6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const centerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  flex: "1 1 auto",
};

const langFabInlineStyle: React.CSSProperties = {
  ...baseFab,
  background: "transparent",
  padding: 0,
  overflow: "hidden",
};

const actionFabStyle: React.CSSProperties = {
  ...baseFab,
  background: "radial-gradient(55% 55% at 50% 50%, rgba(46,255,204,.25), rgba(111,82,255,.18))",
  color: "#84ffe0",
};

const supportFabStyle: React.CSSProperties = {
  ...baseFab,
  background: "radial-gradient(55% 55% at 50% 50%, rgba(46,255,204,.18), rgba(111,82,255,.22))",
  color: "#84ffe0",
};

const fabBadgeStyle: React.CSSProperties = {
  position: "absolute",
  bottom: -2,
  right: -2,
  background: "#15d3c0",
  color: "#041d17",
  borderRadius: 10,
  fontWeight: 900,
  padding: "1px 6px",
  fontSize: 12,
  lineHeight: 1.4,
  boxShadow: "0 2px 6px rgba(0,0,0,.35)",
};

const modalRootStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 1200 };
const modalBackdropStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,.55)",
  backdropFilter: "blur(2px)",
};
const modalPanelStyle: React.CSSProperties = {
  position: "absolute",
  left: 16,
  right: 16,
  top: "18%",
  bottom: "auto",
  background: "rgba(22,28,40,.96)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 18,
  padding: "20px 16px",
  textAlign: "center",
  color: "#eaf8f7",
  boxShadow: "0 24px 64px rgba(0,0,0,.45), inset 0 0 0 1px rgba(0,0,0,.2)",
};
const modalIconStyle: React.CSSProperties = {
  width: 78,
  height: 78,
  margin: "-58px auto 8px",
  borderRadius: 9999,
  display: "grid",
  placeItems: "center",
  color: "#28E7A8",
  background: "radial-gradient(ellipse at center, rgba(10,240,220,.25), transparent 60%)",
};
const modalTitleStyle: React.CSSProperties = { margin: "8px 0 6px", fontSize: 20, fontWeight: 900 };
const modalTextStyle: React.CSSProperties = { opacity: 0.92, fontSize: 14, lineHeight: 1.5 };
