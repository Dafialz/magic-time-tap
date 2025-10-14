import React, { useMemo, useState } from "react";

/**
 * CraftPanel 3×7 (21 слот):
 * - кожен слот зберігає рівень (0 = порожньо)
 * - клік ставить L1 або апґрейдить до L+1
 * - drag & drop: перетягни слот на "$", щоб продати за 70% ціни поточного рівня
 * - доходи/ціни — g=1.20, ROI 5→10 днів (L1→L50)
 */

type CraftItem = {
  level: number;
  name: string;
  price_mgp: number;            // ціна цього рівня (L-апґрейду)
  income_per_hour_mgp: number;  // дохід з одного слота на цьому рівні
  roi_days: number;             // окупність у днях
};

type Props = {
  mgp: number;
  // ВАЖЛИВО: сеттери як Dispatch<SetStateAction<...>> для підтримки (prev)=>...
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  slots: number[];               // довжина = 21; значення 0..50
  setSlots: React.Dispatch<React.SetStateAction<number[]>>;
  items?: CraftItem[];           // (необов'язково) 50 рівнів
};

const CRAFT_NAMES: string[] = [
  "Піщинка Часу","Міні-годинник","Кварцовий хронометр","Аметистовий таймер","Ретро-маятник",
  "Портативна клепсидра","Стак Часу","Магнітний годинник","Неонова стрілка","Астральний маятник",
  "Руна годинника","Пружина Епох","Гіроскоп часу","Сферичний хроном","Ізумрудна клепсидра",
  "Фотонний секундомір","Хрономаяк","Крипто-хронометр","Пісочний портал","Кристал Вічності",
  "Вежа Тік-Так","Квантовий таймер","Базальтовий годинник","Резонатор епох","Сапфірова спіраль",
  "Кванто-маятник","Фрактальний годинник","Стержень Хроноса","Лінза секунд","Хронограф Небул",
  "Темпоральний турбіон","Пульсарний метроном","Магічний регулятор","Синхронізатор епох","Антиматерійна стрілка",
  "Годинник Дракона","Ефірний турбіон","Кібер-хроном","Арканум часу","Венценосний годинник",
  "Призма Секунд","Хроножниво","Полярний маятник","Двигун Кайроса","Кваркова клепсидра",
  "Кільце Еонів","Сингулярний хроном","Серце Галактики","Часовий Реактор","Брама Вічності"
];

function round2(n: number) { return Math.round(n * 100) / 100; }
function round3(n: number) { return Math.round(n * 1000) / 1000; }
const coin = (n: number) => n.toLocaleString("uk-UA", { maximumFractionDigits: 2 });

/** Генеруємо дефолтні 50 рівнів (економіка) */
function buildDefaultItems(): CraftItem[] {
  const COST_SCALE = 0.1415231988486343; // підібрано під 60 днів до L50 без донату
  const g = 1.20;
  return Array.from({ length: 50 }, (_, i) => {
    const level = i + 1;
    const roi_days = 5 + (level - 1) * (10 - 5) / 49; // 5 → 10
    const income = Math.pow(g, level - 1);           // mgp/год
    const baseCost = roi_days * 24 * income;
    return {
      level,
      name: CRAFT_NAMES[i] ?? `L${level}`,
      price_mgp: round2(baseCost * COST_SCALE),
      income_per_hour_mgp: round3(income),
      roi_days: round3(roi_days),
    };
  });
}

export default function CraftPanel({ mgp, setMgp, slots, setSlots, items }: Props) {
  const defs = useMemo(() => items ?? buildDefaultItems(), [items]);
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

  // ---- Drag helpers ----
  const onCellDragStart = (e: React.DragEvent, index: number, level: number) => {
    if (!level) { e.preventDefault(); return; }
    const payload = JSON.stringify({ index, level });
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "move";
  };
  const onCellDragEnd = () => { setDragOverDollar(false); };

  const onDollarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverDollar(true);
  };
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

    // валідуємо поточний стан слота
    if (idx < 0 || idx >= slots.length) return;
    if (slots[idx] !== lvl || lvl <= 0) return;

    const curDef = defOf(lvl);
    if (!curDef) return;

    // 70% ціни рівня
    const sellGain = round2(curDef.price_mgp * 0.7);
    if (sellGain <= 0) return;

    // оновлюємо баланс і очищаємо слот
    setMgp(v => round2(v + sellGain));
    setSlots(prev => {
      const copy = [...prev];
      copy[idx] = 0;
      return copy;
    });
  };

  const totalIncome = useMemo(() => {
    return slots.reduce((acc, lvl) => acc + (defOf(lvl)?.income_per_hour_mgp ?? 0), 0);
  }, [slots]);

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

      {/* Бірюзовий значок $ у правому нижньому куті (drop target) */}
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
