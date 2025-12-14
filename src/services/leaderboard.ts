// src/services/leaderboard.ts
// Реальний лідерборд через Firestore (опціонально).
// Якщо Firebase не налаштований — функції тихо нічого не роблять.

export type LBEntry = { name: string; score: number };

let _inited = false;
let _app: any = null;
let _db: any = null;

function env() {
  return ((import.meta as any)?.env ?? {}) as Record<string, string>;
}

/**
 * Мінімальний набір для ініціалізації Firebase.
 * (appId не завжди критичний для Firestore, але часто потрібен у реальних конфігах,
 * тому підхоплюємо його якщо є)
 */
function hasFirebaseEnv() {
  const e = env();
  return !!(e.VITE_FB_API_KEY && e.VITE_FB_PROJECT_ID);
}

async function ensureFirebase() {
  if (_db) return _db;
  if (_inited) return _db; // вже пробували ініт — повторно не спамимо
  _inited = true;

  if (!hasFirebaseEnv()) return null;

  try {
    // динамічні імпорти
    const appMod: any = await import("firebase/app");
    const fsMod: any = await import("firebase/firestore");

    const e = env();
    const cfg: any = {
      apiKey: e.VITE_FB_API_KEY,
      projectId: e.VITE_FB_PROJECT_ID,
    };

    // optional (але корисно)
    if (e.VITE_FB_AUTH_DOMAIN) cfg.authDomain = e.VITE_FB_AUTH_DOMAIN;
    if (e.VITE_FB_APP_ID) cfg.appId = e.VITE_FB_APP_ID;
    if (e.VITE_FB_STORAGE_BUCKET) cfg.storageBucket = e.VITE_FB_STORAGE_BUCKET;
    if (e.VITE_FB_MESSAGING_SENDER_ID) cfg.messagingSenderId = e.VITE_FB_MESSAGING_SENDER_ID;
    if (e.VITE_FB_MEASUREMENT_ID) cfg.measurementId = e.VITE_FB_MEASUREMENT_ID;

    const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(cfg);
    const db = fsMod.getFirestore(app);

    _app = app;
    _db = db;
    return db;
  } catch {
    // якщо щось пішло не так — дозволимо повторну спробу після reload
    _db = null;
    _app = null;
    return null;
  }
}

/**
 * ВАЖЛИВО: попередня версія робила id тільки з [a-z0-9_-],
 * через що кириличні/emoji імена перетворювались у "-" і всі перезаписували один документ.
 * Тут робимо docId, який зберігає unicode (Firestore це дозволяє), лише прибираємо "/" і керуючі.
 */
export function nameToId(name: string) {
  const raw = (name || "guest").trim().toLowerCase();

  // прибираємо слеші, бо Firestore doc id не може містити "/"
  // і прибираємо керуючі символи
  const safe = raw
    .replace(/\//g, "_")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();

  // на випадок якщо ім'я стало пустим
  const base = safe.length ? safe : "guest";

  // обмеження по довжині (щоб не було дуже довгих docId)
  return base.slice(0, 64);
}

export async function upsertScore(userId: string, name: string, score: number): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    const fs: any = await import("firebase/firestore");
    const ref = fs.doc(fs.collection(db, "leaderboard_v1"), userId);

    await fs.setDoc(
      ref,
      {
        name: (name || userId || "guest").trim(),
        score: Math.max(0, Math.floor(score) || 0),
        ts: fs.serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // no-op
  }
}

export function subscribeTopN(n: number, cb: (rows: LBEntry[]) => void): () => void {
  let unsub: any = () => {};

  (async () => {
    try {
      const db = await ensureFirebase();
      if (!db) return;

      const fs: any = await import("firebase/firestore");
      const q = fs.query(
        fs.collection(db, "leaderboard_v1"),
        fs.orderBy("score", "desc"),
        fs.limit(Math.max(1, Math.floor(n) || 100))
      );

      unsub = fs.onSnapshot(
        q,
        (snap: any) => {
          const list: LBEntry[] = snap.docs.map((d: any) => {
            const data = d.data() || {};
            return { name: data.name || d.id, score: Number(data.score) || 0 };
          });
          cb(list);
        },
        () => {
          // якщо snapshot падає — не ламаємо UI
        }
      );
    } catch {
      // no-op
    }
  })();

  return () => {
    try {
      if (typeof unsub === "function") unsub();
    } catch {
      // no-op
    }
  };
}

export async function getTopN(n: number): Promise<LBEntry[]> {
  try {
    const db = await ensureFirebase();
    if (!db) return [];

    const fs: any = await import("firebase/firestore");
    const q = fs.query(
      fs.collection(db, "leaderboard_v1"),
      fs.orderBy("score", "desc"),
      fs.limit(Math.max(1, Math.floor(n) || 100))
    );

    const snap = await fs.getDocs(q);
    return snap.docs.map((d: any) => {
      const data = d.data() || {};
      return { name: data.name || d.id, score: Number(data.score) || 0 };
    });
  } catch {
    return [];
  }
}
