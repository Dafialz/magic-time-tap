// src/i18n.tsx
import React, { createContext, useContext, useMemo, useState } from "react";

export type Lang = "en" | "zh" | "hi" | "es" | "ar" | "ru" | "fr";

const LS_LANG_KEY = "mt_lang_v1";

const LANGS: { code: Lang; label: string; flagSrc: string }[] = [
  { code: "en", label: "English", flagSrc: "/flags/en.png" },
  { code: "zh", label: "中文", flagSrc: "/flags/cn.png" },
  { code: "hi", label: "हिन्दी", flagSrc: "/flags/in.png" },
  { code: "es", label: "Español", flagSrc: "/flags/es.png" },
  { code: "ar", label: "العربية", flagSrc: "/flags/sa.png" },
  { code: "ru", label: "Русский", flagSrc: "/flags/ru.png" },
  { code: "fr", label: "Français", flagSrc: "/flags/fr.png" },
];

type Dict = Record<string, Partial<Record<Lang, string>>>;

const dict: Dict = {
  // мінімум для старту (потім розширимо на всі екрани)
  "nav.tap": { en: "Tap", zh: "点击", hi: "टैप", es: "Tocar", ar: "نقر", ru: "Тап", fr: "Tap" },
  "nav.friends": { en: "Friends", zh: "好友", hi: "दोस्त", es: "Amigos", ar: "الأصدقاء", ru: "Друзья", fr: "Amis" },
  "nav.artifacts": { en: "Artifacts", zh: "神器", hi: "आर्टिफैक्ट", es: "Artefactos", ar: "القطع", ru: "Артефакты", fr: "Artefacts" },
  "nav.craft": { en: "Craft", zh: "合成", hi: "क्राफ्ट", es: "Craftear", ar: "تصنيع", ru: "Крафт", fr: "Craft" },
  "nav.chests": { en: "Chests", zh: "宝箱", hi: "संदूक", es: "Cofres", ar: "الصناديق", ru: "Сундуки", fr: "Coffres" },

  "loading": { en: "Connecting...", zh: "连接中...", hi: "कनेक्ट हो रहा है...", es: "Conectando...", ar: "جارٍ الاتصال...", ru: "Подключение...", fr: "Connexion..." },
  "banned.title": { en: "⛔ You are banned", zh: "⛔ 你已被封禁", hi: "⛔ आप प्रतिबंधित हैं", es: "⛔ Estás bloqueado", ar: "⛔ تم حظرك", ru: "⛔ Вы заблокированы", fr: "⛔ Vous êtes banni" },
  "banned.reason": { en: "Reason:", zh: "原因：", hi: "कारण:", es: "Motivo:", ar: "السبب:", ru: "Причина:", fr: "Raison:" },
};

function safeReadLang(): Lang {
  try {
    const raw = localStorage.getItem(LS_LANG_KEY);
    if (!raw) return "en";
    const ok = LANGS.some((l) => l.code === raw);
    return (ok ? raw : "en") as Lang;
  } catch {
    return "en";
  }
}

function safeSaveLang(lang: Lang) {
  try {
    localStorage.setItem(LS_LANG_KEY, lang);
  } catch {}
}

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  langs: typeof LANGS;
  flagOf: (l: Lang) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => safeReadLang());

  const setLang = (l: Lang) => {
    setLangState(l);
    safeSaveLang(l);
  };

  const value = useMemo<I18nCtx>(() => {
    const t = (key: string) => {
      const row = dict[key];
      return row?.[lang] || row?.en || key;
    };
    const flagOf = (l: Lang) => LANGS.find((x) => x.code === l)?.flagSrc || "/flags/en.png";
    return { lang, setLang, t, langs: LANGS, flagOf };
  }, [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
