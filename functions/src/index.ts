// functions/src/index.ts
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();

/**
 * =========================
 * CONFIG
 * =========================
 */

// ✅ Secret з Firebase Secret Manager
const TONAPI_KEY = defineSecret("TONAPI_KEY");

// твій гаманець (отримувач)
const MERCHANT_ADDRESS = "UQAZ4VN0UzqZ570GjM3EpDFszzs4zsw8cD8_YfC0M2ca6N17";

type Tier = "blue" | "purple" | "gold";

// дозволені ціни (TON)
const PRICE_BY_TIER: Record<Tier, number> = {
  blue: 1,
  purple: 2,
  gold: 3,
};

type PurchaseIntent = {
  userId: string;
  name: string;
  tier: Tier;
  title: string;
  priceTon: number;
  to: string;
  comment: string; // mt|<uid>|<tier>|<nonce>
  status: "pending" | "confirmed" | "rejected" | "expired";
  createdAt: FirebaseFirestore.Timestamp;
  clientTs?: number;

  // server fields
  txHash?: string;
  confirmedAt?: FirebaseFirestore.Timestamp;

  // ✅ idempotency: збережемо виданий лут
  grantedLevel?: number;
  grantedItemKey?: string; // наприклад "loot_level_12"
  grantedAt?: FirebaseFirestore.Timestamp;
};

type TonTx = {
  hash: string;
  in_msg?: {
    destination?: { address?: string };
    value?: string; // nanoton
    message?: string;
    payload?: unknown;
    decoded_body?: unknown;
  };
};

function tonToNanoBigInt(ton: number): bigint {
  // ціни 1/2/3 => точно і без float
  return BigInt(ton) * 1_000_000_000n;
}

// Простий стабільний хеш (FNV-1a 32-bit) -> 0..2^32-1
function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h >>> 0;
}

function pickDeterministic<T>(arr: T[], seed: string): T {
  const h = fnv1a32(seed);
  return arr[h % arr.length];
}

async function tonApiGet<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`https://tonapi.io${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TonAPI error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

/**
 * TonAPI може віддавати "comment" не тільки в in_msg.message.
 * Тому пробуємо кілька місць.
 */
function pickCommentFromTx(tx: TonTx): string {
  const msg: any = tx?.in_msg ?? {};

  const m = msg.message;
  if (typeof m === "string" && m.trim()) return m.trim();

  const p = msg.payload;
  if (typeof p === "string" && p.trim()) return p.trim();

  // decoded_body може бути об’єктом з text/comment
  const d: any = msg.decoded_body;
  const dText = d?.text;
  if (typeof dText === "string" && dText.trim()) return dText.trim();

  const dComment = d?.comment;
  if (typeof dComment === "string" && dComment.trim()) return dComment.trim();

  return "";
}

/**
 * Знаходимо транзакцію серед ВХІДНИХ транзакцій мерчанта:
 * - value == price (nanoton)
 * - comment збігається (exact або includes)
 *
 * ⚠️ НЕ перевіряємо destination == merchantAddress,
 * бо TonAPI інколи віддає destination в іншому форматі/полі,
 * а ми і так читаємо transactions саме merchant акаунта.
 */
async function findMatchingTx(
  merchantAddress: string,
  comment: string,
  priceTon: number,
  apiKey: string
): Promise<{ tx: TonTx | null; scanned: number; samples: Array<{ hash: string; value: string; comment: string }> }> {
  const nanoExpected = tonToNanoBigInt(priceTon);
  const want = comment.trim();

  const data = await tonApiGet<{ transactions: TonTx[] }>(
    `/v2/blockchain/accounts/${merchantAddress}/transactions?limit=100`,
    apiKey
  );

  const txs = data.transactions || [];
  const samples: Array<{ hash: string; value: string; comment: string }> = [];

  for (const tx of txs) {
    const msg = tx.in_msg;
    if (!msg) continue;

    const value = msg.value ? BigInt(msg.value) : 0n;
    if (value !== nanoExpected) continue;

    const got = pickCommentFromTx(tx);
    samples.push({
      hash: tx.hash,
      value: String(msg.value ?? ""),
      comment: got,
    });

    if (got === want || (got && got.includes(want))) {
      return { tx, scanned: txs.length, samples };
    }
  }

  return { tx: null, scanned: txs.length, samples };
}

/**
 * callable:
 * client -> "checkTonPayment"
 *
 * input: { intentId }
 */
export const checkTonPayment = onCall(
  {
    region: "europe-west1",
    secrets: [TONAPI_KEY],
    timeoutSeconds: 30,
    cors: true,
  },
  async (request) => {
    const auth = request.auth;
    if (!auth?.uid) throw new HttpsError("unauthenticated", "Not authenticated");
    const uid = auth.uid;

    const data = (request.data ?? {}) as { intentId?: string };
    const intentId = String(data.intentId || "").trim();
    if (!intentId) throw new HttpsError("invalid-argument", "intentId required");

    const intentRef = db.collection("purchase_intents_v1").doc(intentId);

    logger.info("checkTonPayment:start", { uid, intentId });

    // 1) зчитали intent
    const snap = await intentRef.get();
    if (!snap.exists) throw new HttpsError("not-found", "Intent not found");

    const intent = snap.data() as PurchaseIntent;

    logger.info("checkTonPayment:intent", {
      status: intent.status,
      tier: intent.tier,
      priceTon: intent.priceTon,
      to: intent.to,
      comment: intent.comment,
      userId: intent.userId,
    });

    // перевірка власника
    if (intent.userId !== uid) throw new HttpsError("permission-denied", "Not your intent");

    // якщо вже не pending — повертаємо як є (і level, якщо є)
    if (intent.status !== "pending") {
      logger.info("checkTonPayment:already_not_pending", {
        status: intent.status,
        grantedLevel: intent.grantedLevel ?? null,
      });
      return { status: intent.status, level: intent.grantedLevel ?? undefined };
    }

    // базові анти-підміна перевірки
    if (intent.to !== MERCHANT_ADDRESS) {
      logger.warn("checkTonPayment:rejected_wrong_to", {
        intentTo: intent.to,
        merchant: MERCHANT_ADDRESS,
      });
      await intentRef.update({ status: "rejected" });
      return { status: "rejected", message: "Wrong recipient address" };
    }

    if (PRICE_BY_TIER[intent.tier] !== intent.priceTon) {
      logger.warn("checkTonPayment:rejected_wrong_price", {
        tier: intent.tier,
        intentPrice: intent.priceTon,
        expected: PRICE_BY_TIER[intent.tier],
      });
      await intentRef.update({ status: "rejected" });
      return { status: "rejected", message: "Wrong price" };
    }

    const apiKey = TONAPI_KEY.value();
    if (!apiKey) throw new HttpsError("failed-precondition", "TONAPI_KEY secret not set");

    // 2) шукаємо оплату в TON
    const lookup = await findMatchingTx(MERCHANT_ADDRESS, intent.comment, intent.priceTon, apiKey);

    logger.info("checkTonPayment:ton_scan", {
      scanned: lookup.scanned,
      matchesForAmount: lookup.samples.length,
      // покажемо максимум 3 приклади коментарів для цього amount (щоб не засмічувати логи)
      sample: lookup.samples.slice(0, 3),
    });

    if (!lookup.tx) {
      logger.info("checkTonPayment:pending_no_match");
      return { status: "pending" };
    }

    const tx = lookup.tx;

    logger.info("checkTonPayment:matched", {
      txHash: tx.hash,
      gotComment: pickCommentFromTx(tx),
      value: tx.in_msg?.value ?? "",
    });

    // 3) визначаємо лут ДЕТЕРМІНОВАНО (щоб не “скакало” при повторних викликах)
    const levelByTier: Record<Tier, number[]> = {
      blue: [1, 2, 3, 4, 5],
      purple: [10, 11, 12, 13, 14],
      gold: [44, 45, 46, 47, 48],
    };

    const levels = levelByTier[intent.tier];
    const level = pickDeterministic(levels, `${intentId}:${tx.hash}:${intent.tier}`);
    const itemKey = `loot_level_${level}`;

    // 4) атомарно: confirmed + grant (тільки 1 раз!) + audit
    const result = await db.runTransaction(async (t) => {
      const fresh = await t.get(intentRef);
      if (!fresh.exists) throw new HttpsError("not-found", "Intent not found");

      const cur = fresh.data() as PurchaseIntent;

      if (cur.status !== "pending") {
        return {
          status: cur.status,
          level: cur.grantedLevel ?? undefined,
          didWrite: false,
        };
      }

      // якщо раптом grant уже був — не інкрементимо вдруге
      if (typeof cur.grantedLevel === "number" && cur.grantedItemKey) {
        t.update(intentRef, {
          status: "confirmed",
          txHash: cur.txHash || tx.hash,
          confirmedAt: cur.confirmedAt || admin.firestore.FieldValue.serverTimestamp(),
        });
        return { status: "confirmed", level: cur.grantedLevel, didWrite: false };
      }

      t.update(intentRef, {
        status: "confirmed",
        txHash: tx.hash,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        grantedLevel: level,
        grantedItemKey: itemKey,
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // inventory increment (server-grant)
      const itemRef = db.collection("users_v1").doc(uid).collection("inventory_v1").doc(itemKey);
      t.set(
        itemRef,
        {
          kind: "loot_level",
          level,
          qty: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // audit (idempotent doc id = intentId)
      const eventRef = db.collection("events_v1").doc(intentId);
      t.set(
        eventRef,
        {
          userId: uid,
          type: "chest_confirmed",
          intentId,
          tier: intent.tier,
          priceTon: intent.priceTon,
          level,
          txHash: tx.hash,
          ts: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { status: "confirmed", level, didWrite: true };
    });

    logger.info("checkTonPayment:done", {
      status: result.status,
      level: result.level ?? null,
      didWrite: (result as any).didWrite ?? null,
    });

    return { status: result.status, level: result.level };
  }
);

/* =========================================================
 * ✅ FRIENDS / REFERRALS + TASKS
 * ========================================================= */

type TaskKey =
  | "tiktok"
  | "facebook"
  | "instagram"
  | "twitter"
  | "youtube"
  | "vk"
  | "telegram"
  | "site";

const TASK_REWARD: Record<TaskKey, number> = {
  tiktok: 5_000,
  facebook: 5_000,
  instagram: 5_000,
  twitter: 5_000,
  youtube: 5_000,
  vk: 5_000,
  telegram: 5_000,
  site: 100_000,
};

function assertTaskKey(x: unknown): x is TaskKey {
  return (
    x === "tiktok" ||
    x === "facebook" ||
    x === "instagram" ||
    x === "twitter" ||
    x === "youtube" ||
    x === "vk" ||
    x === "telegram" ||
    x === "site"
  );
}

function calcReferralReward(refCountAfter: number): number {
  // 1 -> 5000, 2 -> 10000, ... 11 -> 5_120_000, 12+ -> 5_120_000
  const base = 5_000;
  const cap = 5_120_000;

  if (!Number.isFinite(refCountAfter) || refCountAfter <= 0) return base;

  if (refCountAfter >= 11) return cap;

  // 5000 * 2^(n-1)
  const mul = 2 ** (refCountAfter - 1);
  const val = base * mul;
  return val >= cap ? cap : val;
}

function safeStr(x: any, max = 64): string {
  const s = String(x ?? "").trim();
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max);
}

/**
 * ✅ TASKS: claimTaskReward
 * - Нараховує MGP за таск 1 раз на акаунт.
 * - Зберігає tasksCompleted[] у users_v1/{uid}
 * - Пише balanceReason, balanceUpdatedAt
 */
export const claimTaskReward = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 20,
    cors: true,
  },
  async (request) => {
    const auth = request.auth;
    if (!auth?.uid) throw new HttpsError("unauthenticated", "Not authenticated");
    const uid = auth.uid;

    const data = (request.data ?? {}) as { task?: unknown };
    const task = data.task;

    if (!assertTaskKey(task)) {
      throw new HttpsError("invalid-argument", "Invalid task key");
    }

    const amount = TASK_REWARD[task];
    const userRef = db.collection("users_v1").doc(uid);
    const eventRef = db.collection("events_v1").doc(`task_${uid}_${task}`);

    const out = await db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      const cur = snap.exists ? (snap.data() as any) : {};
      const prevBal = typeof cur.balance === "number" && Number.isFinite(cur.balance) ? cur.balance : 0;

      const done: string[] = Array.isArray(cur.tasksCompleted) ? cur.tasksCompleted : [];
      if (done.includes(task)) {
        return { ok: true, message: "Already claimed" };
      }

      const nextDone = [...done, task];

      t.set(
        userRef,
        {
          tasksCompleted: nextDone,
          balance: prevBal + amount,
          balanceReason: `task:${task}`,
          balanceUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      t.set(
        eventRef,
        {
          userId: uid,
          type: "task_reward",
          task,
          amount,
          ts: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { ok: true, message: `+${amount} MGP` };
    });

    logger.info("claimTaskReward:done", { uid, task, out });
    return out;
  }
);

/**
 * ✅ REFERRALS: registerReferral
 * Вхід: { referrerUid, referrerName? }
 *
 * - Реферал може бути записаний ТІЛЬКИ 1 раз для користувача.
 * - Нарахування йде рефереру: reward = 5000 * 2^(n-1), cap 5_120_000 після 11-го.
 * - Пише у реферера: refCount, recentRefs[], balance+, balanceReason
 * - Пише у реферала: referredBy, referredAt
 */
export const registerReferral = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 20,
    cors: true,
  },
  async (request) => {
    const auth = request.auth;
    if (!auth?.uid) throw new HttpsError("unauthenticated", "Not authenticated");
    const uid = auth.uid;

    const data = (request.data ?? {}) as { referrerUid?: string; referrerName?: string };
    const referrerUid = String(data.referrerUid ?? "").trim();
    const referrerName = safeStr(data.referrerName ?? "", 64);

    if (!referrerUid) throw new HttpsError("invalid-argument", "referrerUid required");
    if (referrerUid === uid) return { ok: false, message: "Self-referral blocked" };

    const userRef = db.collection("users_v1").doc(uid);
    const refRef = db.collection("users_v1").doc(referrerUid);

    const eventId = `ref_${referrerUid}_${uid}`;
    const eventRef = db.collection("events_v1").doc(eventId);

    const res = await db.runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      const userData: any = userSnap.exists ? userSnap.data() : {};

      // якщо реф уже був — нічого не робимо
      if (userData?.referredBy) {
        return { ok: true, message: "Already referred" };
      }

      const refSnap = await t.get(refRef);
      if (!refSnap.exists) {
        return { ok: false, message: "Referrer not found" };
      }

      const refData: any = refSnap.data() || {};
      const prevRefCount =
        typeof refData.refCount === "number" && Number.isFinite(refData.refCount) ? refData.refCount : 0;

      const nextRefCount = Math.max(0, Math.floor(prevRefCount)) + 1;
      const reward = calcReferralReward(nextRefCount);

      const prevBal =
        typeof refData.balance === "number" && Number.isFinite(refData.balance) ? refData.balance : 0;

      const nowMs = Date.now();

      // recent refs (cap 20)
      const prevRecent: any[] = Array.isArray(refData.recentRefs) ? refData.recentRefs : [];
      const nextRecent = [
        {
          id: uid,
          name: referrerName ? "" : "", // залишимо пустим — ім'я реферала краще оновлювати з профілю (фронт)
          at: nowMs,
        },
        ...prevRecent.filter((x) => String(x?.id ?? "") !== uid),
      ].slice(0, 20);

      // 1) записуємо у реферала: referredBy
      t.set(
        userRef,
        {
          referredBy: referrerUid,
          referredAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 2) рефереру: refCount + баланс
      t.set(
        refRef,
        {
          refCount: nextRefCount,
          recentRefs: nextRecent,
          balance: prevBal + reward,
          balanceReason: `referral:${nextRefCount}`,
          balanceUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 3) event (idempotent by doc id)
      t.set(
        eventRef,
        {
          userId: referrerUid,
          type: "referral_reward",
          fromUserId: uid,
          reward,
          refCountAfter: nextRefCount,
          ts: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { ok: true, reward, refCountAfter: nextRefCount };
    });

    logger.info("registerReferral:done", { uid, referrerUid, res });
    return res;
  }
);
