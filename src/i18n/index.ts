import React from "react";
import { LANGS, type LangCode } from "./languages";
import { STRINGS } from "./strings";

const LS_LANG_KEY = "mt_lang_v1";

function normalizeLang(x: any): LangCode {
  const s = String(x || "").toLowerCase();
  if (s in LANGS) return s as LangCode;
  return "en";
}

export function getInitialLang(): LangCode {
  try {
    const saved = localStorage.getItem(LS_LANG_KEY);
    if (saved) return normalizeLang(saved);
  } catch {}

  // fallback по мові браузера/телеграма
  const nav = (navigator as any)?.language || (navigator as any)?.languages?.[0] || "en";
  const base = String(nav).split("-")[0];
  return normalizeLang(base);
}

export function setLangLS(lang: LangCode) {
  try {
    localStorage.setItem(LS_LANG_KEY, lang);
  } catch {}
}

type I18nCtx = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
};

const Ctx = React.createContext<I18nCtx | null>(null);

export function I18nProvider(props: { children: React.ReactNode }) {
  const [lang, _setLang] = React.useState<LangCode>(() => getInitialLang());

  const setLang = React.useCallback((l: LangCode) => {
    _setLang(l);
    setLangLS(l);
  }, []);

  const t = React.useCallback(
    (key: string) => {
      const dict = STRINGS[lang] || STRINGS.en;
      return dict[key] ?? STRINGS.en[key] ?? key;
    },
    [lang]
  );

  const dir = (LANGS[lang]?.dir || "ltr") as "ltr" | "rtl";

  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{props.children}</Ctx.Provider>;
}

export function useI18n() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
