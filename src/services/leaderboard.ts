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

// Auth cache
let _authInitStarted = false;
let _authUid: string | null = null;

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

/** Для Auth краще мати authDomain (і бажано appId) */
function hasAuthEnv() {
  const e = env();
  return !!(e.VITE_FB_API_KEY && e.VITE_FB_PROJECT_ID && e.VITE_FB_AUTH_DOMAIN);
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
 * Firebase Auth (Anonymous)
 * Повертає UID або null якщо auth не налаштований/не вдалось.
 */
export async function ensureAuth(): Promise<string | null> {
  try {
    // без authDomain краще не стартувати auth взагалі
    if (!hasAuthEnv()) return null;

    // треба, щоб app вже був інітнутий (ensureFirebase робить initializeApp)
    await ensureFirebase();
    if (!_app) return null;

    const authMod: any = await import("firebase/auth");
    const auth = authMod.getAuth(_app);

    // якщо вже є user — забираємо uid
    if (auth?.currentUser?.uid) {
      _authUid = auth.currentUser.uid;
      return _authUid;
    }

    // щоб не запускати 100 разів одночасно
    if (_authInitStarted) {
      // почекаємо трохи, поки підхопиться
      await new Promise((r) => setTimeout(r, 150));
      return auth?.currentUser?.uid || _authUid;
    }

    _authInitStarted = true;

    // 1) логін анонімно
    try {
      await authMod.signInAnonymously(auth);
    } catch {
      // якщо вже залогінений/інші кейси — ок
    }

    // 2) дочекаємось user
    const uid: string | null = await new Promise((resolve) => {
      const unsub = authMod.onAuthStateChanged(auth, (user: any) => {
        if (user?.uid) {
          try { unsub(); } catch {}
          resolve(String(user.uid));
        }
      });
      // fallback timeout
      setTimeout(() => {
        try { unsub(); } catch {}
        resolve(auth?.currentUser?.uid ? String(auth.currentUser.uid) : null);
      }, 2500);
    });

    _authUid = uid;
    return uid;
  } catch {
    return null;
  }
}

/** Просто взяти UID якщо вже є (без sign-in) */
export async function getAuthUid(): Promise<string | null> {
  try {
    if (_authUid) return _authUid;
    if (!hasAuthEnv()) return null;

    await ensureFirebase();
    if (!_app) return null;

    const authMod: any = await import("firebase/auth");
    const auth = authMod.getAuth(_app);
    if (auth?.currentUser?.uid) {
      _authUid = String(auth.currentUser.uid);
      return _authUid;
    }
    return null;
  } catch {
    return null;
  }
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
 *
 * ВАЖЛИВО: якщо ти перейдеш на Auth UID як userId — rules можна зробити:
 * allow update/create тільки якщо request.auth.uid == userId
 */
export async function upsertScore(userId: string, name: string, score: number): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    // ✅ гарантуємо, що в користувача є auth (щоб rules могли спиратись на request.auth.uid)
    // якщо auth не налаштований — просто продовжимо як раніше (але тоді rules будуть слабкі)
    await ensureAuth();

    const fs: any = await import("firebase/firestore");

    const cleanName = String((name || userId || "guest").trim()).slice(0, 64);
    const cleanScore = Math.max(0, Math.floor(score) || 0);

    const lbRef = fs.doc(db, "leaderboard_v1", userId);
    const userRef = fs.doc(db, "users_v1", userId);

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

    // бажано мати auth
    await ensureAuth();

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

    // адмін теж має бути auth-юзером (і rules перевірятимуть request.auth.uid)
    await ensureAuth();

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

    await ensureAuth();

    const fs: any = await import("firebase/firestore");
    const lim = Math.max(1, Math.min(200, Math.floor(limit) || 50));

    try {
      const q = fs.query(fs.collection(db, "users_v1"), fs.orderBy("lastSeenAt", "desc"), fs.limit(lim));
      const snap = await fs.getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, data: (d.data() || {}) as UserProfile }));
    } catch {
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

    await ensureAuth();

    const fs: any = await import("firebase/firestore");
    const lim = Math.max(1, Math.min(200, Math.floor(limit) || 100));

    try {
      const q = fs.query(fs.collection(db, "users_v1"), fs.orderBy("score", "desc"), fs.limit(lim));
      const snap = await fs.getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, data: (d.data() || {}) as UserProfile }));
    } catch {
      const q2 = fs.query(fs.collection(db, "users_v1"), fs.limit(lim));
      const snap2 = await fs.getDocs(q2);
      return snap2.docs.map((d: any) => ({ id: d.id, data: (d.data() || {}) as UserProfile }));
    }
  } catch {
    return [];
  }
}
