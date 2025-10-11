// src/systems/crafting.ts
import { ARTIFACTS, getArtifactById } from "./artifacts";

export type Rarity = "common" | "rare" | "epic" | "legendary";
export const rarityOrder: Rarity[] = ["common", "rare", "epic", "legendary"];

export function nextRarity(r: Rarity): Rarity | null {
  const i = rarityOrder.indexOf(r);
  if (i < 0 || i === rarityOrder.length - 1) return null;
  return rarityOrder[i + 1];
}

// Рахуємо в інвентарі скільки предметів кожної рідкості
export function countByRarity(inv: { id: string; level: number }[]) {
  const map: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
  for (const a of inv) {
    const meta = getArtifactById(a.id);
    if (!meta) continue;
    map[meta.rarity as Rarity]++;
  }
  return map;
}

// Повертає новий random id цільової рідкості з урахуванням відкритого тиру
export function rollByRarity(target: Rarity, maxTier: number): string | null {
  const pool = ARTIFACTS.filter(a => a.rarity === target && a.tier <= maxTier);
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx].id;
}
