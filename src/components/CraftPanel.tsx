import React, { useMemo, useState } from "react";
import { buildCraftItems } from "../systems/economy";

/**
 * CraftPanel 3×7 (21 слот):
 * - Клік по слоту: купити L1 або апґрейд до L+1 (за mgp)
 * - Drag & Drop:
 *    • перетяг на порожній слот → перенесення
 *    • перетяг на такий самий рівень → злиття L + L = L+1 (безкоштовно)
 *    • перетяг на $ → продаж за 70% ціни поточного рівня
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
  slots: number[]; // 21 елемент (0..50)
  setSlots: React.Dispatch<React.SetStateAction<number[]>>;
  items?: CraftItem[];
};

function round2(n: number) { return Math.round(n * 100) / 100; }
const coin = (n: number) => n.toLocaleString("uk-UA", { maximumFractionDigits: 2 });

export default function CraftPanel({ mgp, setMgp, slots, setSlots, items }: Props) {
  const defs = useMemo(() => items ?? buildCraftItems(), [items]);

  const [dragOverDollar, setDragOverDollar] = useState(false);
  const [dragSrc, setDragSrc] = useState<{ index: number; level: number } | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const defOf = (lvl: number | undefined) =>
    typeof lvl === "number" && lvl >= 1 && lvl <= 50 ? defs[lvl - 1] : undefined;

  // ==== Клік-купівля/апґрейд (за mgp)
  const handleClick = (index: number) => {
    const cur = slots[index] || 0;
    const next = Math.min(cur + 1 || 1, 50);
    const d = defOf(next);
    if (!d || mgp < d.price_mgp) return;

    setSlots(prev => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
    setMgp(v => round2(v - d.price_mgp));
  };

  // ==== Drag: старт / закінчення
  const onCellDragStart = (e: React.DragEvent, index: number, level: number) => {
    if (!level) { e.preventDefault(); return; }
    const payload = JSON.stringify({ index, level });
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
    setDragSrc({ index, level });
  };
  const onCellDragEnd = () => { setDragOverDollar(false); setDragOverIdx(null); setDragSrc(null); };

  // ==== Drag over/leave/drop на комірку
  const onCellDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    setDragOverIdx(targetIdx);
  };
  const onCellDragLeave = (_e: React.DragEvent, targetIdx: number) => {
    if (dragOverIdx === targetIdx) setDragOverIdx(null);
  };
  const onCellDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    setDragOverIdx(null);

    const txt = e.dataTransfer.getData("text/plain");
    if (!txt) return;
    let data: any = null;
    try { data = JSON.parse(txt); } catch {}
    if (!data || typeof data.index !== "number" || typeof data.level !== "number") return;

    const srcIdx = data.index as number;
    const lvl = data.level as number;
    if (srcIdx === targetIdx) return; // дропнули в себе

    const srcLevelNow = slots[srcIdx] || 0;
    const dstLevelNow = slots[targetIdx] || 0;
    if (srcLevelNow !== lvl || lvl <= 0) return; // захист від розсинхрону

    // 1) Переміщення на порожній слот
    if (dstLevelNow === 0) {
      setSlots(prev => {
        const copy = [...prev];
        copy[targetIdx] = srcLevelNow;
        copy[srcIdx] = 0;
        return copy;
      });
      return;
    }

    // 2) Злиття однакових рівнів → L+1 (безкоштовно)
    if (dstLevelNow === srcLevelNow) {
      if (dstLevelNow >= 50) return; // максимум
      setSlots(prev => {
        const copy = [...prev];
        copy[targetIdx] = Math.min(dstLevelNow + 1, 50);
        copy[srcIdx] = 0;
        return copy;
      });
      return;
    }

    // 3) Інакше — нічого (рівні різні)
  };

  // ---- Drag & Sell (на «$»)
  const onDollarDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOverDollar(true); };
  const onDollarDragLeave = () => setDragOverDollar(false);

  const onDollarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDollar(false);
    const txt = e.dataTransfer.getData("text/plain");
    if (!txt) return;

    let data: any = null;
    try { data = JSON.parse(txt); } catch {}
    if (!data || typeof data.index !== "number" || typeof data.level !== "number") return;

    const idx = data.index as number;
    const lvl = data.level as number;
    if (idx < 0 || idx >= slots.length) return;
    if (slots[idx] !== lvl || lvl <= 0) return;

    const curDef = defOf(lvl);
    if (!curDef) return;

    const sellGain = round2(curDef.price_mgp * 0.7);
    setMgp(v => round2(v + sellGain));
    setSlots(prev => {
      const copy = [...prev];
      copy[idx] = 0;
      return copy;
    });
  };

  const totalIncome = useMemo(
    () => slots.reduce((acc, lvl) => acc + (defOf(lvl)?.income_per_hour_mgp ?? 0), 0),
    [slots]
  );

  // Підсвітка дропа (ОК/неОК)
  const canDropInfo = (targetIdx: number) => {
    if (!dragSrc) return { ok: false, reason: "" };
    const dstLevel = slots[targetIdx] || 0;
    if (dstLevel === 0) return { ok: true, reason: "move" };
    if (dstLevel === dragSrc.level && dstLevel < 50) return { ok: true, reason: "merge" };
    return { ok: false, reason: "blocked" };
  };

  return (
    <section className="craft">
      <h2>Крафт артефактів</h2>
      <p>
        Сітка <b>3×7</b>. Клік — купити/апгрейд за mgp. Перетягни:
        <b> на порожній</b> — перемістити; <b>на такий самий рівень</b> — злиття <b>L+L= L+1</b>;
        на <b>$</b> — продати (70%).
      </p>

      <div className="row" style={{ opacity: .9, marginBottom: 8 }}>
        Баланс: <b>{coin(mgp)} mgp</b> • Дохід: <b>{coin(totalIncome)}</b> mgp/год
      </div>

      <div className="craft-grid">
        {Array.from({ length: 21 }).map((_, i) => {
          const lvl = slots[i] || 0;
          const next = Math.min(lvl + 1 || 1, 50);
          const curDef = defOf(lvl);
          const nextDef = defOf(next);
          const maxed = lvl >= 50;

          const isDragOver = dragOverIdx === i;
          const { ok, reason } = canDropInfo(i);
          const dropClass =
            isDragOver ? (ok ? (reason === "merge" ? "drop-ok-merge" : "drop-ok-move") : "drop-bad") : "";

          return (
            <button
              key={i}
              className={`cell ${lvl ? "has" : ""} ${dropClass}`}
              onClick={() => !maxed && handleClick(i)}
              disabled={maxed || !nextDef || mgp < (nextDef?.price_mgp ?? Infinity)}
              title={
                maxed
                  ? "Максимальний рівень"
                  : lvl
                  ? `L${lvl} → L${next} • ${coin(nextDef!.price_mgp)} mgp`
                  : `Купити L1 • ${coin(nextDef!.price_mgp)} mgp`
              }
              draggable={lvl > 0}
              onDragStart={(e) => onCellDragStart(e, i, lvl)}
              onDragEnd={onCellDragEnd}
              onDragOver={(e) => onCellDragOver(e, i)}
              onDragLeave={(e) => onCellDragLeave(e, i)}
              onDrop={(e) => onCellDrop(e, i)}
            >
              <div className="cell-icon">{maxed ? "MAX" : (lvl ? `L${lvl}` : "+")}</div>
              <div className="cell-title">{curDef?.name ?? "Порожньо"}</div>
              <div className="cell-sub">
                {lvl > 0
                  ? `${coin(curDef!.income_per_hour_mgp)}/год`
                  : nextDef ? `L1: ${coin(nextDef.price_mgp)} mgp` : ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Бірюзовий значок $ — ціль для дропа (продаж 70%) */}
      <button
        className={`craft-dollar ${dragOverDollar ? "drag-over" : ""}`}
        title="Перетягни сюди предмет, щоб продати за 70% ціни рівня"
        onDragOver={onDollarDragOver}
        onDragLeave={onDollarDragLeave}
        onDrop={onDollarDrop}
      >
        $
      </button>

      <style>{`
        .craft-grid{
          display:grid; grid-template-columns: repeat(7, minmax(0,1fr));
          gap: 10px; margin-bottom: 14px;
        }
        .cell{
          padding:10px; border-radius:14px; text-align:left;
          background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
          min-height:76px; cursor:pointer; user-select:none;
          display:flex; flex-direction:column; justify-content:center; gap:4px;
          transition: box-shadow .15s ease, transform .1s ease, background .15s ease;
        }
        .cell.has{ background: rgba(255,255,255,.06); }
        .cell:disabled{ opacity:.55; cursor:default; }

        .cell-icon{ font-weight:800; }
        .cell-title{ font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cell-sub{ opacity:.85; font-size:12px; }

        /* Drop feedback */
        .cell.drop-ok-move{ box-shadow: 0 0 0 2px rgba(80,200,255,.4) inset; }
        .cell.drop-ok-merge{
          box-shadow: 0 0 0 2px rgba(160,120,255,.5) inset, 0 0 12px rgba(160,120,255,.25);
          transform: scale(1.01);
        }
        .cell.drop-bad{ box-shadow: 0 0 0 2px rgba(255,100,100,.35) inset; }

        .craft-dollar{
          width:60px; height:60px; border-radius:50%;
          border:0; font-weight:900; font-size:22px; cursor:grab;
          background: rgba(0,255,200,.1); color: #7fffe4;
          box-shadow: inset 0 0 18px rgba(0,255,200,.18), 0 0 0 2px rgba(0,255,200,.35);
          transition: transform .1s ease, box-shadow .15s ease;
        }
        .craft-dollar.drag-over{
          transform: scale(1.06);
          box-shadow: inset 0 0 26px rgba(0,255,200,.25), 0 0 0 3px rgba(0,255,200,.6);
        }
      `}</style>
    </section>
  );
}
