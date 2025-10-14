import React, { useMemo } from "react";

/**
 * НОВИЙ CraftPanel:
 * - 4×5 сітка (20 слотів)
 * - 50 рівнів предметів (L1..L50)
 * - Кожен слот тримає рівень предмета (0 = пусто)
 * - Кнопка в слоті купує L1 або підвищує рівень до L+1
 *
 * Очікувані пропси:
 *  - mgp: поточний баланс
 *  - setMgp: оновлення балансу
 *  - slots: масив із 20 чисел (рівень у кожному слоті)
 *  - setSlots: оновлення слотів
 *  - items (необов’язково): перелік 50 предметів з цінами/дохідом.
 *    Якщо не передати — згенерується дефолтний балансований набір.
 */

type CraftItem = {
  level: number;
  name: string;
  price_mgp: number;            // ціна купівлі цього рівня
  income_per_hour_mgp: number;  // дохід з одного слота на цьому рівні
  roi_days: number;             // окупність у днях (5 -> 10 від L1 до L50)
};

type Props = {
  mgp: number;
  setMgp: (v: number) => void;
  slots: number[];               // довжина = 20; значення 0..50
  setSlots: (s: number[]) => void;
  items?: CraftItem[];           // 50 елементів (L1..L50)
};

/* ---------- Дефолтні дані (50 предметів) ---------- */

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

/** Формуємо збалансовану економіку (g=1.20; ROI 5→10 днів; масштаб під 60 днів до L50 без донату). */
function buildDefaultItems(): CraftItem[] {
  const COST_SCALE = 0.1415231988486343; // підібрано
  const g = 1.20;

  const items: CraftItem[] = Array.from({ length: 50 }, (_, i) => {
    const level = i + 1;
    const roi_days = 5 + (level - 1) * (10 - 5) / 49;                 // 5 → 10
    const income = Math.pow(g, level - 1);                             // mgp/год
    const baseCost = roi_days * 24 * income;
    const price = round2(baseCost * COST_SCALE);
    return {
      level,
      name: CRAFT_NAMES[i] ?? `L${level}`,
      price_mgp: price,
      income_per_hour_mgp: round3(income),
      roi_days: round3(roi_days)
    };
  });
  return items;
}

/* ---------- Утиліти ---------- */
const fmt = (n: number) => Math.floor(n).toLocaleString("uk-UA");
const coin = (n: number) => n.toLocaleString("uk-UA", { maximumFractionDigits: 2 });
const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/* =================================================== */

export default function CraftPanel({
  mgp, setMgp, slots, setSlots, items
}: Props) {

  // Підготуємо дані (або візьмемо дефолтні)
  const defs = useMemo(() => items ?? buildDefaultItems(), [items]);

  // Витягуємо деф предмета певного рівня
  const defOf = (lvl: number | undefined) =>
    typeof lvl === "number" && lvl >= 1 && lvl <= 50 ? defs[lvl - 1] : undefined;

  // Натиснення на слот: купити L1 чи покращити до L+1
  const handleClick = (index: number) => {
    const cur = slots[index] || 0;
    const next = Math.min(cur + 1 || 1, 50);
    const d = defOf(next);
    if (!d) return;

    if (mgp < d.price_mgp) return; // бракує коштів

    const copy = [...slots];
    copy[index] = next;
    setSlots(copy);
    setMgp(round2(mgp - d.price_mgp));
  };

  // Сумарний дохід з усіх слотів (для підказки)
  const totalIncome = useMemo(() => {
    return slots.reduce((acc, lvl) => {
      const d = defOf(lvl);
      return acc + (d?.income_per_hour_mgp ?? 0);
    }, 0);
  }, [slots]);

  return (
    <section className="craft">
      <h2>Крафт артефактів</h2>
      <p>Сітка 4×5. Натисни на слот, щоб поставити <b>L1</b> або апгрейднути до <b>L+1</b>.</p>

      <div className="row" style={{opacity:.9, marginBottom:6}}>
        Баланс: <b>{coin(mgp)} mgp</b> • Дохід: <b>{coin(totalIncome)}</b> mgp/год
      </div>

      <div className="craft-grid">
        {Array.from({ length: 20 }).map((_, i) => {
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
                  ? `L${lvl} → L${next} • ціна ${coin(nextDef!.price_mgp)} mgp`
                  : `Купити L1 • ціна ${coin(nextDef!.price_mgp)} mgp`
              }
            >
              <div className="cell-icon">{maxed ? "MAX" : (lvl ? `L${lvl}` : "+")}</div>
              <div className="cell-title">
                {curDef?.name ?? "Порожньо"}
              </div>
              <div className="cell-sub">
                {lvl > 0
                  ? `${coin(curDef!.income_per_hour_mgp)}/год`
                  : nextDef ? `L1: ${coin(nextDef.price_mgp)} mgp` : ""}
              </div>
            </button>
          );
        })}
      </div>

      <div className="hint" style={{opacity:.8, fontSize:14, marginTop:8}}>
        Кожен рівень дорожчає та майнить більше. Окупність зростає від <b>5</b> до <b>10</b> днів (L1 → L50).
      </div>
    </section>
  );
}
