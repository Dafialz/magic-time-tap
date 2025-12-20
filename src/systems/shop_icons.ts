// src/systems/shop_icons.ts
// ===== Magic Time — Shop & Craft icons =====
// Абсолютні шляхи з /public: /shop_icons/...

export const BLUE_ICONS: string[] = [
  "/shop_icons/SapphireValorMedal1.png",
  "/shop_icons/SapphireHonorCoin2.png",
  "/shop_icons/FrostGloryMedal3.png",
  "/shop_icons/AzureLaurelMedal4.png",
  "/shop_icons/AzureSunCoin5.png",
  "/shop_icons/AzureValorMedal6.png",
  "/shop_icons/SapphireHonorCoin7.png",
  "/shop_icons/GlacialGloryMedal8.png",
  "/shop_icons/SapphireLaurelMedal9.png",
  "/shop_icons/GlacialSunCoin20.png",
  "/shop_icons/AzureValorMedal21.png",
  "/shop_icons/GlacialHonorCoin22.png",
  "/shop_icons/CeruleanGloryMedal23.png",
  "/shop_icons/AzureLaurelMedal24.png",
  "/shop_icons/GlacialValorMedal26.png",
  "/shop_icons/FrostHonorCoin27.png",
  "/shop_icons/SapphireGloryMedal28.png",
  "/shop_icons/AzureLaurelMedal29.png",
  "/shop_icons/CeruleanSunCoin30.png",
  "/shop_icons/FrostHonorCoin32.png",
  "/shop_icons/AzureGloryMedal33.png",
  "/shop_icons/AzureSunCoin15.png",
  "/shop_icons/AzureValorMedal16.png",
  "/shop_icons/GlacialHonorCoin17.png",
  "/shop_icons/GlacialGloryMedal18.png",
  "/shop_icons/SapphireLaurelMedal19.png",
];

export const PURPLE_ICONS: string[] = [
  "/shop_icons/RoyalHonorCoin42.png",
  "/shop_icons/GlacialSunCoin10.png",
  "/shop_icons/CeruleanValorMedal11.png",
  "/shop_icons/SapphireHonorCoin12.png",
  "/shop_icons/SapphireGloryMedal13.png",
  "/shop_icons/SapphireLaurelMedal14.png",
  "/shop_icons/CeruleanSunCoin25.png",
  "/shop_icons/FrostValorMedal31.png",
  "/shop_icons/VioletLaurelMedal34.png",
  "/shop_icons/ArcaneSunCoin35.png",
  "/shop_icons/AmethystValorMedal36.png",
  "/shop_icons/AmethystHonorCoin37.png",
  "/shop_icons/MysticGloryMedal38.png",
  "/shop_icons/AmethystLaurelMedal39.png",
  "/shop_icons/ArcaneSunCoin40.png",
  "/shop_icons/ArcaneValorMedal41.png",
  "/shop_icons/ArcaneGloryMedal43.png",
];

export const GOLD_ICONS: string[] = [
  "/shop_icons/GoldenLaurelMedal44.png",
  "/shop_icons/SunCoin45.png",
  "/shop_icons/GildedValorMedal46.png",
  "/shop_icons/GoldenHonorCoin47.png",
  "/shop_icons/SolarGloryMedal48.png",
  "/shop_icons/GoldenLaurelMedal49.png",
  "/shop_icons/SunCoin50.png",
];

/** Старий список (може бути корисний для превʼю магазину), але НЕ для level->icon */
export const ICONS_IN_ORDER: string[] = [...BLUE_ICONS, ...PURPLE_ICONS, ...GOLD_ICONS];

/** Витягаємо level з "...NN.png" */
function levelFromPath(path: string): number | null {
  const m = path.match(/(\d+)\.png$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * ✅ ГОЛОВНЕ: мапа level -> icon, щоб level=14 завжди давав саме "...14.png"
 * Це виправляє баг "фіолетовий сундук показує синю іконку".
 */
export const ICON_BY_LEVEL: Record<number, string> = (() => {
  const map: Record<number, string> = {};
  for (const p of ICONS_IN_ORDER) {
    const lvl = levelFromPath(p);
    if (!lvl) continue;
    map[lvl] = p;
  }
  return map;
})();

/**
 * ✅ Правильна функція:
 * Дати шлях до іконки для конкретного level (наприклад 14, 48).
 * Якщо рівня нема в мапі — fallback на стару логіку по колу.
 */
export function iconByLevel(level: number): string {
  const lvl = Math.floor(level);
  if (!Number.isFinite(lvl) || lvl <= 0) return "";
  if (ICON_BY_LEVEL[lvl]) return ICON_BY_LEVEL[lvl];

  // fallback (на випадок якщо зʼявляться рівні без файлів)
  if (!ICONS_IN_ORDER.length) return "";
  const idx = Math.max(1, lvl) - 1;
  return ICONS_IN_ORDER[idx % ICONS_IN_ORDER.length];
}

/** Зручно для магазину: повертає масив іконок заданої довжини. */
export function iconsForShop(count = 50): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) out.push(iconByLevel(i));
  return out;
}

/**
 * (Опційно) визначення тиру по level-номеру
 * Це може бути корисно якщо захочеш фарбувати UI за рівнем.
 */
export function tierByLevel(level: number): "blue" | "purple" | "gold" | "unknown" {
  const lvl = Math.floor(level);
  if (!Number.isFinite(lvl) || lvl <= 0) return "unknown";
  if (BLUE_ICONS.some((p) => p.endsWith(`${lvl}.png`))) return "blue";
  if (PURPLE_ICONS.some((p) => p.endsWith(`${lvl}.png`))) return "purple";
  if (GOLD_ICONS.some((p) => p.endsWith(`${lvl}.png`))) return "gold";
  return "unknown";
}
