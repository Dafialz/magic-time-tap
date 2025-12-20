// functions/src/index.ts
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

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

// дозволені ціни (TON)
const PRICE_BY_TIER: Record<Tier, number> = {
  blue: 1,
  purple: 2,
  gold: 3,
};

type Tier = "blue" | "purple" | "gold";

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
    // h *= 16777619 (через зсуви, щоб було швидко)
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
 * Знаходимо транзакцію (вхідні транзакції мерчанта):
 * - destination == MERCHANT_ADDRESS
 * - value == price (nanoton)
 * - message == intent.comment
 */
async function findMatchingTx(
  merchantAddress: string,
  comment: string,
  priceTon: number,
  apiKey: string
): Promise<TonTx | null> {
  const nanoExpected = tonToNanoBigInt(priceTon);

  const data = await tonApiGet<{ transactions: TonTx[] }>(
    `/v2/blockchain/accounts/${merchantAddress}/transactions?limit=50`,
    apiKey
  );

  for (const tx of data.transactions || []) {
    const msg = tx.in_msg;
    if (!msg) continue;

    const to = msg.destination?.address ?? "";
    const text = msg.message ?? "";
    const value = msg.value ? BigInt(msg.value) : 0n;

    if (to === merchantAddress && value === nanoExpected && text === comment) {
      return tx;
    }
  }

  return null;
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

    // 1) зчитали intent
    const snap = await intentRef.get();
    if (!snap.exists) throw new HttpsError("not-found", "Intent not found");

    const intent = snap.data() as PurchaseIntent;

    // перевірка власника
    if (intent.userId !== uid) throw new HttpsError("permission-denied", "Not your intent");

    // якщо вже не pending — повертаємо як є (і level, якщо є)
    if (intent.status !== "pending") {
      return { status: intent.status, level: intent.grantedLevel ?? undefined };
    }

    // базові анти-підміна перевірки
    if (intent.to !== MERCHANT_ADDRESS) {
      await intentRef.update({ status: "rejected" });
      return { status: "rejected" };
    }

    if (PRICE_BY_TIER[intent.tier] !== intent.priceTon) {
      await intentRef.update({ status: "rejected" });
      return { status: "rejected" };
    }

    const apiKey = TONAPI_KEY.value();
    if (!apiKey) throw new HttpsError("failed-precondition", "TONAPI_KEY secret not set");

    // 2) шукаємо оплату в TON
    const tx = await findMatchingTx(MERCHANT_ADDRESS, intent.comment, intent.priceTon, apiKey);
    if (!tx) return { status: "pending" };

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

      // якщо вже confirmed/не pending — нічого не робимо
      if (cur.status !== "pending") {
        return {
          status: cur.status,
          level: cur.grantedLevel ?? undefined,
          didWrite: false,
        };
      }

      // якщо раптом grant уже був записаний (наприклад, попередній виклик встиг) — теж нічого не інкрементимо
      if (typeof cur.grantedLevel === "number" && cur.grantedItemKey) {
        // але можна ще раз записати confirmed поля, якщо їх нема
        t.update(intentRef, {
          status: "confirmed",
          txHash: cur.txHash || tx.hash,
          confirmedAt: cur.confirmedAt || admin.firestore.FieldValue.serverTimestamp(),
        });
        return { status: "confirmed", level: cur.grantedLevel, didWrite: false };
      }

      // 4.1 confirm intent + store grant fields (ключ до ідемпотентності)
      t.update(intentRef, {
        status: "confirmed",
        txHash: tx.hash,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        grantedLevel: level,
        grantedItemKey: itemKey,
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4.2 inventory increment (server-grant)
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

      // 4.3 audit (ідемпотентно — doc id = intentId)
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

    return { status: result.status, level: result.level };
  }
);
