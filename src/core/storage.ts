// src/core/storage.ts
const KEY = "magic-time-save-v2"; // не змінюємо ключ — сейв не зітреться

export const SAVE_SLOTS = 20;

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

  // нове: валюта MGP та сітка 4×5 (20 слотів)
  mgp?: number;
  craftSlots?: number[]; // довжина 20, значення 0..50

  // інвентар артефактів і скіни
  artifacts?: ArtifactInstance[];
  equippedArtifactIds?: string[]; // до 3 шт
  ownedSkins?: string[];          // id куплених скінів
  equippedSkinId?: string | null; // активний скін
};

// ---- helpers ----
function makeDefaultSlots(): number[] {
  return Array(SAVE_SLOTS).fill(0);
}
function normalizeSlots(arr: any): number[] {
  const out = makeDefaultSlots();
  if (Array.isArray(arr)) {
    for (let i = 0; i < Math.min(arr.length, SAVE_SLOTS); i++) {
      const v = Number(arr[i]) || 0;
      // рівень у межах 0..50
      out[i] = Math.max(0, Math.min(50, v));
    }
  }
  return out;
}

function migrateState(data: any): SaveState | null {
  if (!data || typeof data !== "object") return null;
  const s = data as SaveState;

  // Додаємо відсутні поля за замовчуванням (м'яка міграція)
  if (typeof s.mgp !== "number") s.mgp = 0;
  if (!Array.isArray(s.craftSlots)) s.craftSlots = makeDefaultSlots();
  else s.craftSlots = normalizeSlots(s.craftSlots);

  // Решту полів не чіпаємо — лишаємо як є
  return s;
}

export function loadState(): SaveState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrateState(parsed);
  } catch {
    return null;
  }
}

let saveTimer: number | undefined;
export function scheduleSave(state: SaveState) {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      // Перед записом гарантуємо валідні поля
      const payload: SaveState = {
        ...state,
        lastSeenAt: Date.now(),
        mgp: typeof state.mgp === "number" ? state.mgp : 0,
        craftSlots: normalizeSlots(state.craftSlots),
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {}
  }, 200);
}

export function wipeSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
