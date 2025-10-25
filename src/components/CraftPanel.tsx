import React, { useMemo, useState } from "react";
import { buildCraftItems } from "../systems/economy";
import { iconByLevel } from "../systems/shop_icons";

/**
 * CraftPanel (20 слотів):
 * - Клік по слоту: купити L1 або апґрейд до L+1 (за mgp)
 * - Drag & Drop:
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

function round2(n: number) { return Math.round(n * 100) / 100; }
const coin = (n: number) => n.toLocaleString("uk-UA", { maximumFractionDigits: 2 });

export default function CraftPanel({ mgp, setMgp, slots, setSlots, items }: Props) {
  const defs = useMemo(() => items ?? buildCraftItems(), [items]);

  const [dragOverDollar, setDragOverDollar] = useState(false);
  const [dragSrc, setDragSrc] = useState<{ index: number; level: number } | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const defOf = (lvl: number | undefined) =>
    typeof lvl === "number" && lvl >= 1 && lvl <= 50 ? defs[lvl - 1] : undefined;

  // 70% від ціни поточного рівня (універсально для L1..L50)
  const sellValueForLevel = (lvl: number) => {
    const d = defOf(lvl);
    return d ? d.price_mgp * 0.7 : 0;
  };

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
    if (srcIdx === targetIdx) return; // у себе

    const srcLevelNow = slots[srcIdx] || 0;
    const dstLevelNow = slots[targetIdx] || 0;
    if (srcLevelNow !== lvl || lvl <= 0) return; // захист

    // 1) Переміщення на порожній
    if (dstLevelNow === 0) {
      setSlots(prev => {
        const copy = [...prev];
        copy[targetIdx] = srcLevelNow;
        copy[srcIdx] = 0;
        return copy;
      });
      return;
    }

    // 2) Злиття однакових рівнів → L+1
    if (dstLevelNow === srcLevelNow) {
      if (dstLevelNow >= 50) return;
      setSlots(prev => {
        const copy = [...prev];
        copy[targetIdx] = Math.min(dstLevelNow + 1, 50);
        copy[srcIdx] = 0;
        return copy;
      });
      return;
    }
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

    // 70% від ціни поточного рівня
    const sellGain = round2(sellValueForLevel(lvl));

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
        <b>20 слотів.</b> Клік — купити/апгрейд за mgp. Перетягни:
        <b> на порожній</b> — перемістити; <b>на такий самий рівень</b> — злиття <b>L+L = L+1</b>;
        на <b>$</b> — продати (70% від ціни рівня).
      </p>

      <div className="row" style={{ opacity: .9, marginBottom: 8 }}>
        Баланс: <b>{coin(mgp)} mgp</b> • Дохід: <b>{coin(totalIncome)}</b> mgp/год
      </div>

      <div className="craft-grid">
        {Array.from({ length: SLOTS_COUNT }).map((_, i) => {
          const lvl = slots[i] || 0;
          const next = Math.min(lvl + 1 || 1, 50);
          const curDef = defOf(lvl);
          const nextDef = defOf(next);
          const maxed = lvl >= 50;

          const isDragOver = dragOverIdx === i;
          const { ok, reason } = canDropInfo(i);
          const dropClass =
            isDragOver ? (ok ? (reason === "merge" ? "drop-ok-merge" : "drop-ok-move") : "drop-bad") : "";

          const icon = lvl > 0 ? iconByLevel(lvl) : "";

          return (
            <button
              key={i}
              className={`cell tile ${lvl ? "has" : ""} ${dropClass}`}
              onClick={() => !maxed && handleClick(i)}
              disabled={maxed || !nextDef || mgp < (nextDef?.price_mgp ?? Infinity)}
              title={
                maxed
                  ? "MAX"
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
              <div className="tile-fig">
                {icon ? (
                  <img src={icon} alt={`L${lvl}`} className="tile-img" />
                ) : (
                  <span className="tile-plus">+</span>
                )}
                <span className="tile-lvl">{maxed ? "MAX" : (lvl ? `L${lvl}` : `L1`)}</span>
                <div className="tile-sub">
                  {lvl > 0
                    ? `${coin(curDef!.income_per_hour_mgp)}/год`
                    : nextDef ? `${coin(nextDef.price_mgp)} mgp` : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Ціль для дропа продажу */}
      <button
        className={`craft-dollar ${dragOverDollar ? "drag-over" : ""}`}
        title="Перетягни сюди предмет, щоб продати за 70% від ціни рівня"
        onDragOver={(e) => { e.preventDefault(); setDragOverDollar(true); }}
        onDragLeave={() => setDragOverDollar(false)}
        onDrop={onDollarDrop}
      >
        $
      </button>
    </section>
  );
}
