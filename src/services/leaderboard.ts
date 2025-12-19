// src/services/leaderboard.ts
// Firestore: leaderboard + users/admin helpers.
// Працює з Firebase Auth (anonymous).
// Якщо Firebase не налаштований — функції тихо нічого не роблять.

export type LBEntry = { name: string; score: number };

export type UserProfile = {
  name?: string;
  score?: number;
  lastSeenAt?: any; // Firestore Timestamp
  banned?: boolean;
  banReason?: string;
  bannedAt?: any; // Firestore Timestamp
  bannedBy?: string;

  // extra meta (tg)
  tgId?: number | null;
  tgUsername?: string;
  tgFirst?: string;
  tgLast?: string;

  // (опційно) баланс / службові поля, якщо захочеш
  balance?: number;
  balanceReason?: string;
  balanceUpdatedAt?: any;
  balanceBy?: string;
};

export type CheatReport = {
  id: string;
  userId: string;        // auth.uid репортера (і це ж target user)
  kind: string;          // напр "SCORE_SPIKE" / "FAST_TAPS" / "CLIENT_TAMPER"
  reason: string;        // текст
  score: number;         // поточний score на момент репорту
  clientTs: number;      // Date.now()
  at?: any;              // serverTimestamp
  // optional meta
  name?: string;
  tgId?: number | null;
  tgUsername?: string;
};

let _inited = false;
let _app: any = null;
let _db: any = null;

// ===== Auth cache =====
let _authInitStarted = false;
let _authUid: string | null = null;

function env() {
  return ((import.meta as any)?.env ?? {}) as Record<string, string>;
}

/* =========================
   Firebase init helpers
========================= */

function hasFirebaseEnv() {
  const e = env();
  return !!(e.VITE_FB_API_KEY && e.VITE_FB_PROJECT_ID);
}

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

    // нормальний конфіг (optional поля підставляємо якщо є)
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

    _app = app;
    _db = fsMod.getFirestore(app);
    return _db;
  } catch {
    _db = null;
    _app = null;
    return null;
  }
}

export async function getDb() {
  return ensureFirebase();
}

/* =========================
   Firebase Auth (Anonymous)
========================= */

export async function ensureAuth(): Promise<string | null> {
  try {
    if (!hasAuthEnv()) return null;

    await ensureFirebase();
    if (!_app) return null;

    const authMod: any = await import("firebase/auth");
    const auth = authMod.getAuth(_app);

    if (auth.currentUser?.uid) {
      _authUid = auth.currentUser.uid;
      return _authUid;
    }

    if (_authInitStarted) {
      await new Promise((r) => setTimeout(r, 150));
      return auth.currentUser?.uid || _authUid;
    }

    _authInitStarted = true;

    try {
      await authMod.signInAnonymously(auth);
    } catch {
      // no-op (інколи вже залогінений)
    }

    const uid = await new Promise<string | null>((resolve) => {
      const unsub = authMod.onAuthStateChanged(auth, (u: any) => {
        if (u?.uid) {
          try {
            unsub();
          } catch {}
          resolve(String(u.uid));
        }
      });
      setTimeout(() => {
        try {
          unsub();
        } catch {}
        resolve(auth.currentUser?.uid ?? null);
      }, 2500);
    });

    _authUid = uid;
    return uid;
  } catch {
    return null;
  }
}

export async function getAuthUid(): Promise<string | null> {
  try {
    if (_authUid) return _authUid;
    if (!hasAuthEnv()) return null;

    await ensureFirebase();
    if (!_app) return null;

    const authMod: any = await import("firebase/auth");
    const auth = authMod.getAuth(_app);
    const uid = auth?.currentUser?.uid ? String(auth.currentUser.uid) : null;
    if (uid) _authUid = uid;
    return uid;
  } catch {
    return null;
  }
}

/* =========================
   LEADERBOARD
========================= */

export async function upsertScore(userId: string, name: string, score: number): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    await ensureAuth();

    const fs: any = await import("firebase/firestore");

    const cleanName = String(name || "Guest").trim().slice(0, 64);
    const cleanScore = Math.max(0, Math.floor(score) || 0);

    const lbRef = fs.doc(db, "leaderboard_v1", userId);
    const userRef = fs.doc(db, "users_v1", userId);

    const batch = fs.writeBatch(db);

    batch.set(lbRef, { name: cleanName, score: cleanScore, ts: fs.serverTimestamp() }, { merge: true });

    // heartbeat для адмінки + гри
    batch.set(userRef, { name: cleanName, score: cleanScore, lastSeenAt: fs.serverTimestamp() }, { merge: true });

    await batch.commit();
  } catch {}
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
          cb(
            snap.docs.map((d: any) => ({
              name: d.data()?.name || d.id,
              score: Number(d.data()?.score) || 0,
            }))
          );
        },
        () => {}
      );
    } catch {}
  })();

  return () => {
    try {
      unsub();
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
    return snap.docs.map((d: any) => ({
      name: d.data()?.name || d.id,
      score: Number(d.data()?.score) || 0,
    }));
  } catch {
    return [];
  }
}

/* =========================
   USERS
========================= */

export async function upsertUserProfile(userId: string, patch: Partial<UserProfile>): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    await ensureAuth();

    const fs: any = await import("firebase/firestore");

    const data: any = { ...patch };

    // конвертуємо "__SERVER_TIMESTAMP__" якщо десь використаєш
    if (data.lastSeenAt === "__SERVER_TIMESTAMP__") data.lastSeenAt = fs.serverTimestamp();
    if (data.bannedAt === "__SERVER_TIMESTAMP__") data.bannedAt = fs.serverTimestamp();
    if (data.balanceUpdatedAt === "__SERVER_TIMESTAMP__") data.balanceUpdatedAt = fs.serverTimestamp();

    // трішки санітуємо
    if (typeof data.name === "string") data.name = data.name.trim().slice(0, 64);
    if (typeof data.tgUsername === "string") data.tgUsername = data.tgUsername.trim().slice(0, 64);
    if (typeof data.tgFirst === "string") data.tgFirst = data.tgFirst.trim().slice(0, 64);
    if (typeof data.tgLast === "string") data.tgLast = data.tgLast.trim().slice(0, 64);

    await fs.setDoc(fs.doc(db, "users_v1", userId), data, { merge: true });
  } catch {}
}

export function subscribeUser(userId: string, cb: (profile: UserProfile | null) => void): () => void {
  let unsub: any = () => {};

  (async () => {
    try {
      const db = await ensureFirebase();
      if (!db) return cb(null);

      const fs: any = await import("firebase/firestore");
      unsub = fs.onSnapshot(
        fs.doc(db, "users_v1", userId),
        (snap: any) => cb(snap.exists() ? (snap.data() as UserProfile) : null),
        () => cb(null)
      );
    } catch {
      cb(null);
    }
  })();

  return () => {
    try {
      unsub();
    } catch {}
  };
}

/** Адмінка: останні активні */
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

/** Адмінка: топ по score з users_v1 */
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

/* =========================
   AUTO-REPORT (cheat_reports_v1)
========================= */

/**
 * Юзер створює репорт "від себе" (Rules: request.resource.data.userId == request.auth.uid).
 * Адмін потім дивиться репорти і банить вручну.
 */
export async function reportCheat(input: {
  userId: string;
  kind: string;
  reason?: string;
  score?: number;
  name?: string;
  tgId?: number | null;
  tgUsername?: string;
}): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    await ensureAuth();
    const uid = await getAuthUid();
    if (!uid) return;

    // важливо: юзер може репортити тільки себе
    if (input.userId !== uid) return;

    const fs: any = await import("firebase/firestore");

    const kind = String(input.kind || "").trim().slice(0, 32);
    const reason = String(input.reason || "").trim().slice(0, 300);
    const score = Math.max(0, Math.floor(Number(input.score || 0)) || 0);

    if (!kind) return;

    const ref = fs.doc(fs.collection(db, "cheat_reports_v1")); // auto id

    await fs.setDoc(ref, {
      userId: uid,
      kind,
      reason,
      score,
      clientTs: Date.now(),
      at: fs.serverTimestamp(),
      name: input.name ? String(input.name).trim().slice(0, 64) : "",
      tgId: typeof input.tgId === "number" ? input.tgId : (input.tgId ?? null),
      tgUsername: input.tgUsername ? String(input.tgUsername).trim().slice(0, 64) : "",
    });
  } catch {}
}

/** Адмін: останні репорти (читання дозволено тільки isAdmin() в Rules) */
export async function getCheatReports(limit = 50): Promise<CheatReport[]> {
  try {
    const db = await ensureFirebase();
    if (!db) return [];

    await ensureAuth();

    const fs: any = await import("firebase/firestore");
    const lim = Math.max(1, Math.min(200, Math.floor(limit) || 50));

    // сортуємо по "at desc" (якщо індексу нема, буде fallback)
    try {
      const q = fs.query(fs.collection(db, "cheat_reports_v1"), fs.orderBy("at", "desc"), fs.limit(lim));
      const snap = await fs.getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) })) as CheatReport[];
    } catch {
      const q2 = fs.query(fs.collection(db, "cheat_reports_v1"), fs.limit(lim));
      const snap2 = await fs.getDocs(q2);
      return snap2.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) })) as CheatReport[];
    }
  } catch {
    return [];
  }
}

/** Адмін: live підписка на репорти */
export function subscribeCheatReports(limit: number, cb: (rows: CheatReport[]) => void): () => void {
  let unsub: any = () => {};

  (async () => {
    try {
      const db = await ensureFirebase();
      if (!db) return;

      await ensureAuth();

      const fs: any = await import("firebase/firestore");
      const lim = Math.max(1, Math.min(200, Math.floor(limit) || 50));

      // якщо orderBy(at) впаде — зробимо простий limit
      let q: any;
      try {
        q = fs.query(fs.collection(db, "cheat_reports_v1"), fs.orderBy("at", "desc"), fs.limit(lim));
      } catch {
        q = fs.query(fs.collection(db, "cheat_reports_v1"), fs.limit(lim));
      }

      unsub = fs.onSnapshot(
        q,
        (snap: any) => {
          const list = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() || {}) })) as CheatReport[];
          cb(list);
        },
        () => {}
      );
    } catch {}
  })();

  return () => {
    try {
      unsub();
    } catch {}
  };
}

/* =========================
   ADMIN
========================= */

/**
 * Бан/розбан + одразу пишемо:
 * - ban_history_v1 (тільки на BAN)
 * - admin_logs_v1 (на BAN і UNBAN)
 */
export async function setUserBan(userId: string, banned: boolean, reason: string, bannedBy: string): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    await ensureAuth();

    const fs: any = await import("firebase/firestore");

    const userRef = fs.doc(db, "users_v1", userId);
    const banRef = fs.doc(fs.collection(db, "ban_history_v1")); // auto id
    const logRef = fs.doc(fs.collection(db, "admin_logs_v1")); // auto id

    const cleanReason = String(reason || "").slice(0, 200);
    const cleanBy = String(bannedBy || "").slice(0, 128);

    const batch = fs.writeBatch(db);

    // users_v1 update
    batch.set(
      userRef,
      {
        banned: !!banned,
        banReason: banned ? cleanReason : "",
        bannedBy: banned ? cleanBy : "",
        bannedAt: banned ? fs.serverTimestamp() : fs.deleteField(),
      },
      { merge: true }
    );

    // ban history (тільки коли банимо)
    if (banned) {
      batch.set(banRef, {
        userId,
        reason: cleanReason,
        bannedBy: cleanBy,
        at: fs.serverTimestamp(),
      });
    }

    // admin log (і бан, і розбан)
    batch.set(logRef, {
      action: banned ? "BAN" : "UNBAN",
      targetUserId: userId,
      reason: cleanReason,
      by: cleanBy,
      at: fs.serverTimestamp(),
    });

    await batch.commit();
  } catch {}
}

/** Зміна балансу адміном + лог */
export async function adminSetBalance(userId: string, balance: number, reason: string, adminId: string): Promise<void> {
  try {
    const db = await ensureFirebase();
    if (!db) return;

    await ensureAuth();

    const fs: any = await import("firebase/firestore");
    const userRef = fs.doc(db, "users_v1", userId);
    const logRef = fs.doc(fs.collection(db, "admin_logs_v1"));

    const cleanReason = String(reason || "").slice(0, 200);
    const cleanBy = String(adminId || "").slice(0, 128);
    const cleanBalance = Number.isFinite(Number(balance)) ? Number(balance) : 0;

    const batch = fs.writeBatch(db);

    batch.set(
      userRef,
      {
        balance: cleanBalance,
        balanceReason: cleanReason,
        balanceBy: cleanBy,
        balanceUpdatedAt: fs.serverTimestamp(),
      },
      { merge: true }
    );

    batch.set(logRef, {
      action: "SET_BALANCE",
      targetUserId: userId,
      balance: cleanBalance,
      reason: cleanReason,
      by: cleanBy,
      at: fs.serverTimestamp(),
    });

    await batch.commit();
  } catch {}
}
