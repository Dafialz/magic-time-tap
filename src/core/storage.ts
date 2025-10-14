// src/core/storage.ts
const KEY = "magic-time-save-v2"; // не змінюємо — сейв не ламаємо

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

  // інвентар / скіни
  artifacts?: ArtifactInstance[];
  equippedArtifactIds?: string[]; // до 3 шт
  ownedSkins?: string[];
  equippedSkinId?: string | null;

  // НОВЕ: економіка MGP / крафт
  mgp?: number;                // баланс MGP
  craftSlots?: number[];       // 21 чисел (0..50)
  // на майбутнє: зберігати кумулятивний мультиплікатор — але зараз його рахуємо з prestiges
  mgpPrestigeMult?: number;
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
