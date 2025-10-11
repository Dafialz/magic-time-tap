// src/systems/bosses.ts
export type BossTier = 1 | 2 | 3 | 4 | 5 | 6;

export type BossDef = {
  tier: BossTier;
  level: number;
  name: string;
  baseHP: number;
  epochBonus: number;
  durationSec: number;      // скільки триває бій (таймер)
  fleeCooldownSec: number;  // кулдаун на повтор у випадку поразки
};

export const BOSSES: BossDef[] = [
  { tier: 1, level: 10, name: "Привид Забуття",       baseHP: 2_500,          epochBonus: 1.00, durationSec: 30, fleeCooldownSec: 10 },
  { tier: 2, level: 20, name: "Хранитель Піраміди",   baseHP: 75_000,         epochBonus: 1.10, durationSec: 35, fleeCooldownSec: 12 },
  { tier: 3, level: 30, name: "Алхімічний Джин",      baseHP: 2_000_000,      epochBonus: 1.20, durationSec: 40, fleeCooldownSec: 14 },
  { tier: 4, level: 40, name: "Повелитель Порталів",  baseHP: 60_000_000,     epochBonus: 1.35, durationSec: 45, fleeCooldownSec: 16 },
  { tier: 5, level: 50, name: "Хаосний Астрал",       baseHP: 1_800_000_000,  epochBonus: 1.50, durationSec: 50, fleeCooldownSec: 18 },
  // 6+ далі масштабуємо з формул:
];

export function getBossByTier(tier: BossTier): BossDef | undefined {
  const found = BOSSES.find(b => b.tier === tier);
  if (found) return found;
  // для 6+ генеруємо процедурно
  const t = Math.max(6, tier);
  const level = t * 10;
  const baseHP = Math.floor(1_800_000_000 * Math.pow(2.2, t - 5)); // різкіше зростання
  const epochBonus = 1.5 + 0.1 * (t - 5);
  const durationSec = 50 + 2 * (t - 5);
  const fleeCooldownSec = 18 + (t - 5);
  return {
    tier: t as BossTier,
    level,
    name: `Лорд Мультивсесвіту ${t}`,
    baseHP,
    epochBonus,
    durationSec,
    fleeCooldownSec,
  };
}

export function calcBossHP(baseHP: number, epochBonus: number, prestiges: number) {
  return Math.floor(baseHP * epochBonus * Math.pow(1.25, prestiges));
}

export function calcRewards(tier: number, prestiges: number) {
  const ceMult = 1.05 + 0.05 * tier + 0.02 * prestiges;
  const mmDrop = Math.round(50 * Math.pow(1.8, tier - 1) * (1 + 0.2 * prestiges));
  const artifactChance = Math.min(0.05 + 0.02 * tier + 0.01 * prestiges, 0.5);
  return { ceMult, mmDrop, artifactChance };
}
