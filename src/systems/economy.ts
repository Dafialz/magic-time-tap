// Економіка крафту та магазину.
// ─────────────────────────────────────────────────────────────────────────────
// Частина 1. КРАФТ (L+L -> L+1)
// - Ціни для апґрейду рівнів у CraftPanel.
// - ROI фіксуємо 7.5 днів (можеш змінити, якщо треба інший профіль).
// Частина 2. МАГАЗИН (50 позицій)
// - Підгонка під ціль: від старту до 50-го айтема ~270 днів за сталого ROI=7.5.
//   Це досягається мультиплікатором цін SHOP_PRICE_GROWTH ≈ 1.698553775.
// - Артефакт №k має ціну: BASE * GROWTH^(k-1).

export type CraftItem = {
  level: number;
  name: string;
  income_per_hour_mgp: number; // дохід слота на цьому рівні
  roi_days: number;            // окупність у днях
  price_mgp: number;           // ціна апґрейду ДО цього рівня (або купівлі L1)
};

// ─────────────────────────────────────────────────────────────────────────────
// ЧАСТИНА 1. КРАФТ
// ─────────────────────────────────────────────────────────────────────────────
export const LEVELS = 50;

// База/зростання для косту рівнів у крафті
export const PRICE_BASE = 1080;     // L1 у крафті
export const PRICE_GROWTH = 1.28;   // м’яка експонента

// Фіксуємо ROI для простоти моделі
export const ROI_MIN = 7.5;
export const ROI_MAX = 7.5;

const round2 = (n: number) => Math.round(n * 100) / 100;

// ROI (сталий, але лишаємо функцію для читабельності)
export function roiDaysAtLevel(level: number): number {
  return round2(ROI_MIN);
}

// Ціна апґрейду до КОНКРЕТНОГО рівня Lk у крафті
export function priceAtLevel(level: number): number {
  const idx = Math.max(0, Math.min(LEVELS - 1, level - 1));
  return Math.round(PRICE_BASE * Math.pow(PRICE_GROWTH, idx));
}

// Дохід рівня (mgp/год) з ROI
export function incomePerHourAtLevel(level: number): number {
  const price = priceAtLevel(level);
  const perHour = price / (roiDaysAtLevel(level) * 24);
  return round2(perHour);
}

// Маніфест для CraftPanel
export function buildCraftItems(): CraftItem[] {
  return Array.from({ length: LEVELS }, (_, i) => {
    const level = i + 1;
    return {
      level,
      name: `Artifact L${level}`,
      income_per_hour_mgp: incomePerHourAtLevel(level),
      roi_days: roiDaysAtLevel(level),
      price_mgp: priceAtLevel(level),
    };
  });
}

// Скільки коштує апґрейд з Lk до L(k+1)
export function priceForUpgradeFrom(level: number): number {
  return priceAtLevel(level + 1);
}

// Невелика надбавка від «престижів» (за потреби)
export function mgpPrestigeMult(prestiges: number): number {
  const mult = 1 + 0.10 * Math.max(0, prestiges);
  return Math.min(3.0, mult);
}

// ─────────────────────────────────────────────────────────────────────────────
// ЧАСТИНА 2. МАГАЗИН (50 позицій, ціни під 270 днів до 50-го)
// ─────────────────────────────────────────────────────────────────────────────
export const SHOP_ITEMS_COUNT = 50;

// Калібровані параметри: ROI_shop = 7.5 днів, час до 50-го ≈ 270 днів.
export const SHOP_PRICE_BASE   = 500;          // ціна 1-го айтема в магазині
export const SHOP_PRICE_GROWTH = 1.698553775;  // множник між сусідніми айтемами

// Ціна k-го айтема (k починається з 1)
export function shopPriceAt(k: number): number {
  const idx = Math.max(1, Math.min(SHOP_ITEMS_COUNT, k));
  return Math.round(SHOP_PRICE_BASE * Math.pow(SHOP_PRICE_GROWTH, idx - 1));
}

// (опціонально) Оцінка сукупного часу до N-го айтема в ідеальній моделі реінвесту
export function expectedDaysToNth(n: number, roiDays = 7.5, growth = SHOP_PRICE_GROWTH): number {
  // Формула: T = ROI * sum_{k=2..n} Pk / (sum_{i=1..k-1} Pi)
  const price = (i: number) => SHOP_PRICE_BASE * Math.pow(growth, i - 1);
  let totalDays = 0;
  let acc = price(1);
  for (let k = 2; k <= n; k++) {
    const pk = price(k);
    totalDays += roiDays * (pk / acc);
    acc += pk;
  }
  return round2(totalDays);
}
