export const LANGS = {
  en: { label: "English", flag: "en.png", dir: "ltr" },
  zh: { label: "中文", flag: "zh.png", dir: "ltr" },
  hi: { label: "हिन्दी", flag: "hi.png", dir: "ltr" },
  es: { label: "Español", flag: "es.png", dir: "ltr" },
  ar: { label: "العربية", flag: "ar.png", dir: "rtl" },
  ru: { label: "Русский", flag: "ru.png", dir: "ltr" },
  fr: { label: "Français", flag: "fr.png", dir: "ltr" },
} as const;

export type LangCode = keyof typeof LANGS;
