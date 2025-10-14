import React, { useMemo, useState } from "react";
import { buildCraftItems } from "../systems/economy";

/**
 * CraftPanel 3×7 (21 слот):
 * - клік ставить L1 або апґрейдить до L+1
 * - drag & drop: перетягни слот на «$», щоб продати за 70% ціни поточного рівня
 * - економіка: ROI 5→10 днів, g=1.20, ціна = ROI * 24 * income * PRICE_SCALE
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
  items?: CraftItem[]; // кастомні, якщо треба
};

function round2(n: number) { return Math.round(n * 100) / 100; }
const coin = (n: number) => n.toLocaleString("uk-UA", { maximumFractionDigits: 2 });

export default function CraftPanel({ mgp, setMgp, slots, setSlots, items }: Props) {
  const defs = useMemo(() => items ?? buildCraftItems(), [items]);
  const [dragOverDollar, setDragOverDollar] = useState(false);

  const defOf = (lvl: number | undefined) =>
    typeof lvl === "number" && lvl >= 1 && lvl <= 50 ? defs[lvl - 1] : undefined;

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

  // ---- Drag & Sell (на «$») ----
  const onCellDragStart = (e: React.DragEvent, index: number, level: number) => {
    if (!level) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", JSON.stringify({ index, level }));
    e.dataTransfer.effectAllowed = "move";
  };
  const onCellDragEnd = () => setDragOverDollar(false);

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

  return (
    <section className="craft">
      <h2>Крафт артефактів</h2>
      <p>Сітка <b>3×7</b>. Тисни на слот, щоб поставити <b>L1</b> або апгрейднути до <b>L+1</b>. Перетягни слот на <b>$</b>, щоб продати (70%).</p>

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

          return (
            <button
              key={i}
              className={`cell ${lvl ? "has" : ""}`}
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
    </section>
  );
}
