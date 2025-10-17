// src/systems/economy.ts
// Економіка для merge-сітки: 37 рівнів, ROI 5→10 днів, g=1.20.
// Модель: 2 предмети однакового рівня = 1 предмет наступного рівня.
// Орієнтована тривалість шляху до L37 ≈ 9 місяців без донату.

export type CraftItem = {
  level: number;
  name: string;
  income_per_hour_mgp: number; // дохід слота на цьому рівні
  roi_days: number;            // окупність у днях
  price_mgp: number;           // ціна апґрейду ДО цього рівня
};

// Константи
export const LEVELS = 37;       // ціль: до L37 ~270 днів
export const GROWTH = 1.20;     // множник доходу між рівнями
export const INCOME_L1 = 1;     // L1 = 1 mgp/год
export const ROI_MIN = 5;       // L1 окупається за ~5 днів
export const ROI_MAX = 10;      // L37 — ~10 днів
export const PRICE_SCALE = 9;   // масштаб цін (підібрано під merge-економіку)
export const SELL_REFUND = 0.70;

// Назви предметів (можна залишити з попереднього списку)
const NAMES: string[] = [
  "Time Grain", "Chrono Spark", "Mini Dial", "Quartz Sand", "Tick Module",
  "Nanosand", "Chrono Powder", "Tiny Spiral", "Wavewatch", "Second Stream",
  "Time Sickle", "Moment Blade", "Glass Core", "Pulse Geode", "Resonator I",
  "Resonator II", "Resonator III", "Resonator IV", "Resonator V", "Delta Crystal",
  "Omega Crystal", "Sigma Crystal", "Epoch Coil", "Cesium Isotope", "Rotor V",
  "Rotor VI", "Rotor VII", "Rotor VIII", "Rotor IX", "Rotor X",
  "Echo Beacon", "Clockheart", "Chrono Lens", "Quantum Dust", "Temporal Turbine",
  "Heart of Time", "Eternal Engine"
];

const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** ROI (в днях) для рівня: лінійно 5 → 10 */
export function roiDaysAtLevel(level: number): number {
  const i = Math.max(1, Math.min(LEVELS, level)) - 1;
  const t = i / (LEVELS - 1);
  return round3(ROI_MIN + t * (ROI_MAX - ROI_MIN));
}

/** Дохід (mgp/год) на даному рівні */
export function incomePerHourAtLevel(level: number): number {
  const i = Math.max(1, Math.min(LEVELS, level)) - 1;
  return round3(INCOME_L1 * Math.pow(GROWTH, i));
}

/**
 * Ціна апґрейду до рівня з урахуванням merge:
 * Щоб зробити L+1, потрібно 2 предмети L → тому реальна вартість = 2 × попередня.
 */
export function priceAtLevel(level: number): number {
  if (level <= 1) return round2(roiDaysAtLevel(1) * 24 * incomePerHourAtLevel(1) * PRICE_SCALE);
  const base = roiDaysAtLevel(level) * 24 * incomePerHourAtLevel(level) * PRICE_SCALE;
  return round2(base * 2); // подвоюємо через merge 2→1
}

/** Повна таблиця 37 рівнів */
export function buildCraftItems(): CraftItem[] {
  return Array.from({ length: LEVELS }, (_, idx) => {
    const level = idx + 1;
    return {
      level,
      name: NAMES[idx] ?? `L${level}`,
      income_per_hour_mgp: incomePerHourAtLevel(level),
      roi_days: roiDaysAtLevel(level),
      price_mgp: priceAtLevel(level),
    };
  });
}

/**
 * Мультиплікатор доходу MGP від престижів:
 * 0 → ×1.00 (~9 міс), 1 → ×1.10 (~8.2 міс), 2 → ×1.20 (~7.5 міс) … до ×3.00 (~3 міс).
 */
export function mgpPrestigeMult(prestiges: number): number {
  const mult = 1 + 0.10 * Math.max(0, prestiges);
  return Math.min(3.0, mult);
}
