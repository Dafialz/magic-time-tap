// src/systems/economy.ts
// Економіка для крафт-сітки: ROI 5→10 днів, g=1.20.
// Ціна рівня = ROI_days * 24 * income_per_hour * PRICE_SCALE.

export type CraftItem = {
  level: number;
  name: string;
  income_per_hour_mgp: number; // дохід слота на цьому рівні
  roi_days: number;            // окупність у днях
  price_mgp: number;           // ціна апґрейду ДО цього рівня
};

// Базові константи
export const GROWTH = 1.20;   // множник доходу між рівнями
export const INCOME_L1 = 1;   // L1 = 1 mgp/год
export const ROI_MIN = 5;     // L1 окупається ~5 днів
export const ROI_MAX = 10;    // L50 окупається ~10 днів

// Підвищений масштаб цін (дорогі рівні). Підкручуй для балансу.
export const PRICE_SCALE = 10;

// Рефанд при продажі через "$"
export const SELL_REFUND = 0.70;

const NAMES: string[] = [
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

const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** ROI (в днях) для рівня: лінійно 5 → 10 */
export function roiDaysAtLevel(level: number): number {
  const i = Math.max(1, Math.min(50, level)) - 1; // 0..49
  const t = i / 49;
  return round3(ROI_MIN + t * (ROI_MAX - ROI_MIN));
}

/** Дохід (mgp/год) на даному рівні */
export function incomePerHourAtLevel(level: number): number {
  const i = Math.max(1, Math.min(50, level)) - 1;
  return round3(INCOME_L1 * Math.pow(GROWTH, i));
}

/** Ціна апґрейду до конкретного рівня */
export function priceAtLevel(level: number): number {
  return round2(roiDaysAtLevel(level) * 24 * incomePerHourAtLevel(level) * PRICE_SCALE);
}

/** Повна таблиця 50 рівнів */
export function buildCraftItems(): CraftItem[] {
  return Array.from({ length: 50 }, (_, idx) => {
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
 * 0 → ×1.00 (~60 днів), 1 → ×1.10 (~55 днів), 2 → ×1.20 (~50 днів) … до ×3.00 (~20 днів).
 */
export function mgpPrestigeMult(prestiges: number): number {
  const mult = 1 + 0.10 * Math.max(0, prestiges);
  return Math.min(3.0, mult);
}
