// src/core/storage.ts
const KEY = "magic-time-save-v2"; // не змінюємо ключ — сейв не зітреться

export type ArtifactInstance = {
  id: string;
  level: number; // коли випадає дублікат — піднімаємо рівень
};

export type SaveState = {
  ce: number;
  mm: number;
  totalEarned: number;
  clickPower: number;
  autoPerSec: number;
  farmMult: number;
  hc: number;
  level: number;
  prestiges: number;
  upgrades: { id: string; level: number }[];

  // офлайн-доход
  lastSeenAt?: number;

  // нове: інвентар артефактів і скіни
  artifacts?: ArtifactInstance[];
  equippedArtifactIds?: string[]; // до 3 шт
  ownedSkins?: string[];          // id куплених скінів
  equippedSkinId?: string | null; // активний скін
};

export function loadState(): SaveState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data === "object") return data as SaveState;
    return null;
  } catch {
    return null;
  }
}

let saveTimer: number | undefined;
export function scheduleSave(state: SaveState) {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      const payload: SaveState = { ...state, lastSeenAt: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {}
  }, 200);
}

export function wipeSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
