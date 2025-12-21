// src/components/CraftPanel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildCraftItems } from "../systems/economy";
import { iconByLevel } from "../systems/shop_icons";

/**
 * CraftPanel (20 слотів):
 * - Клік по слоту: купити L1 або апґрейд до L+1 (за mgp)
 * - Drag & Drop (працює на iPhone):
 *    • на порожній → перемістити
 *    • на такий самий рівень → злиття L + L = L+1
 *    • на $ → продаж за 70% від ЦІНИ поточного рівня
 */

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
const coin = (n: number) => n.toLocaleString("uk-UA", { maximumFractionDigits: 2 });

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

  // щоб блокувати click після перетягування
  const suppressClickRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const defOf = (lvl: number | undefined) =>
    typeof lvl === "number" && lvl >= 1 && lvl <= 50 ? defs[lvl - 1] : undefined;

  // 70% від ціни поточного рівня (універсально для L1..L50)
  const sellValueForLevel = (lvl: number) => {
    const d = defOf(lvl);
    return d ? d.price_mgp * 0.7 : 0;
  };

  // ==== Клік-купівля/апґрейд (за mgp)
  const handleClick = (index: number) => {
    // якщо щойно тягнули — клік ігноруємо
    if (suppressClickRef.current) return;

    const cur = slots[index] || 0;
    const next = Math.min(cur + 1 || 1, 50);
    const d = defOf(next);
    if (!d || mgp < d.price_mgp) return;

    setSlots((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
    setMgp((v) => round2(v - d.price_mgp));
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
    if (!level) return;

    // щоб сторінка не скролилась під час drag
    // (працює якщо елемент має touch-action: none)
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}

    startPosRef.current = { x: e.clientX, y: e.clientY };
    suppressClickRef.current = false;

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
    setDrag((s) => {
      if (!s.active || s.pointerId !== e.pointerId) return s;

      const start = startPosRef.current;
      const dx = start ? e.clientX - start.x : 0;
      const dy = start ? e.clientY - start.y : 0;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // поріг, після якого вважаємо що це саме drag, а не tap
      const started = s.started || dist > 6;
      if (started) suppressClickRef.current = true;

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

      // якщо drag реально стартував — робимо drop
      if (s.started) {
        applyDrop(s.srcIdx, s.level, { overIdx: s.overIdx, overDollar: s.overDollar });
      }

      // скидаємо suppressClick трохи пізніше (щоб не спрацював click)
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
    // глобальні pointer listeners
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
  }, [slots, mgp]);

  const totalIncome = useMemo(
    () => slots.reduce((acc, lvl) => acc + (defOf(lvl)?.income_per_hour_mgp ?? 0), 0),
    [slots, defs]
  );

  // для підсвітки $-кнопки
  const dragOverDollar = drag.active && drag.started && drag.overDollar;
  const dragOverIdx = drag.active && drag.started ? drag.overIdx : null;

  // прев’ю іконки під пальцем
  const dragIcon = drag.active ? iconByLevel(drag.level) : "";

  return (
    <section className="craft">
      <h2>Крафт артефактів</h2>
      <p>
        <b>20 слотів.</b> Клік — купити/апгрейд за mgp. Перетягни:
        <b> на порожній</b> — перемістити; <b>на такий самий рівень</b> — злиття <b>L+L = L+1</b>;
        на <b>$</b> — продати (70% від ціни рівня).
      </p>

      <div className="row" style={{ opacity: 0.9, marginBottom: 8 }}>
        Баланс: <b>{coin(mgp)} mgp</b> • Дохід: <b>{coin(totalIncome)}</b> mgp/год
      </div>

      <div className="craft-root" ref={rootRef}>
        <div className="craft-grid">
          {Array.from({ length: SLOTS_COUNT }).map((_, i) => {
            const lvl = slots[i] || 0;
            const next = Math.min(lvl + 1 || 1, 50);
            const curDef = defOf(lvl);
            const nextDef = defOf(next);
            const maxed = lvl >= 50;

            const isDragOver = dragOverIdx === i;
            const { ok, reason } = drag.active ? canDropInfo(i, drag.level) : { ok: false, reason: "blocked" as const };
            const dropClass =
              isDragOver ? (ok ? (reason === "merge" ? "drop-ok-merge" : "drop-ok-move") : "drop-bad") : "";

            const icon = lvl > 0 ? iconByLevel(lvl) : "";

            // "елемент не має оставатись": під час перетягування джерело робимо "порожнім" візуально
            const isDragSource = drag.active && drag.started && drag.srcIdx === i;

            return (
              <button
                key={i}
                data-slot-index={i}
                className={`cell tile ${lvl ? "has" : ""} ${dropClass} ${isDragSource ? "drag-source" : ""}`}
                onClick={() => !maxed && handleClick(i)}
                disabled={maxed || !nextDef || mgp < (nextDef?.price_mgp ?? Infinity)}
                title={
                  maxed
                    ? "MAX"
                    : lvl
                    ? `L${lvl} → L${next} • ${coin(nextDef!.price_mgp)} mgp`
                    : `Купити L1 • ${coin(nextDef!.price_mgp)} mgp`
                }
                // вимикаємо нативний html5 drag (iOS глючить)
                draggable={false}
                onPointerDown={(e) => {
                  // якщо слот порожній — не стартуємо drag
                  if (lvl > 0) onPointerDownCell(e, i, lvl);
                }}
              >
                <div className="tile-fig">
                  {icon && !isDragSource ? (
                    <img src={icon} alt={`L${lvl}`} className="tile-img" draggable={false} />
                  ) : (
                    <span className="tile-plus">{isDragSource ? "" : "+"}</span>
                  )}
                  <span className="tile-lvl">{maxed ? "MAX" : lvl ? `L${lvl}` : `L1`}</span>
                  <div className="tile-sub">
                    {lvl > 0
                      ? `${coin(curDef!.income_per_hour_mgp)}/год`
                      : nextDef
                      ? `${coin(nextDef.price_mgp)} mgp`
                      : ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Ціль для дропа продажу */}
        <button
          data-drop="dollar"
          className={`craft-dollar ${dragOverDollar ? "drag-over" : ""}`}
          title="Перетягни сюди предмет, щоб продати за 70% від ціни рівня"
          onClick={() => {
            // не робимо нічого
          }}
        >
          $
        </button>

        {/* Плаваючий прев’ю-тайл (працює на iPhone) */}
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

        /* ВАЖЛИВО для iOS: вимикає скрол/zoom-жести під час drag по тайлу */
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
          cursor:pointer;
        }

        .tile:disabled{ opacity:.6; cursor:not-allowed; }

        .tile-fig{ display:flex; flex-direction:column; align-items:center; gap:6px; }
        .tile-img{ width:52px; height:52px; object-fit:contain; border-radius:12px; }
        .tile-plus{ font-size:26px; opacity:.6; height:52px; display:flex; align-items:center; justify-content:center; }
        .tile-lvl{ font-weight:1000; font-size:12px; opacity:.95; }
        .tile-sub{ font-size:12px; opacity:.75; font-weight:800; }

        /* Підсвітка drop */
        .drop-ok-move{ box-shadow: 0 0 0 2px rgba(83,255,166,.45), inset 0 0 18px rgba(83,255,166,.10); }
        .drop-ok-merge{ box-shadow: 0 0 0 2px rgba(160,120,255,.55), inset 0 0 18px rgba(160,120,255,.12); }
        .drop-bad{ box-shadow: 0 0 0 2px rgba(255,80,80,.45), inset 0 0 18px rgba(255,80,80,.10); }

        /* Джерело під час drag — виглядає як "порожнє" (щоб не "оставатись") */
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

        /* Плаваючий прев'ю */
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
