// src/components/CraftPanel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildCraftItems } from "../systems/economy";
import { iconByLevel } from "../systems/shop_icons";

/**
 * CraftPanel (20 слотів):
 * - ❌ КЛІК-логіка (купити/апґрейд) ВИДАЛЕНА
 * - Drag & Drop:
 *    • на порожній → перемістити
 *    • на такий самий рівень → злиття L + L = L+1
 *    • на $ → продаж за 70% від ЦІНИ поточного рівня
 */

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

function nfmt(n: number, lang: Lang, maxFrac = 2) {
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
    return n.toLocaleString(locale, { maximumFractionDigits: maxFrac });
  } catch {
    return String(n);
  }
}

const I18N: Record<
  Lang,
  {
    title: string;
    descA: string;
    descMove: string;
    descMerge: string;
    descSell: string;
    balance: string;
    income: string;
    perHour: string;
    sellHint: string;
    emptySlot: string;
    freeSlotsNone: string;
  }
> = {
  en: {
    title: "Artifact Craft",
    descA: "20 slots.",
    descMove: "to empty — move;",
    descMerge: "to same level — merge L+L = L+1;",
    descSell: "to $ — sell (70% of level price).",
    balance: "Balance",
    income: "Income",
    perHour: "MGP/hour",
    sellHint: "Drag item here to sell for 70% of the level price",
    emptySlot: "Empty slot",
    freeSlotsNone: "No free slots in craft",
  },
  zh: {
    title: "神器合成",
    descA: "20 个槽位。",
    descMove: "拖到空位 — 移动；",
    descMerge: "拖到同等级 — 合并 L+L = L+1；",
    descSell: "拖到 $ — 出售（等级价格的 70%）。",
    balance: "余额",
    income: "收益",
    perHour: "MGP/小时",
    sellHint: "把物品拖到这里以 70% 价格出售",
    emptySlot: "空槽位",
    freeSlotsNone: "没有空的合成槽位",
  },
  hi: {
    title: "आर्टिफैक्ट क्राफ्ट",
    descA: "20 स्लॉट।",
    descMove: "खाली पर — मूव;",
    descMerge: "एक ही लेवल पर — मर्ज L+L = L+1;",
    descSell: "$ पर — बेचें (लेवल कीमत का 70%).",
    balance: "बैलेंस",
    income: "आय",
    perHour: "MGP/घंटा",
    sellHint: "70% कीमत पर बेचने के लिए यहाँ ड्रैग करें",
    emptySlot: "खाली स्लॉट",
    freeSlotsNone: "क्राफ्ट में खाली स्लॉट नहीं है",
  },
  es: {
    title: "Craft de artefactos",
    descA: "20 espacios.",
    descMove: "a vacío — mover;",
    descMerge: "al mismo nivel — fusionar L+L = L+1;",
    descSell: "a $ — vender (70% del precio).",
    balance: "Saldo",
    income: "Ingreso",
    perHour: "MGP/h",
    sellHint: "Arrastra aquí para vender por el 70% del precio del nivel",
    emptySlot: "Espacio vacío",
    freeSlotsNone: "No hay espacios libres",
  },
  ar: {
    title: "صنع القطع الأثرية",
    descA: "20 خانة.",
    descMove: "إلى خانة فارغة — نقل؛",
    descMerge: "إلى نفس المستوى — دمج L+L = L+1؛",
    descSell: "إلى $ — بيع (70% من السعر).",
    balance: "الرصيد",
    income: "الدخل",
    perHour: "MGP/ساعة",
    sellHint: "اسحب العنصر هنا للبيع مقابل 70% من سعر المستوى",
    emptySlot: "خانة فارغة",
    freeSlotsNone: "لا توجد خانات فارغة",
  },
  ru: {
    title: "Крафт артефактов",
    descA: "20 слотов.",
    descMove: "на пустой — переместить;",
    descMerge: "на такой же уровень — слияние L+L = L+1;",
    descSell: "на $ — продать (70% цены уровня).",
    balance: "Баланс",
    income: "Доход",
    perHour: "MGP/час",
    sellHint: "Перетащи сюда предмет, чтобы продать за 70% цены уровня",
    emptySlot: "Пустой слот",
    freeSlotsNone: "Нет свободных слотов в крафте",
  },
  fr: {
    title: "Craft d’artefacts",
    descA: "20 emplacements.",
    descMove: "sur vide — déplacer;",
    descMerge: "même niveau — fusion L+L = L+1;",
    descSell: "sur $ — vendre (70% du prix).",
    balance: "Solde",
    income: "Revenu",
    perHour: "MGP/h",
    sellHint: "Glisse ici pour vendre à 70% du prix du niveau",
    emptySlot: "Emplacement vide",
    freeSlotsNone: "Aucun emplacement libre",
  },
};

type CraftItem = {
  level: number;
  name: string;
  price_mgp: number;
  income_per_hour_mgp: number;
  roi_days: number;
};

type Props = {
  mgp: number;
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  slots: number[]; // 20 елементів (0..50)
  setSlots: React.Dispatch<React.SetStateAction<number[]>>;
  items?: CraftItem[];
};

const SLOTS_COUNT = 20;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

type DragState = {
  active: boolean;
  srcIdx: number;
  level: number;
  x: number;
  y: number;
  pointerId: number;
  overIdx: number | null;
  overDollar: boolean;
  started: boolean; // щоб відрізнити tap від drag
};

export default function CraftPanel({ mgp, setMgp, slots, setSlots, items }: Props) {
  const defs = useMemo(() => items ?? buildCraftItems(), [items]);

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

  const rootRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);

  const [drag, setDrag] = useState<DragState>({
    active: false,
    srcIdx: -1,
    level: 0,
    x: 0,
    y: 0,
    pointerId: -1,
    overIdx: null,
    overDollar: false,
    started: false,
  });

  // щоб блокувати click після перетягування (і ghost click на iOS)
  const suppressClickRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  // ✅ актуальний флаг drag для pointermove (без багів через closures)
  const dragActiveRef = useRef(false);
  useEffect(() => {
    dragActiveRef.current = drag.active;
  }, [drag.active]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const defOf = (lvl: number | undefined) => (typeof lvl === "number" && lvl >= 1 && lvl <= 50 ? defs[lvl - 1] : undefined);

  // 70% від ціни поточного рівня (універсально для L1..L50)
  const sellValueForLevel = (lvl: number) => {
    const d = defOf(lvl);
    return d ? d.price_mgp * 0.7 : 0;
  };

  // ==== drop-правила
  const canDropInfo = (targetIdx: number, srcLevel: number) => {
    const dstLevel = slots[targetIdx] || 0;
    if (dstLevel === 0) return { ok: true, reason: "move" as const };
    if (dstLevel === srcLevel && dstLevel < 50) return { ok: true, reason: "merge" as const };
    return { ok: false, reason: "blocked" as const };
  };

  // ==== знайти, над чим зараз курсор/палець
  function pickDropTarget(clientX: number, clientY: number): { overIdx: number | null; overDollar: boolean } {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return { overIdx: null, overDollar: false };

    const dollar = el.closest?.('[data-drop="dollar"]') as HTMLElement | null;
    if (dollar) return { overIdx: null, overDollar: true };

    const cell = el.closest?.("[data-slot-index]") as HTMLElement | null;
    if (!cell) return { overIdx: null, overDollar: false };

    const idxStr = cell.getAttribute("data-slot-index");
    const idx = idxStr != null ? Number(idxStr) : NaN;
    if (!Number.isFinite(idx)) return { overIdx: null, overDollar: false };

    return { overIdx: idx, overDollar: false };
  }

  // ==== застосувати drop (move/merge/sell)
  function applyDrop(srcIdx: number, lvl: number, target: { overIdx: number | null; overDollar: boolean }) {
    // перевірка актуальності
    if (srcIdx < 0 || srcIdx >= slots.length) return;
    const srcLevelNow = slots[srcIdx] || 0;
    if (srcLevelNow !== lvl || lvl <= 0) return;

    // SELL
    if (target.overDollar) {
      const sellGain = round2(sellValueForLevel(lvl));
      setMgp((v) => round2(v + sellGain));
      setSlots((prev) => {
        const copy = [...prev];
        copy[srcIdx] = 0;
        return copy;
      });
      return;
    }

    const targetIdx = target.overIdx;
    if (targetIdx == null) return;
    if (targetIdx === srcIdx) return;

    const dstLevelNow = slots[targetIdx] || 0;

    // MOVE to empty
    if (dstLevelNow === 0) {
      setSlots((prev) => {
        const copy = [...prev];
        copy[targetIdx] = srcLevelNow;
        copy[srcIdx] = 0;
        return copy;
      });
      return;
    }

    // MERGE
    if (dstLevelNow === srcLevelNow) {
      if (dstLevelNow >= 50) return;
      setSlots((prev) => {
        const copy = [...prev];
        copy[targetIdx] = Math.min(dstLevelNow + 1, 50);
        copy[srcIdx] = 0;
        return copy;
      });
      return;
    }
  }

  // ==== Pointer-based drag (iPhone-friendly)
  const onPointerDownCell = (e: React.PointerEvent, index: number, level: number) => {
    // drag стартує ТІЛЬКИ якщо в слоті є предмет
    if (!level) return;

    // ✅ прибиваємо iOS ghost click одразу
    suppressClickRef.current = true;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}

    startPosRef.current = { x: e.clientX, y: e.clientY };

    setDrag({
      active: true,
      srcIdx: index,
      level,
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      overIdx: null,
      overDollar: false,
      started: false,
    });
  };

  const onPointerMove = (e: PointerEvent) => {
    // ✅ FIX iOS/Telegram: коли drag активний — прибиваємо "swipe down to close"
    if (dragActiveRef.current && (e as any).cancelable) {
      try {
        e.preventDefault();
      } catch {}
    }

    setDrag((s) => {
      if (!s.active || s.pointerId !== e.pointerId) return s;

      const start = startPosRef.current;
      const dx = start ? e.clientX - start.x : 0;
      const dy = start ? e.clientY - start.y : 0;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const started = s.started || dist > 6;

      const target = pickDropTarget(e.clientX, e.clientY);
      return {
        ...s,
        x: e.clientX,
        y: e.clientY,
        overIdx: target.overIdx,
        overDollar: target.overDollar,
        started,
      };
    });
  };

  const finishDrag = (e: PointerEvent) => {
    setDrag((s) => {
      if (!s.active || s.pointerId !== e.pointerId) return s;

      if (s.started) {
        applyDrop(s.srcIdx, s.level, { overIdx: s.overIdx, overDollar: s.overDollar });
      }

      window.setTimeout(() => {
        suppressClickRef.current = false;
        startPosRef.current = null;
      }, 0);

      return {
        active: false,
        srcIdx: -1,
        level: 0,
        x: 0,
        y: 0,
        pointerId: -1,
        overIdx: null,
        overDollar: false,
        started: false,
      };
    });
  };

  useEffect(() => {
    const move = (e: PointerEvent) => onPointerMove(e);
    const up = (e: PointerEvent) => finishDrag(e);
    const cancel = (e: PointerEvent) => finishDrag(e);

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", cancel, { passive: true });

    return () => {
      window.removeEventListener("pointermove", move as any);
      window.removeEventListener("pointerup", up as any);
      window.removeEventListener("pointercancel", cancel as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const totalIncome = useMemo(() => slots.reduce((acc, lvl) => acc + (defOf(lvl)?.income_per_hour_mgp ?? 0), 0), [slots, defs]);

  const dragOverDollar = drag.active && drag.started && drag.overDollar;
  const dragOverIdx = drag.active && drag.started ? drag.overIdx : null;

  const dragIcon = drag.active ? iconByLevel(drag.level) : "";

  return (
    <section className="craft">
      <h2>{t.title}</h2>
      <p>
        <b>{t.descA}</b> {t.descMove} <b>{t.descMerge}</b> {t.descSell}
      </p>

      <div className="row" style={{ opacity: 0.9, marginBottom: 8 }}>
        {t.balance}: <b>{nfmt(mgp, lang)} MGP</b> • {t.income}: <b>{nfmt(totalIncome, lang)}</b> {t.perHour}
      </div>

      <div className="craft-root" ref={rootRef}>
        <div className="craft-grid">
          {Array.from({ length: SLOTS_COUNT }).map((_, i) => {
            const lvl = slots[i] || 0;
            const curDef = defOf(lvl);

            const isDragOver = dragOverIdx === i;
            const { ok, reason } = drag.active ? canDropInfo(i, drag.level) : { ok: false, reason: "blocked" as const };
            const dropClass = isDragOver ? (ok ? (reason === "merge" ? "drop-ok-merge" : "drop-ok-move") : "drop-bad") : "";

            const icon = lvl > 0 ? iconByLevel(lvl) : "";
            const isDragSource = drag.active && drag.started && drag.srcIdx === i;

            return (
              <button
                key={i}
                data-slot-index={i}
                className={`cell tile ${lvl ? "has" : ""} ${dropClass} ${isDragSource ? "drag-source" : ""}`}
                // ✅ кліки більше не використовуємо (і прибиваємо iOS ghost click)
                onClickCapture={(e) => {
                  if (suppressClickRef.current) e.preventDefault();
                }}
                onClick={(e) => {
                  e.preventDefault();
                }}
                type="button"
                draggable={false}
                onPointerDown={(e) => onPointerDownCell(e, i, lvl)}
                title={lvl ? `L${lvl}` : t.emptySlot}
              >
                <div className="tile-fig">
                  {icon && !isDragSource ? (
                    <img src={icon} alt={`L${lvl}`} className="tile-img" draggable={false} />
                  ) : (
                    <span className="tile-plus">{isDragSource ? "" : "+"}</span>
                  )}
                  <span className="tile-lvl">{lvl ? `L${lvl}` : ""}</span>
                  <div className="tile-sub">{lvl > 0 && curDef ? `${nfmt(curDef.income_per_hour_mgp, lang)}/h` : ""}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          data-drop="dollar"
          className={`craft-dollar ${dragOverDollar ? "drag-over" : ""}`}
          title={t.sellHint}
          onClick={(e) => e.preventDefault()}
          type="button"
        >
          $
        </button>

        {drag.active && drag.started ? (
          <div
            className="drag-preview"
            style={{
              left: drag.x,
              top: drag.y,
            }}
            aria-hidden
          >
            <div className="drag-preview-tile">
              {dragIcon ? <img src={dragIcon} alt="" draggable={false} /> : null}
              <div className="drag-preview-badge">L{drag.level}</div>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        .craft-root{ position:relative; }
        .tile{ touch-action:none; -webkit-user-select:none; user-select:none; }

        .craft-grid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap:10px;
        }

        .tile{
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.08);
          border-radius:16px;
          padding:10px;
          text-align:center;
          color:#fff;
          cursor:default;
        }

        .tile-fig{ display:flex; flex-direction:column; align-items:center; gap:6px; }
        .tile-img{ width:52px; height:52px; object-fit:contain; border-radius:12px; }
        .tile-plus{ font-size:26px; opacity:.6; height:52px; display:flex; align-items:center; justify-content:center; }
        .tile-lvl{ font-weight:1000; font-size:12px; opacity:.95; }
        .tile-sub{ font-size:12px; opacity:.75; font-weight:800; }

        .drop-ok-move{ box-shadow: 0 0 0 2px rgba(83,255,166,.45), inset 0 0 18px rgba(83,255,166,.10); }
        .drop-ok-merge{ box-shadow: 0 0 0 2px rgba(160,120,255,.55), inset 0 0 18px rgba(160,120,255,.12); }
        .drop-bad{ box-shadow: 0 0 0 2px rgba(255,80,80,.45), inset 0 0 18px rgba(255,80,80,.10); }

        .drag-source{ opacity:.25; }

        .craft-dollar{
          position:fixed;
          right:18px;
          bottom:110px;
          width:56px;
          height:56px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
          background:rgba(0,0,0,.25);
          color:#8ef0c6;
          font-weight:1000;
          font-size:22px;
          display:grid;
          place-items:center;
          box-shadow: 0 10px 25px rgba(0,0,0,.25);
        }
        .craft-dollar.drag-over{
          box-shadow: 0 0 0 3px rgba(83,255,166,.45), 0 10px 25px rgba(0,0,0,.25);
          filter:brightness(1.08);
        }

        .drag-preview{
          position:fixed;
          z-index:9999;
          pointer-events:none;
          transform: translate(-50%, -70%);
        }
        .drag-preview-tile{
          width:74px;
          height:74px;
          border-radius:18px;
          border:1px solid rgba(255,255,255,.14);
          background:rgba(10,14,22,.78);
          display:grid;
          place-items:center;
          box-shadow: 0 18px 50px rgba(0,0,0,.35);
        }
        .drag-preview-tile img{
          width:52px;
          height:52px;
          object-fit:contain;
          border-radius:12px;
        }
        .drag-preview-badge{
          position:absolute;
          bottom:-8px;
          left:50%;
          transform:translateX(-50%);
          padding:4px 8px;
          border-radius:999px;
          font-size:11px;
          font-weight:1000;
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.12);
          color:#fff;
        }

        @media (max-width: 420px){
          .craft-grid{ grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
      `}</style>
    </section>
  );
}
