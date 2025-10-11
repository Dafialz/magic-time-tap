// src/systems/events.ts
export type MeteorConfig = {
  activeSecs: number;      // тривалість бафа
  minSpawnSec: number;     // мінімальний інтервал появи
  maxSpawnSec: number;     // максимальний інтервал появи
  mult: number;            // множник заробітку під бафом
};

export const GOLDEN_METEOR: MeteorConfig = {
  activeSecs: 10,
  minSpawnSec: 25,
  maxSpawnSec: 45,
  mult: 10,
};

// Допоміжне: наступний час появи (сек) у діапазоні
export function nextMeteorIn(cfg: MeteorConfig) {
  const span = cfg.maxSpawnSec - cfg.minSpawnSec;
  return cfg.minSpawnSec + Math.floor(Math.random() * (span + 1));
}
