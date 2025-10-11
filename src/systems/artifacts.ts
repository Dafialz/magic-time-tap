// src/systems/artifacts.ts
export type Artifact = {
  id: string;
  name: string;
  tier: number;     // з якого тиру босів може випадати
  rarity: "common" | "rare" | "epic" | "legendary";
  bonus: {
    clickMult?: number; // +0.10 = +10%
    autoMult?: number;
    farmMult?: number;
    allMult?: number;   // множить і click/auto/farm
  };
};

export const ARTIFACTS: Artifact[] = [
  { id: "time_ring",      name: "Перстень Часу",        tier: 1, rarity: "common",    bonus: { clickMult: 0.10 } },
  { id: "sand_core",      name: "Ядро Піску",           tier: 1, rarity: "common",    bonus: { autoMult: 0.08 } },
  { id: "chrono_compass", name: "Хроном-компас",        tier: 1, rarity: "rare",      bonus: { farmMult: 0.05 } },
  { id: "pharaoh_eye",    name: "Око Фараона",          tier: 2, rarity: "rare",      bonus: { clickMult: 0.15 } },
  { id: "legion_clock",   name: "Легіонний Годинник",   tier: 2, rarity: "epic",      bonus: { farmMult: 0.10 } },
  { id: "druid_knot",     name: "Вузол Друїда",         tier: 3, rarity: "rare",      bonus: { autoMult: 0.20 } },
  { id: "portal_shard",   name: "Осколок Порталу",      tier: 4, rarity: "epic",      bonus: { farmMult: 0.25 } },
  { id: "void_star",      name: "Зірка Пустоти",        tier: 5, rarity: "legendary", bonus: { allMult: 0.30 } },
];

// вага для шансів залежно від рідкісності (чим більше — тим частіше)
const RARITY_WEIGHT = { common: 60, rare: 28, epic: 10, legendary: 2 };

export function rollArtifactId(maxTier: number): string {
  // доступний пул: артефакти з tier <= maxTier
  const pool = ARTIFACTS.filter(a => a.tier <= maxTier);
  const weights = pool.map(a => RARITY_WEIGHT[a.rarity]);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i].id;
  }
  return pool[pool.length - 1].id;
}

export function getArtifactById(id: string): Artifact | undefined {
  return ARTIFACTS.find(a => a.id === id);
}

// Ефективність на рівнях: base * (1 + 0.5*(lvl-1))
export function artifactEffectMultiplier(base: number, level: number): number {
  return base * (1 + 0.5 * Math.max(0, level - 1));
}

export type AggregatedBonus = { click: number; auto: number; farm: number };

export function aggregateArtifacts(ids: string[], levels: Record<string, number>): AggregatedBonus {
  let click = 0, auto = 0, farm = 0;
  for (const id of ids) {
    const art = getArtifactById(id);
    if (!art) continue;
    const lvl = levels[id] ?? 1;
    const { bonus } = art;
    if (bonus.allMult) {
      const eff = artifactEffectMultiplier(bonus.allMult, lvl);
      click += eff; auto += eff; farm += eff;
    }
    if (bonus.clickMult) click += artifactEffectMultiplier(bonus.clickMult, lvl);
    if (bonus.autoMult)  auto  += artifactEffectMultiplier(bonus.autoMult,  lvl);
    if (bonus.farmMult)  farm  += artifactEffectMultiplier(bonus.farmMult,  lvl);
  }
  return { click, auto, farm };
}
