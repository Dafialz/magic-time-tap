// src/components/LeadersPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { LBEntry } from "../services/leaderboard";
import { subscribeTopN } from "../services/leaderboard";

export type LeaderEntry = LBEntry;

type Props = {
  nickname?: string;
  currentScore?: number;
  entries?: LeaderEntry[];
};

const STORAGE_KEY = "mt_leaderboard_v1";
const CLOUD_TIMEOUT_MS = 1800;

/* ================= i18n (localStorage based) ================= */
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

function fmtByLang(n: number, lang: Lang) {
  const locale =
    lang === "ru"
      ? "ru-RU"
      : lang === "fr"
      ? "fr-FR"
      : lang === "es"
      ? "es-ES"
      : lang === "hi"
      ? "hi-IN"
      : lang === "zh"
      ? "zh-CN"
      : lang === "ar"
      ? "ar-SA"
      : "en-US";
  try {
    return Math.floor(n).toLocaleString(locale);
  } catch {
    return String(Math.floor(n));
  }
}

const I18N: Record<
  Lang,
  {
    title: string;
    top100: string;
    youOrName: (name?: string) => string;
    nowHave: string;
    place: string;

    subtitlePending: string;
    subtitleCloud: string;
    subtitleEntries: string;
    subtitleFallback: string;

    loading: string;
    noRecords: string;

    thPlayer: string;
    thScore: string;
    meTag: string;
  }
> = {
  en: {
    title: "Leaderboard",
    top100: "Top-100 by total coins (MTP).",
    youOrName: (n) => (n ? n : "You"),
    nowHave: "now have",
    place: "Rank",
    subtitlePending: "Loading leaderboard…",
    subtitleCloud: "Online leaderboard (cloud)",
    subtitleEntries: "Leaderboard (provided data)",
    subtitleFallback: "Demo / local mode",
    loading: "Loading…",
    noRecords: "No entries yet",
    thPlayer: "Player",
    thScore: "MTP",
    meTag: "(you)",
  },
  zh: {
    title: "排行榜",
    top100: "按总金币（MTP）排名前 100。",
    youOrName: (n) => (n ? n : "你"),
    nowHave: "当前拥有",
    place: "名次",
    subtitlePending: "正在加载排行榜…",
    subtitleCloud: "在线排行榜（云端）",
    subtitleEntries: "排行榜（传入数据）",
    subtitleFallback: "演示 / 本地模式",
    loading: "加载中…",
    noRecords: "暂无记录",
    thPlayer: "玩家",
    thScore: "MTP",
    meTag: "（你）",
  },
  hi: {
    title: "लीडरबोर्ड",
    top100: "कुल सिक्कों (MTP) के अनुसार टॉप-100।",
    youOrName: (n) => (n ? n : "आप"),
    nowHave: "के पास अभी",
    place: "रैंक",
    subtitlePending: "लीडरबोर्ड लोड हो रहा है…",
    subtitleCloud: "ऑनलाइन लीडरबोर्ड (क्लाउड)",
    subtitleEntries: "लीडरबोर्ड (प्रदान डेटा)",
    subtitleFallback: "डेमो / लोकल मोड",
    loading: "लोड हो रहा…",
    noRecords: "अभी कोई एंट्री नहीं",
    thPlayer: "खिलाड़ी",
    thScore: "MTP",
    meTag: "(आप)",
  },
  es: {
    title: "Clasificación",
    top100: "Top-100 por monedas totales (MTP).",
    youOrName: (n) => (n ? n : "Tú"),
    nowHave: "tienes ahora",
    place: "Puesto",
    subtitlePending: "Cargando ranking…",
    subtitleCloud: "Ranking online (nube)",
    subtitleEntries: "Ranking (datos proporcionados)",
    subtitleFallback: "Demo / modo local",
    loading: "Cargando…",
    noRecords: "Aún no hay registros",
    thPlayer: "Jugador",
    thScore: "MTP",
    meTag: "(tú)",
  },
  ar: {
    title: "لوحة الصدارة",
    top100: "أفضل 100 حسب إجمالي العملات (MTP).",
    youOrName: (n) => (n ? n : "أنت"),
    nowHave: "لديك الآن",
    place: "الترتيب",
    subtitlePending: "جاري تحميل لوحة الصدارة…",
    subtitleCloud: "لوحة صدارة أونلاين (سحابة)",
    subtitleEntries: "لوحة الصدارة (بيانات مُمرّرة)",
    subtitleFallback: "تجريبي / محلي",
    loading: "جاري التحميل…",
    noRecords: "لا توجد سجلات بعد",
    thPlayer: "اللاعب",
    thScore: "MTP",
    meTag: "(أنت)",
  },
  ru: {
    title: "Список лидеров",
    top100: "Топ-100 по общим монетам (MTP).",
    youOrName: (n) => (n ? n : "Вы"),
    nowHave: "сейчас имеете",
    place: "Место",
    subtitlePending: "Загрузка рейтинга…",
    subtitleCloud: "Онлайн рейтинг (облако)",
    subtitleEntries: "Рейтинг (переданные данные)",
    subtitleFallback: "Демо / локальный режим",
    loading: "Загрузка…",
    noRecords: "Пока что нет записей",
    thPlayer: "Игрок",
    thScore: "MTP",
    meTag: "(вы)",
  },
  fr: {
    title: "Classement",
    top100: "Top-100 par total de pièces (MTP).",
    youOrName: (n) => (n ? n : "Vous"),
    nowHave: "avez maintenant",
    place: "Rang",
    subtitlePending: "Chargement du classement…",
    subtitleCloud: "Classement en ligne (cloud)",
    subtitleEntries: "Classement (données fournies)",
    subtitleFallback: "Démo / mode local",
    loading: "Chargement…",
    noRecords: "Aucune entrée pour le moment",
    thPlayer: "Joueur",
    thScore: "MTP",
    meTag: "(vous)",
  },
};

/* ===== local ===== */

function loadLB(): LeaderEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as LeaderEntry[];
    if (Array.isArray(arr)) {
      return arr.filter((x) => x && typeof x.name === "string" && Number.isFinite((x as any).score));
    }
  } catch {}
  return [];
}

function saveLB(arr: LeaderEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

/* ===== demo ===== */

function seedDemo(): LeaderEntry[] {
  const list: LeaderEntry[] = [];
  for (let i = 1; i <= 100; i++) {
    list.push({
      name: `Hero ${String(i).padStart(3, "0")}`,
      score: Math.round(10_000_000 / i),
    } as any);
  }
  return list;
}

type CloudState = "entries" | "pending" | "active" | "fallback";

export default function LeadersPanel({ nickname, currentScore = 0, entries }: Props) {
  const [lang, setLang] = useState<Lang>(() => getLang());
  useEffect(() => {
    const onLang = (e: any) => {
      const next = String(e?.detail || "").trim() as Lang;
      setLang(LANGS.includes(next) ? next : getLang());
    };
    window.addEventListener("mt_lang", onLang as any);
    return () => window.removeEventListener("mt_lang", onLang as any);
  }, []);
  const t = useMemo(() => I18N[lang] ?? I18N.en, [lang]);

  const [lb, setLb] = useState<LeaderEntry[]>(() => {
    if (entries?.length) return entries;
    const local = loadLB();
    return local.length ? local : [];
  });

  const [cloudState, setCloudState] = useState<CloudState>(() => (entries?.length ? "entries" : "pending"));
  const usingCloud = cloudState === "active";

  /* ===== init ===== */
  useEffect(() => {
    if (entries?.length) {
      setLb(entries);
      setCloudState("entries");
      return;
    }

    setCloudState("pending");

    const local = loadLB();
    if (local.length) setLb(local);
    else setLb([]);

    const timer = window.setTimeout(() => {
      const curLocal = loadLB();
      if (curLocal.length) {
        setLb(curLocal);
      } else {
        const demo = seedDemo();
        setLb(demo);
        saveLB(demo);
      }
      setCloudState("fallback");
    }, CLOUD_TIMEOUT_MS);

    const unsub = subscribeTopN(100, (rows) => {
      window.clearTimeout(timer);
      setCloudState("active");
      setLb(Array.isArray(rows) ? rows : []);
    });

    return () => {
      window.clearTimeout(timer);
      unsub();
    };
  }, [entries]);

  /* ===== local update (тільки коли НЕ cloud і не entries) ===== */
  useEffect(() => {
    if (usingCloud) return;
    if (cloudState === "entries") return;
    if (!nickname || currentScore <= 0) return;

    setLb((prev) => {
      const without = prev.filter((e) => e.name !== nickname);
      const merged = [...without, { name: nickname, score: currentScore } as any];
      merged.sort((a, b) => (b as any).score - (a as any).score);
      const top100 = merged.slice(0, 100);
      saveLB(top100);
      return top100;
    });
  }, [nickname, currentScore, usingCloud, cloudState]);

  /* ===== computed ===== */
  const rows = useMemo(() => {
    return [...lb]
      .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 100)
      .map((e: any, i) => ({ rank: i + 1, ...e }));
  }, [lb]);

  const myRank = useMemo(() => rows.find((r) => r.name === nickname)?.rank ?? null, [rows, nickname]);

  const subtitle = useMemo(() => {
    if (cloudState === "pending") return t.subtitlePending;
    if (cloudState === "active") return t.subtitleCloud;
    if (cloudState === "entries") return t.subtitleEntries;
    return t.subtitleFallback;
  }, [cloudState, t]);

  /* ===== render ===== */
  return (
    <section className="leaders" aria-labelledby="leaders-title">
      <h2 id="leaders-title" style={{ textAlign: "center", margin: "12px 0 8px" }}>
        {t.title}
      </h2>

      <div style={{ textAlign: "center", opacity: 0.85, marginBottom: 10 }}>
        {t.top100} {nickname ? <b>{nickname}</b> : <b>{t.youOrName()}</b>} {t.nowHave}{" "}
        <b>{fmtByLang(currentScore, lang)} MTP</b>.
        {myRank && (
          <>
            {" "}
            {t.place}: <b>#{myRank}</b>.
          </>
        )}
        <div style={{ fontSize: 12, opacity: 0.7 }}>{subtitle}</div>
      </div>

      <div style={tableWrap}>
        {cloudState === "pending" && rows.length === 0 ? (
          <div style={loadingBox}>{t.loading}</div>
        ) : rows.length === 0 ? (
          <div style={loadingBox}>{t.noRecords}</div>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={{ width: 56, textAlign: "right", paddingRight: 8 }}>#</th>
                <th style={{ textAlign: "left" }}>{t.thPlayer}</th>
                <th style={{ textAlign: "right" }}>{t.thScore}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rank, name, score }: any) => {
                const isMe = nickname && name === nickname;
                const isTop1 = rank === 1;
                return (
                  <tr
                    key={`${name}-${rank}`}
                    style={{
                      background: isMe ? "rgba(40,231,168,.12)" : isTop1 ? "rgba(255,215,64,.10)" : "transparent",
                    }}
                  >
                    <td style={{ textAlign: "right", paddingRight: 8, fontWeight: isTop1 ? 900 : 600 }}>{rank}</td>
                    <td style={{ fontWeight: isMe ? 800 : 600 }}>
                      {name} {isTop1 ? " 👑" : isMe ? ` ${t.meTag}` : ""}
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtByLang(score, lang)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ===== styles ===== */

const tableWrap: React.CSSProperties = {
  margin: "8px 12px 16px",
  background: "rgba(25,30,40,.95)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 14,
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  minWidth: 380,
};

const loadingBox: React.CSSProperties = {
  padding: "18px 12px",
  textAlign: "center",
  opacity: 0.8,
};
