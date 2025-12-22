// src/components/LanguageFab.tsx
import React from "react";
import { LANGS, type LangCode } from "../i18n/languages";
import { useI18n } from "../i18n";

function flagSrc(code: LangCode) {
  // Vite: імпорт через new URL
  return new URL(`../assets/flags/${LANGS[code].flag}`, import.meta.url).toString();
}

export default function LanguageFab() {
  // ✅ FIX: у твоєму I18nCtx немає поля dir, тому беремо dir напряму з LANGS
  const { lang, setLang } = useI18n();
  const dir = (LANGS[lang]?.dir || "ltr") as "ltr" | "rtl";

  const [open, setOpen] = React.useState(false);

  // закриття по кліку поза меню
  React.useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest?.("[data-langfab]")) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown as any);
  }, []);

  const codes = Object.keys(LANGS) as LangCode[];

  return (
    <div data-langfab style={{ position: "fixed", top: 86, left: 14, zIndex: 9999, direction: dir }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={LANGS[lang].label}
        style={{
          width: 54,
          height: 54,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,.14)",
          background: "rgba(0,0,0,.22)",
          boxShadow: "0 10px 25px rgba(0,0,0,.28)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <img
          src={flagSrc(lang)}
          alt={LANGS[lang].label}
          draggable={false}
          style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }}
        />
      </button>

      {open ? (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 16,
            background: "rgba(20,25,35,.96)",
            border: "1px solid rgba(255,255,255,.12)",
            width: 220,
            boxShadow: "0 18px 50px rgba(0,0,0,.35)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {codes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setLang(c);
                  setOpen(false);
                }}
                title={LANGS[c].label}
                style={{
                  border: c === lang ? "2px solid rgba(83,255,166,.55)" : "1px solid rgba(255,255,255,.12)",
                  background: "rgba(255,255,255,.06)",
                  borderRadius: 14,
                  padding: 8,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <img
                  src={flagSrc(c)}
                  alt={LANGS[c].label}
                  draggable={false}
                  style={{ width: 34, height: 34, borderRadius: 999, objectFit: "cover" }}
                />
                <div style={{ marginTop: 6, fontSize: 10, opacity: 0.9, fontWeight: 900 }}>
                  {LANGS[c].label}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
