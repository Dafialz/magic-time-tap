// src/components/HeaderBar.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";

type Props = {
  ce: number;
  hc: number;
  level: number;
  epochName: string;
  epochMult: number;
  clickPower: number;
  autoPerSec: number;
  effectiveFarmMult: number;
  meteorBuffLeft: number;
  meteorMult: number;
};

export default function HeaderBar(_: Props) {
  const { lang, setLang, langs, flagOf } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = useMemo(() => langs.find((l) => l.code === lang), [langs, lang]);

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target && el.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onDown as any);
      window.removeEventListener("touchstart", onDown as any);
    };
  }, []);

  return (
    <div ref={rootRef} style={{ position: "fixed", left: 14, top: 88, zIndex: 80 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={current?.label || "Language"}
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,.14)",
          background: "rgba(0,0,0,.25)",
          boxShadow: "0 10px 26px rgba(0,0,0,.25)",
          display: "grid",
          placeItems: "center",
          padding: 0,
          cursor: "pointer",
          touchAction: "manipulation",
        }}
      >
        <img
          src={flagOf(lang)}
          alt={current?.label || "Language"}
          style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover" }}
          draggable={false}
        />
      </button>

      {open ? (
        <div
          style={{
            marginTop: 10,
            width: 190,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(10,14,22,.92)",
            boxShadow: "0 18px 48px rgba(0,0,0,.35)",
            overflow: "hidden",
          }}
        >
          {langs.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "34px 1fr",
                gap: 10,
                alignItems: "center",
                padding: "10px 12px",
                background: l.code === lang ? "rgba(102,255,216,.10)" : "transparent",
                border: 0,
                color: "#fff",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 900,
              }}
            >
              <img
                src={l.flagSrc}
                alt={l.label}
                style={{ width: 26, height: 26, borderRadius: 999, objectFit: "cover" }}
                draggable={false}
              />
              <span style={{ opacity: 0.95 }}>{l.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
