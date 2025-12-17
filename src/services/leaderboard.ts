// src/services/leaderboard.ts
// Firestore: leaderboard + users/admin helpers.
// Якщо Firebase не налаштований — функції тихо нічого не роблять.

export type LBEntry = { name: string; score: number };

export type UserProfile = {
  name?: string;
  score?: number;
  lastSeenAt?: any; // serverTimestamp (Firestore Timestamp)
  banned?: boolean;
  banReason?: string;
  bannedAt?: any; // serverTimestamp
  bannedBy?: string;
  // можна розширювати далі (inventory, purchases, flags...)
};

let _inited = false;
let _app: any = null;
let _db: any = null;

function env() {
  return ((import.meta as any)?.env ?? {}) as Record<string, string>;
}

/**
 * Мінімальний набір для ініціалізації Firebase.
 * Для Firestore достатньо apiKey + projectId. (authDomain бажано)
 */
function hasFirebaseEnv() {
  const e = env();
  return !!(e.VITE_FB_API_KEY && e.VITE_FB_PROJECT_ID);
}

async function ensureFirebase() {
  if (_db) return _db;
  if (_inited) return _db;
  _inited = true;

  if (!hasFirebaseEnv()) return null;

  try {
    const appMod: any = await import("firebase/app");
    const fsMod: any = await import("firebase/firestore");

    const e = env();

    // ✅ КРАЩЕ: підставляємо optional поля, щоб конфіг був “нормальний”
    // (інколи без authDomain/appId бувають дивні кейси в деяких оточеннях)
    const cfg: any = {
      apiKey: e.VITE_FB_API_KEY,
      projectId: e.VITE_FB_PROJECT_ID,
    };
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
    _db = null;
    _app = null;
    return null;
  }
}

/** Доступ до db (для інших сервісів/адмінки) */
export async function getDb() {
  return await ensureFirebase();
}

/**
 * ВАЖЛИВО: docId не може містити "/"
 */
export function nameToId(name: string) {
  const raw = (name || "guest").trim().toLowerCase();
  const safe = raw.replace(/\//g, "_").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  const base = safe.length ? safe : "guest";
  return base.slice(0, 64);
}

/* =========================
   LEADERBOARD
========================= */

/**
 * ✅ B: кожен апдейт лідерборду
 * паралельно “heartbeat-ить” users_v1/{userId}.
 * => адмінка (яка читає users_v1) одразу бачить гравців.
 */
export async function upsertScore(userId: string, name: string, score: number): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    const fs: any = await import("firebase/firestore");

    const cleanName = String((name || userId || "guest").trim()).slice(0, 64);
    const cleanScore = Math.max(0, Math.floor(score) || 0);

    const lbRef = fs.doc(db, "leaderboard_v1", userId);
    const userRef = fs.doc(db, "users_v1", userId);

    // ✅ атомарніше: одним батчем пишемо у 2 колекції
    const batch = fs.writeBatch(db);

    batch.set(
      lbRef,
      {
        name: cleanName,
        score: cleanScore,
        ts: fs.serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(
      userRef,
      {
        name: cleanName,
        score: cleanScore,
        lastSeenAt: fs.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
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
        () => {}
      );
    } catch {}
  })();

  return () => {
    try {
      if (typeof unsub === "function") unsub();
    } catch {}
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

/* =========================
   USERS (профіль, бан, адмінка)
========================= */

/** Оновити профіль юзера (name/score/lastSeenAt/...) */
export async function upsertUserProfile(userId: string, patch: Partial<UserProfile>): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    const fs: any = await import("firebase/firestore");
    const ref = fs.doc(db, "users_v1", userId);

    await fs.setDoc(ref, patch, { merge: true });
  } catch {}
}

/** Підписка на users_v1/{userId} */
export function subscribeUser(userId: string, cb: (profile: UserProfile | null) => void): () => void {
  let unsub: any = () => {};

  (async () => {
    try {
      const db = await ensureFirebase();
      if (!db) {
        cb(null);
        return;
      }

      const fs: any = await import("firebase/firestore");
      const ref = fs.doc(db, "users_v1", userId);

      unsub = fs.onSnapshot(
        ref,
        (snap: any) => cb(snap.exists() ? (snap.data() as UserProfile) : null),
        () => cb(null)
      );
    } catch {
      cb(null);
    }
  })();

  return () => {
    try {
      if (typeof unsub === "function") unsub();
    } catch {}
  };
}

/** Адмін: бан/анбан */
export async function setUserBan(
  userId: string,
  banned: boolean,
  banReason: string,
  bannedBy: string
): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    const fs: any = await import("firebase/firestore");
    const ref = fs.doc(db, "users_v1", userId);

    await fs.setDoc(
      ref,
      {
        banned: !!banned,
        banReason: banned ? String(banReason || "").slice(0, 200) : "",
        bannedBy: banned ? String(bannedBy || "").slice(0, 64) : "",
        bannedAt: banned ? fs.serverTimestamp() : fs.deleteField(),
      },
      { merge: true }
    );
  } catch {}
}

/** Адмін: список останніх активних (може попросити індекс по lastSeenAt) */
export async function getRecentUsers(limit = 50): Promise<Array<{ id: string; data: UserProfile }>> {
  try {
    const db = await ensureFirebase();
    if (!db) return [];

    const fs: any = await import("firebase/firestore");
    const lim = Math.max(1, Math.min(200, Math.floor(limit) || 50));

    try {
      const q = fs.query(fs.collection(db, "users_v1"), fs.orderBy("lastSeenAt", "desc"), fs.limit(lim));
      const snap = await fs.getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, data: (d.data() || {}) as UserProfile }));
    } catch {
      // fallback (якщо orderBy потребує індексу/поле ще не всюди є)
      const q2 = fs.query(fs.collection(db, "users_v1"), fs.limit(lim));
      const snap2 = await fs.getDocs(q2);
      return snap2.docs.map((d: any) => ({ id: d.id, data: (d.data() || {}) as UserProfile }));
    }
  } catch {
    return [];
  }
}

/** Адмін: топ по score з users_v1 (альтернатива leaderboard) */
export async function getTopUsers(limit = 100): Promise<Array<{ id: string; data: UserProfile }>> {
  try {
    const db = await ensureFirebase();
    if (!db) return [];

    const fs: any = await import("firebase/firestore");
    const lim = Math.max(1, Math.min(200, Math.floor(limit) || 100));

    try {
      const q = fs.query(fs.collection(db, "users_v1"), fs.orderBy("score", "desc"), fs.limit(lim));
      const snap = await fs.getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, data: (d.data() || {}) as UserProfile }));
    } catch {
      // fallback
      const q2 = fs.query(fs.collection(db, "users_v1"), fs.limit(lim));
      const snap2 = await fs.getDocs(q2);
      return snap2.docs.map((d: any) => ({ id: d.id, data: (d.data() || {}) as UserProfile }));
    }
  } catch {
    return [];
  }
}
