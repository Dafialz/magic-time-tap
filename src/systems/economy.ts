// src/systems/economy.ts
// Економіка для merge-сітки: 50 рівнів, L+L -> L+1.
// Вартість рівня — це ціна купівлі L1 або апґрейду до L+1.
// ROI плавно росте від 6 до 11 днів, дохід розраховується з ROI.

export type CraftItem = {
  level: number;
  name: string;
  income_per_hour_mgp: number; // дохід слота на цьому рівні
  roi_days: number;            // окупність у днях
  price_mgp: number;           // ЦІНА апґрейду ДО цього рівня (або купівлі L1)
};

// ===== Параметри моделі =====
export const LEVELS = 50;

// Ціни
export const PRICE_BASE = 1080;   // L1
export const PRICE_GROWTH = 1.28; // м’яка експонента

// ROI (днів) — від мін до макс по рівнях
export const ROI_MIN = 6.0;
export const ROI_MAX = 11.0;

// ===== helpers =====
const round2 = (n: number) => Math.round(n * 100) / 100;

// Лінійна інтерполяція ROI між рівнями
export function roiDaysAtLevel(level: number): number {
  const i = Math.max(1, Math.min(LEVELS, level)) - 1;
  const t = i / (LEVELS - 1);
  return round2(ROI_MIN + t * (ROI_MAX - ROI_MIN));
}

// Ціна апґрейду до КОНКРЕТНОГО рівня (Lk)
export function priceAtLevel(level: number): number {
  const idx = Math.max(0, Math.min(LEVELS - 1, level - 1));
  return Math.round(PRICE_BASE * Math.pow(PRICE_GROWTH, idx));
}

// Дохід на рівні (mgp/год) — з ціни та ROI
export function incomePerHourAtLevel(level: number): number {
  const price = priceAtLevel(level);
  const roiDays = roiDaysAtLevel(level);
  const perHour = price / (roiDays * 24);
  return round2(perHour);
}

// Побудова повного списку дефів для CraftPanel
export function buildCraftItems(): CraftItem[] {
  return Array.from({ length: LEVELS }, (_, i) => {
    const level = i + 1;
    return {
      level,
      name: `Артефакт L${level}`,
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

// Невелика надбавка від «престижів» (опціонально)
export function mgpPrestigeMult(prestiges: number): number {
  const mult = 1 + 0.10 * Math.max(0, prestiges);
  return Math.min(3.0, mult);
}
