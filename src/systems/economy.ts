// ===== Magic Time — Economy (shop + craft) =====

export const SHOP_COUNT = 50 as const;

// Базова ціна першого айтема та плавне експоненційне зростання
export const PRICE_BASE = 500;
export const PRICE_GROWTH = 1.28;

// Середня окупність одного предмета
export const ROI_DAYS = 7.5;
export const ROI_HOURS = ROI_DAYS * 24;

/** Ціна айтема з індексом 1..50 (і водночас ціна апґрейду до рівня L). */
export function shopPriceAt(index: number): number {
  const i = Math.max(1, Math.min(SHOP_COUNT, Math.floor(index)));
  return Math.round(PRICE_BASE * Math.pow(PRICE_GROWTH, i - 1));
}

/** Синонім до shopPriceAt: ціна апґрейду до рівня L. */
export function priceForLevel(level: number): number {
  return shopPriceAt(level);
}

/** Доходність рівня L у mgp/год при ROI = 7.5 днів. */
export function incomePerHourAtLevel(level: number): number {
  const price = priceForLevel(level);
  return price / ROI_HOURS;
}

/** Скільки отримаємо за продаж рівня L (70% від вартості рівня). */
export function sellValueForLevel(level: number): number {
  return Math.round(priceForLevel(level) * 0.7 * 100) / 100;
}

/** Престиж-множник для доходу MGP (проста лінійка, щоб все компілювалось). */
export function mgpPrestigeMult(prestiges: number): number {
  // Можеш підкрутити на свій смак — головне, що функція є та експортиться.
  return 1 + 0.1 * Math.max(0, Math.floor(prestiges));
}

// ==== Довідкові типи/генератор каталогу (зручно для CraftPanel) ====
export type CraftItem = {
  level: number;
  name: string;
  price_mgp: number;              // ціна апґрейду до цього рівня
  income_per_hour_mgp: number;    // mgp/год для даного рівня
  roi_days: number;               // ~7.5
};

/** Побудувати масив з 50 рівнів для крафту/апґрейдів. */
export function buildCraftItems(): CraftItem[] {
  const items: CraftItem[] = [];
  for (let l = 1; l <= SHOP_COUNT; l++) {
    const price = priceForLevel(l);
    const incomeH = incomePerHourAtLevel(l);
    const roiDays = price / (incomeH * 24);

    items.push({
      level: l,
      name: `Artifact L${l}`,
      price_mgp: price,
      income_per_hour_mgp: incomeH,
      roi_days: roiDays,
    });
  }
  return items;
}
