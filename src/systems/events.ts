// src/systems/events.ts

export type MeteorConfig = {
  /** Тривалість бафа у секундах */
  activeSecs: number;
  /** Мінімальний інтервал появи метеора (сек) */
  minSpawnSec: number;
  /** Максимальний інтервал появи метеора (сек) */
  maxSpawnSec: number;
  /** Множник заробітку під бафом */
  mult: number;
};

/** Золотий метеор: x10 на 10 секунд, спавн раз на ~25–45 сек */
export const GOLDEN_METEOR: MeteorConfig = {
  activeSecs: 10,
  minSpawnSec: 25,
  maxSpawnSec: 45,
  mult: 10,
} as const;

/** Випадкове ціле з включними межами */
function randInt(min: number, max: number): number {
  // гарантуємо коректні межі навіть якщо переплутають параметри
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** Допоміжне: час до наступного метеора у секундах для заданої конфігурації */
export function nextMeteorIn(cfg: MeteorConfig): number {
  return randInt(cfg.minSpawnSec, cfg.maxSpawnSec);
}
