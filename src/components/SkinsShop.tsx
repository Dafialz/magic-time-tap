// src/components/SkinsShop.tsx
import React from "react";
import { iconByLevel, BLUE_POOL, PURPLE_POOL, GOLD_POOL } from "../systems/shop_icons";

/* ✅ Пули НЕ дублюємо тут — беремо з shop_icons.ts */

type Tier = "blue" | "purple" | "gold";
type Chest = {
  tier: Tier;
  title: string;
  priceTon: number; // TON
  chestImg: string;
  pool: string[];
  weights: number[];
};

/* ================= i18n (localStorage based) ================= */
type Lang = "en" | "zh" | "hi" | "es" | "ar" | "ru" | "fr";
const LS_LANG_KEY = "mt_lang_v1";
const LANGS: Lang[] = ["en", "zh", "hi", "es", "ar", "ru", "fr"];

function getLang(): Lang {
  try {
    const v = (localStorage.getItem(LS_LANG_KEY) || "").trim() as Lang;
    return LANGS.includes(v) ? v : "en";
  } catch {
    return "en";
  }
}

const I18N: Record<
  Lang,
  {
    title: string;
    payPill: string;
    tonWallet: string;
    hint: string;

    buyFor: (ton: number) => string;

    payModalTitle: string;
    priceLabel: string;
    commentLabel: string;
    dontChange: string;

    openTonkeeper: string;
    checkPayment: string;
    checking: string;
    close: string;

    lootTitleFrom: (chestTitle: string) => string;
    ok: string;

    // statuses / errors
    pendingRestore: string;
    stepOpenAndPay: string;
    createIntentFail: string;

    verifyChecking: string;
    verifyCallFail: string;
    verifyPending: string;

    paymentRejectedOrExpired: string;
    chestNotFound: string;
    unknownStatus: (s: string) => string;

    confirmedGranted: string;
    bannedTitle: string;
    payViaTonkeeperTitle: string;
  }
> = {
  en: {
    title: "Chests",
    payPill: "TON payment → Tonkeeper",
    tonWallet: "TON Wallet",
    hint: "Loot is granted by the server. After paying, press “Check payment”.",
    buyFor: (ton) => `Buy for ${ton} TON`,
    payModalTitle: "Chest payment",
    priceLabel: "Price",
    commentLabel: "Transfer comment",
    dontChange: "Do not change the comment — it’s required for automatic verification.",
    openTonkeeper: "Open Tonkeeper",
    checkPayment: "Check payment",
    checking: "Checking…",
    close: "Close",
    lootTitleFrom: (title) => `Dropped from ${title}:`,
    ok: "OK",
    pendingRestore: "There is an unfinished purchase. If you paid — press “Check payment”.",
    stepOpenAndPay: "Open Tonkeeper and send the transfer. Then press “Check payment”.",
    createIntentFail: "Failed to create intent in Firestore. Check rules for purchase_intents_v1.",
    verifyChecking: "Checking payment on the server…",
    verifyCallFail:
      "Failed to call server verification. Check: (1) firebase/functions in web, (2) region europe-west1, (3) user authenticated.",
    verifyPending: "Payment not found/confirmed yet. If you paid — wait 10–30 sec and try again.",
    paymentRejectedOrExpired: "Payment rejected or expired. Try again.",
    chestNotFound: "Chest not found. Refresh the page.",
    unknownStatus: (s) => `Unknown status: ${s}`,
    confirmedGranted: "Payment confirmed ✅ Reward added to inventory.",
    bannedTitle: "You are banned",
    payViaTonkeeperTitle: "Pay via Tonkeeper",
  },
  zh: {
    title: "宝箱",
    payPill: "TON 支付 → Tonkeeper",
    tonWallet: "TON 钱包",
    hint: "掉落由服务器发放。支付后点击“检查支付”。",
    buyFor: (ton) => `购买：${ton} TON`,
    payModalTitle: "宝箱支付",
    priceLabel: "价格",
    commentLabel: "转账备注",
    dontChange: "不要修改备注 — 自动验证需要它。",
    openTonkeeper: "打开 Tonkeeper",
    checkPayment: "检查支付",
    checking: "检查中…",
    close: "关闭",
    lootTitleFrom: (title) => `来自 ${title} 的掉落：`,
    ok: "好的",
    pendingRestore: "有未完成的购买。如果你已支付 — 点击“检查支付”。",
    stepOpenAndPay: "打开 Tonkeeper 完成转账，然后点击“检查支付”。",
    createIntentFail: "无法在 Firestore 创建 intent。请检查 purchase_intents_v1 的 rules。",
    verifyChecking: "正在服务器上检查支付…",
    verifyCallFail:
      "无法调用服务器验证。检查：(1) web 端 firebase/functions，(2) 区域 europe-west1，(3) 用户已登录。",
    verifyPending: "尚未找到/确认支付。如果已支付 — 等 10–30 秒再试。",
    paymentRejectedOrExpired: "支付被拒绝或已过期。请重试。",
    chestNotFound: "未找到宝箱。请刷新页面。",
    unknownStatus: (s) => `未知状态：${s}`,
    confirmedGranted: "支付已确认 ✅ 奖励已加入背包。",
    bannedTitle: "你已被封禁",
    payViaTonkeeperTitle: "通过 Tonkeeper 支付",
  },
  hi: {
    title: "चेस्ट",
    payPill: "TON भुगतान → Tonkeeper",
    tonWallet: "TON Wallet",
    hint: "लूट सर्वर देता है। भुगतान के बाद “Payment check” दबाएँ।",
    buyFor: (ton) => `${ton} TON में खरीदें`,
    payModalTitle: "चेस्ट भुगतान",
    priceLabel: "कीमत",
    commentLabel: "ट्रांसफर कमेंट",
    dontChange: "कमेंट न बदलें — ऑटो वेरिफिकेशन के लिए जरूरी है।",
    openTonkeeper: "Tonkeeper खोलें",
    checkPayment: "भुगतान जाँचें",
    checking: "जाँच रहे…",
    close: "बंद करें",
    lootTitleFrom: (title) => `${title} से मिला:`,
    ok: "ठीक है",
    pendingRestore: "अधूरा खरीद मौजूद है। अगर आपने भुगतान किया — “भुगतान जाँचें” दबाएँ।",
    stepOpenAndPay: "Tonkeeper खोलें और ट्रांसफर करें। फिर “भुगतान जाँचें” दबाएँ।",
    createIntentFail: "Firestore में intent नहीं बन पाया। purchase_intents_v1 के rules चेक करें।",
    verifyChecking: "सर्वर पर भुगतान जाँच रहे…",
    verifyCallFail:
      "सर्वर वेरिफिकेशन कॉल नहीं हो सका। चेक करें: (1) web पर firebase/functions, (2) region europe-west1, (3) user authenticated.",
    verifyPending: "भुगतान अभी नहीं मिला/कन्फर्म नहीं हुआ। भुगतान किया है तो 10–30 सेकंड बाद फिर से करें।",
    paymentRejectedOrExpired: "भुगतान अस्वीकृत/समाप्त। फिर से कोशिश करें।",
    chestNotFound: "चेस्ट नहीं मिला। पेज रिफ्रेश करें।",
    unknownStatus: (s) => `Unknown status: ${s}`,
    confirmedGranted: "भुगतान कन्फर्म ✅ रिवॉर्ड इन्वेंटरी में जोड़ दिया गया।",
    bannedTitle: "आप बैन हैं",
    payViaTonkeeperTitle: "Tonkeeper से भुगतान",
  },
  es: {
    title: "Cofres",
    payPill: "Pago TON → Tonkeeper",
    tonWallet: "Billetera TON",
    hint: "El botín lo entrega el servidor. Después de pagar, pulsa “Verificar pago”.",
    buyFor: (ton) => `Comprar por ${ton} TON`,
    payModalTitle: "Pago del cofre",
    priceLabel: "Precio",
    commentLabel: "Comentario de la transferencia",
    dontChange: "No cambies el comentario — es necesario para la verificación automática.",
    openTonkeeper: "Abrir Tonkeeper",
    checkPayment: "Verificar pago",
    checking: "Verificando…",
    close: "Cerrar",
    lootTitleFrom: (title) => `Salió del ${title}:`,
    ok: "OK",
    pendingRestore: "Hay una compra sin terminar. Si pagaste — pulsa “Verificar pago”.",
    stepOpenAndPay: "Abre Tonkeeper y realiza la transferencia. Luego pulsa “Verificar pago”.",
    createIntentFail: "No se pudo crear el intent en Firestore. Revisa las rules de purchase_intents_v1.",
    verifyChecking: "Verificando el pago en el servidor…",
    verifyCallFail:
      "No se pudo llamar a la verificación del servidor. Revisa: (1) firebase/functions en web, (2) región europe-west1, (3) usuario autenticado.",
    verifyPending: "Pago aún no encontrado/confirmado. Si pagaste — espera 10–30 s y prueba de nuevo.",
    paymentRejectedOrExpired: "Pago rechazado o expirado. Intenta otra vez.",
    chestNotFound: "Cofre no encontrado. Actualiza la página.",
    unknownStatus: (s) => `Estado desconocido: ${s}`,
    confirmedGranted: "Pago confirmado ✅ Recompensa añadida al inventario.",
    bannedTitle: "Estás bloqueado",
    payViaTonkeeperTitle: "Pagar con Tonkeeper",
  },
  ar: {
    title: "الصناديق",
    payPill: "دفع TON → Tonkeeper",
    tonWallet: "محفظة TON",
    hint: "الغنيمة يمنحها الخادم. بعد الدفع اضغط “التحقق من الدفع”.",
    buyFor: (ton) => `شراء مقابل ${ton} TON`,
    payModalTitle: "دفع الصندوق",
    priceLabel: "السعر",
    commentLabel: "تعليق التحويل",
    dontChange: "لا تغيّر التعليق — مطلوب للتحقق التلقائي.",
    openTonkeeper: "فتح Tonkeeper",
    checkPayment: "التحقق من الدفع",
    checking: "جارِ التحقق…",
    close: "إغلاق",
    lootTitleFrom: (title) => `تم الحصول عليه من ${title}:`,
    ok: "حسنًا",
    pendingRestore: "هناك عملية شراء غير مكتملة. إذا دفعت — اضغط “التحقق من الدفع”.",
    stepOpenAndPay: "افتح Tonkeeper وقم بالتحويل، ثم اضغط “التحقق من الدفع”.",
    createIntentFail: "فشل إنشاء intent في Firestore. تحقق من rules الخاصة بـ purchase_intents_v1.",
    verifyChecking: "نقوم بالتحقق من الدفع على الخادم…",
    verifyCallFail:
      "تعذر استدعاء التحقق من الخادم. تحقق: (1) firebase/functions على الويب، (2) المنطقة europe-west1، (3) المستخدم مسجل الدخول.",
    verifyPending: "لم يتم العثور على الدفع/تأكيده بعد. إذا دفعت — انتظر 10–30 ثانية ثم أعد المحاولة.",
    paymentRejectedOrExpired: "تم رفض الدفع أو انتهت صلاحيته. حاول مرة أخرى.",
    chestNotFound: "الصندوق غير موجود. حدّث الصفحة.",
    unknownStatus: (s) => `حالة غير معروفة: ${s}`,
    confirmedGranted: "تم تأكيد الدفع ✅ تمت إضافة المكافأة إلى المخزون.",
    bannedTitle: "أنت محظور",
    payViaTonkeeperTitle: "الدفع عبر Tonkeeper",
  },
  ru: {
    title: "Сундуки",
    payPill: "Оплата TON → Tonkeeper",
    tonWallet: "TON Wallet",
    hint: "Лут выдаёт сервер. После оплаты нажми “Проверить оплату”.",
    buyFor: (ton) => `Купить за ${ton} TON`,
    payModalTitle: "Оплата сундука",
    priceLabel: "Цена",
    commentLabel: "Комментарий к переводу",
    dontChange: "Не меняй комментарий — он нужен для автоматической проверки.",
    openTonkeeper: "Открыть Tonkeeper",
    checkPayment: "Проверить оплату",
    checking: "Проверяем…",
    close: "Закрыть",
    lootTitleFrom: (title) => `Выпало из ${title}:`,
    ok: "Ок",
    pendingRestore: "Есть незавершённая покупка. Если ты оплатил — нажми “Проверить оплату”.",
    stepOpenAndPay: "Открой Tonkeeper и сделай перевод. Потом нажми “Проверить оплату”.",
    createIntentFail: "Не удалось создать intent в Firestore. Проверь rules для purchase_intents_v1.",
    verifyChecking: "Проверяем оплату на сервере…",
    verifyCallFail:
      "Не удалось вызвать серверную проверку. Проверь: (1) firebase/functions в вебе, (2) регион europe-west1, (3) пользователь авторизован.",
    verifyPending: "Оплата ещё не найдена/не подтверждена. Если оплатил — подожди 10–30 сек и попробуй снова.",
    paymentRejectedOrExpired: "Платёж отклонён или просрочен. Попробуй ещё раз.",
    chestNotFound: "Сундук не найден. Обнови страницу.",
    unknownStatus: (s) => `Неизвестный статус: ${s}`,
    confirmedGranted: "Оплата подтверждена ✅ Награда добавлена в инвентарь.",
    bannedTitle: "Вы заблокированы",
    payViaTonkeeperTitle: "Оплатить через Tonkeeper",
  },
  fr: {
    title: "Coffres",
    payPill: "Paiement TON → Tonkeeper",
    tonWallet: "Portefeuille TON",
    hint: "Le loot est attribué par le serveur. Après paiement, clique sur “Vérifier le paiement”.",
    buyFor: (ton) => `Acheter pour ${ton} TON`,
    payModalTitle: "Paiement du coffre",
    priceLabel: "Prix",
    commentLabel: "Commentaire du virement",
    dontChange: "Ne change pas le commentaire — il est nécessaire pour la vérification automatique.",
    openTonkeeper: "Ouvrir Tonkeeper",
    checkPayment: "Vérifier le paiement",
    checking: "Vérification…",
    close: "Fermer",
    lootTitleFrom: (title) => `Tombé du ${title} :`,
    ok: "OK",
    pendingRestore: "Un achat est en attente. Si tu as payé — clique “Vérifier le paiement”.",
    stepOpenAndPay: "Ouvre Tonkeeper et fais le virement. Ensuite clique “Vérifier le paiement”.",
    createIntentFail: "Impossible de créer l’intent dans Firestore. Vérifie les rules de purchase_intents_v1.",
    verifyChecking: "Vérification du paiement sur le serveur…",
    verifyCallFail:
      "Impossible d’appeler la vérification serveur. Vérifie : (1) firebase/functions web, (2) région europe-west1, (3) utilisateur authentifié.",
    verifyPending: "Paiement pas encore trouvé/confirmé. Si tu as payé — attends 10–30 s et réessaie.",
    paymentRejectedOrExpired: "Paiement rejeté ou expiré. Réessaie.",
    chestNotFound: "Coffre introuvable. Actualise la page.",
    unknownStatus: (s) => `Statut inconnu : ${s}`,
    confirmedGranted: "Paiement confirmé ✅ Récompense ajoutée à l’inventaire.",
    bannedTitle: "Vous êtes banni",
    payViaTonkeeperTitle: "Payer via Tonkeeper",
  },
};

function powerWeights(poolLen: number, k: number): number[] {
  return Array.from({ length: poolLen }, (_, i) => 1 / Math.pow(i + 1, k));
}

/** Витягаємо рівні з імен файлів …NN.png */
function levelsFromFilenames(pool: string[]): number[] {
  const set = new Set<number>();
  for (const p of pool) {
    const m = p.match(/(\d+)\.png$/);
    if (m) set.add(parseInt(m[1], 10));
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * ✅ Гарантуємо правильну іконку саме для цього сундука:
 * спочатку шукаємо "...{level}.png" у пулі сундука,
 * а якщо раптом не знайдено — fallback на iconByLevel().
 */
function iconFromChestAndLevel(chest: Chest, level: number): string {
  const lvl = Math.floor(level);
  if (!Number.isFinite(lvl) || lvl <= 0) return "";
  const wanted = `${lvl}.png`;
  const found = chest.pool.find((p) => p.endsWith(wanted));
  return found || iconByLevel(lvl);
}

/**
 * ✅ Твій гаманець Tonkeeper (отримувач платежу)
 */
const MERCHANT_TON_ADDRESS = "UQAZ4VN0UzqZ570GjM3EpDFszzs4zsw8cD8_YfC0M2ca6N17";

/**
 * ✅ Ціни фікс:
 * blue  = 1 TON
 * purple= 2 TON
 * gold  = 3 TON
 */
const CHESTS: Chest[] = [
  {
    tier: "blue",
    title: "Azure Chest",
    priceTon: 1,
    chestImg: "/chests/AzureChest.png",
    pool: BLUE_POOL,
    weights: powerWeights(BLUE_POOL.length, 1.3),
  },
  {
    tier: "purple",
    title: "Amethyst Chest",
    priceTon: 2,
    chestImg: "/chests/AmethystChest.png",
    pool: PURPLE_POOL,
    weights: powerWeights(PURPLE_POOL.length, 1.55),
  },
  {
    tier: "gold",
    title: "Gilded Chest",
    priceTon: 3,
    chestImg: "/chests/GildedChest.png",
    pool: GOLD_POOL,
    weights: powerWeights(GOLD_POOL.length, 1.8),
  },
];

const LEVELS_BY_TIER: Record<Tier, number[]> = {
  blue: levelsFromFilenames(BLUE_POOL),
  purple: levelsFromFilenames(PURPLE_POOL),
  gold: levelsFromFilenames(GOLD_POOL),
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
void LEVELS_BY_TIER; // (щоб не було warning, якщо тимчасово не використовуєш)

/* ===== Firebase helpers (без окремих файлів) ===== */

function env() {
  return ((import.meta as any)?.env ?? {}) as Record<string, string>;
}

function hasFirebaseEnv() {
  const e = env();
  return !!(e.VITE_FB_API_KEY && e.VITE_FB_PROJECT_ID && e.VITE_FB_AUTH_DOMAIN);
}

async function withFirestore<T>(fn: (db: any, fs: any) => Promise<T>) {
  try {
    if (!hasFirebaseEnv()) return null as any;

    const appMod: any = await import("firebase/app");
    const fsMod: any = await import("firebase/firestore");

    const e = env();
    const cfg = {
      apiKey: e.VITE_FB_API_KEY,
      authDomain: e.VITE_FB_AUTH_DOMAIN,
      projectId: e.VITE_FB_PROJECT_ID,
      appId: e.VITE_FB_APP_ID,
    };

    const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(cfg);
    const db = fsMod.getFirestore(app);
    return await fn(db, fsMod);
  } catch {
    return null as any;
  }
}

async function withCallable<T>(fn: (app: any, functionsMod: any) => Promise<T>) {
  try {
    if (!hasFirebaseEnv()) return null as any;

    const appMod: any = await import("firebase/app");
    const functionsMod: any = await import("firebase/functions");

    const e = env();
    const cfg = {
      apiKey: e.VITE_FB_API_KEY,
      authDomain: e.VITE_FB_AUTH_DOMAIN,
      projectId: e.VITE_FB_PROJECT_ID,
      appId: e.VITE_FB_APP_ID,
    };

    const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(cfg);
    return await fn(app, functionsMod);
  } catch {
    return null as any;
  }
}

/* ===== TON deeplink ===== */

const LOCAL_ID_KEY = "mt_local_id_v1";
const LS_PENDING_PAY_KEY = "mt_pending_ton_purchase_v1";

// ✅ У ТЕБЕ ЗАДЕПЛОЄНО: export const checkTonPayment = ...
const VERIFY_FUNCTION_NAME = "checkTonPayment";
// ✅ ВАЖЛИВО: регіон функції
const FUNCTIONS_REGION = "europe-west1";

function getOrCreateLocalId() {
  try {
    const existing = localStorage.getItem(LOCAL_ID_KEY);
    if (existing) return existing;
    const id = Math.random().toString(16).slice(2) + Date.now().toString(16);
    localStorage.setItem(LOCAL_ID_KEY, id);
    return id;
  } catch {
    return Math.random().toString(16).slice(2);
  }
}

type PendingPay = {
  id: string; // intentId
  tier: Tier;
  title: string;
  priceTon: number;
  createdAtMs: number;
  userId: string;
  comment: string;
  to: string;
};

type VerifyResult =
  | { status: "pending" | "confirmed" | "rejected" | "expired"; level?: number; message?: string }
  | { status?: string; message?: string };

function nanoFromTon(ton: number): string {
  const nano = Math.round(ton * 1_000_000_000);
  return String(nano);
}

function makeNonce(): string {
  return (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + Date.now().toString(16)).slice(
    0,
    32
  );
}

function readPending(): PendingPay | null {
  try {
    const raw = localStorage.getItem(LS_PENDING_PAY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return null;
    if (!p.id || !p.tier || !p.priceTon || !p.userId || !p.comment || !p.to) return null;
    return p as PendingPay;
  } catch {
    return null;
  }
}

function writePending(p: PendingPay | null) {
  try {
    if (!p) localStorage.removeItem(LS_PENDING_PAY_KEY);
    else localStorage.setItem(LS_PENDING_PAY_KEY, JSON.stringify(p));
  } catch {}
}

/** ✅ Android Telegram WebView часто ламається від ton:// (ERR_UNKNOWN_URL_SCHEME) */
function isAndroidWebView(): boolean {
  try {
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    // Telegram Android WebView має "Telegram" у UA
    const isTelegram = /Telegram/i.test(ua) || !!(window as any)?.Telegram?.WebApp;
    return isAndroid && isTelegram;
  } catch {
    return false;
  }
}

function openTonTransfer(opts: { to: string; amountNano: string; text: string }) {
  const to = opts.to;
  const amountNano = opts.amountNano;
  const text = opts.text;

  const deep = `ton://transfer/${encodeURIComponent(to)}?amount=${encodeURIComponent(amountNano)}&text=${encodeURIComponent(
    text
  )}`;

  // ✅ Universal link Tonkeeper: відкриє апку якщо встановлена (і на iOS, і на Android)
  const web = `https://app.tonkeeper.com/transfer/${encodeURIComponent(to)}?amount=${encodeURIComponent(
    amountNano
  )}&text=${encodeURIComponent(text)}`;

  const tg = (window as any)?.Telegram?.WebApp;

  // ✅ ГОЛОВНИЙ FIX: на Android Telegram відкриваємо тільки https (а не ton://)
  if (isAndroidWebView()) {
    try {
      tg?.openLink?.(web, { try_instant_view: false });
      return;
    } catch {}
    try {
      window.open(web, "_blank", "noopener,noreferrer");
      return;
    } catch {}
    try {
      window.location.href = web;
      return;
    } catch {}
    return;
  }

  // iOS / Desktop: пробуємо ton://, якщо не вийшло — https
  try {
    if (tg?.openLink) {
      // на iOS це зазвичай ок
      tg.openLink(deep, { try_instant_view: false });
      return;
    }
  } catch {}

  try {
    window.location.href = deep;
    window.setTimeout(() => {
      try {
        window.location.href = web;
      } catch {
        window.open(web, "_blank", "noopener,noreferrer");
      }
    }, 600);
  } catch {
    window.open(web, "_blank", "noopener,noreferrer");
  }
}

/* ===== Firestore purchase intent ===== */

async function createPurchaseIntent(p: PendingPay, nickname: string) {
  return await withFirestore(async (db, fs) => {
    const ref = fs.doc(db, "purchase_intents_v1", p.id);
    const now = fs.serverTimestamp();

    await fs.setDoc(
      ref,
      {
        userId: p.userId,
        name: nickname,
        tier: p.tier,
        title: p.title,
        priceTon: p.priceTon,
        to: p.to,
        comment: p.comment,
        status: "pending",
        createdAt: now,
        clientTs: Date.now(),
      },
      { merge: false }
    );

    return true as any;
  });
}

/* ===== Cloud Function call ===== */

async function verifyViaFunction(input: { intentId: string }): Promise<VerifyResult | null> {
  return await withCallable(async (app, functionsMod) => {
    const fns = functionsMod.getFunctions(app, FUNCTIONS_REGION);
    const callable = functionsMod.httpsCallable(fns, VERIFY_FUNCTION_NAME);
    const res = await callable({ intentId: input.intentId });
    return (res?.data ?? null) as any;
  });
}

/* ===== компонент ===== */

type Props = {
  userId?: string;
  nickname?: string;
  isBanned?: boolean;

  /** Якщо хочеш одразу “додати в крафт” після підтвердження — лишаємо */
  onLoot?: (payload: { level: number; icon: string; chest: Chest }) => void;
};

export default function SkinsShop(props: Props) {
  const [lang, setLang] = React.useState<Lang>(() => getLang());
  React.useEffect(() => {
    const onLang = (e: any) => {
      const next = String(e?.detail || "").trim() as Lang;
      setLang(LANGS.includes(next) ? next : getLang());
    };
    window.addEventListener("mt_lang", onLang as any);
    return () => window.removeEventListener("mt_lang", onLang as any);
  }, []);
  const t = React.useMemo(() => I18N[lang] ?? I18N.en, [lang]);

  const [openState, setOpenState] = React.useState<{ chest?: Chest; icon?: string }>({});
  const [payState, setPayState] = React.useState<{
    open: boolean;
    pending?: PendingPay;
    step?: "idle" | "sent" | "waiting" | "checking";
    error?: string;
    info?: string;
  }>({ open: false, step: "idle" });

  const effectiveUserId = React.useMemo(() => {
    if (props.userId && props.userId.trim()) return props.userId.trim();
    return `anon_${getOrCreateLocalId()}`;
  }, [props.userId]);

  const effectiveName = React.useMemo(() => {
    const n = props.nickname?.trim();
    if (n) return n;
    return "Guest";
  }, [props.nickname]);

  // Відновлення pending після refresh
  React.useEffect(() => {
    const p = readPending();
    if (!p) return;
    if (p.userId !== effectiveUserId) return;

    setPayState({
      open: true,
      pending: p,
      step: "waiting",
      info: t.pendingRestore,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]);

  const closeLootModal = () => setOpenState({});

  // ✅ FIX: якщо юзер натиснув "Закрити" — вважаємо, що він скасував (очищаємо pending)
  const closePayModal = () => {
    writePending(null);
    setPayState({ open: false, step: "idle" });
  };

  const showLoot = async (chest: Chest, level: number) => {
    // ✅ FIX: іконка завжди відповідає сундуку/level
    const icon = iconFromChestAndLevel(chest, level);

    setOpenState({ chest, icon });

    // UX only
    props.onLoot?.({ level, icon, chest });
  };

  const startPurchase = async (chest: Chest) => {
    if (props.isBanned) return;

    const nonce = makeNonce();
    const comment = `mt|${effectiveUserId}|${chest.tier}|${nonce}`;

    const pending: PendingPay = {
      id: nonce,
      tier: chest.tier,
      title: chest.title,
      priceTon: chest.priceTon,
      createdAtMs: Date.now(),
      userId: effectiveUserId,
      comment,
      to: MERCHANT_TON_ADDRESS,
    };

    writePending(pending);

    setPayState({
      open: true,
      pending,
      step: "sent",
      error: "",
      info: t.stepOpenAndPay,
    });

    createPurchaseIntent(pending, effectiveName).catch(() => {
      setPayState((s) => ({
        ...s,
        error: t.createIntentFail,
      }));
    });

    openTonTransfer({
      to: MERCHANT_TON_ADDRESS,
      amountNano: nanoFromTon(chest.priceTon),
      text: comment,
    });

    setPayState((s) => ({ ...s, step: "waiting" }));
  };

  const checkPaymentAndGrant = async () => {
    const p = payState.pending;
    if (!p) return;

    setPayState((s) => ({
      ...s,
      step: "checking",
      error: "",
      info: t.verifyChecking,
    }));

    const result = await verifyViaFunction({ intentId: p.id }).catch(() => null);

    if (!result || typeof result !== "object") {
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error: t.verifyCallFail,
        info: "",
      }));
      return;
    }

    const status = String((result as any).status || "");
    const message = String((result as any).message || "");

    if (status === "pending") {
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error: "",
        info: message || t.verifyPending,
      }));
      return;
    }

    if (status === "rejected" || status === "expired") {
      // ✅ FIX: це тупик — очищаємо pending
      writePending(null);
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error: message || t.paymentRejectedOrExpired,
        info: "",
      }));
      return;
    }

    if (status !== "confirmed") {
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error: message || t.unknownStatus(status),
        info: "",
      }));
      return;
    }

    const chest = CHESTS.find((c) => c.tier === p.tier);
    if (!chest) {
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error: t.chestNotFound,
        info: "",
      }));
      return;
    }

    const lvl = (result as any).level;
    if (typeof lvl !== "number" || !Number.isFinite(lvl) || lvl <= 0) {
      writePending(null);
      setPayState({ open: false, step: "idle" });
      return;
    }

    setPayState((s) => ({
      ...s,
      info: t.confirmedGranted,
      error: "",
    }));

    await showLoot(chest, lvl);

    writePending(null);
    setPayState({ open: false, step: "idle" });
  };

  return (
    <section className="chests">
      <h2>{t.title}</h2>

      <div className="ton-hint">
        <div className="ton-row">
          <div className="ton-pill">
            <span className="dot" />
            {t.payPill}
          </div>
          <a className="ton-btn" href="https://ton.org/wallets" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2C7.59 4 4 7.59 4 12c0 4.08 3.06 7.44 7 7.93V13H8l4-7 4 7h-3v6.93c3.94-.49 7-3.85 7-7.93 0-4.41-3.59-8-8-8z"
                fill="currentColor"
              />
            </svg>
            <span>{t.tonWallet}</span>
          </a>
        </div>

        <div className="ton-sub">{t.hint}</div>
      </div>

      <div className="chest-grid">
        {CHESTS.map((c) => (
          <div key={c.tier} className={`chest-card tier-${c.tier}`}>
            <img className="chest-img" src={c.chestImg} alt={c.title} />
            <div className="chest-title">{c.title}</div>
            <div className="chest-price">{c.priceTon} TON</div>

            <button
              className="open-btn"
              onClick={() => startPurchase(c)}
              disabled={!!props.isBanned}
              title={props.isBanned ? t.bannedTitle : t.payViaTonkeeperTitle}
              style={props.isBanned ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
            >
              {t.buyFor(c.priceTon)}
            </button>
          </div>
        ))}
      </div>

      {/* Модалка оплати */}
      {payState.open && payState.pending && (
        <div className="pay-modal" onClick={closePayModal}>
          <div className="pay-box" onClick={(e) => e.stopPropagation()}>
            <div className="pay-title">{t.payModalTitle}</div>

            <div className="pay-row">
              <div className="pay-left">
                <div className="pay-name">{payState.pending.title}</div>
                <div className="pay-meta">
                  {t.priceLabel}: <b>{payState.pending.priceTon} TON</b>
                </div>
              </div>
              <div className={`badge badge-${payState.pending.tier}`}>{payState.pending.tier}</div>
            </div>

            <div className="pay-help">
              <div style={{ opacity: 0.9 }}>{t.commentLabel}:</div>
              <div className="pay-ref">{payState.pending.comment}</div>
              <div style={{ opacity: 0.75, fontSize: 13, marginTop: 8 }}>{t.dontChange}</div>
            </div>

            {payState.info ? <div className="pay-info">{payState.info}</div> : null}
            {payState.error ? <div className="pay-error">{payState.error}</div> : null}

            <div className="pay-actions">
              <button
                className="pay-btn secondary"
                onClick={() =>
                  openTonTransfer({
                    to: payState.pending!.to,
                    amountNano: nanoFromTon(payState.pending!.priceTon),
                    text: payState.pending!.comment,
                  })
                }
              >
                {t.openTonkeeper}
              </button>

              <button className="pay-btn primary" onClick={checkPaymentAndGrant} disabled={payState.step === "checking"}>
                {payState.step === "checking" ? t.checking : t.checkPayment}
              </button>
            </div>

            <button className="pay-close" onClick={closePayModal}>
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Модалка луту */}
      {openState.chest && (
        <div className="loot-modal" onClick={closeLootModal}>
          <div className="loot-box" onClick={(e) => e.stopPropagation()}>
            <div className="loot-title">{t.lootTitleFrom(openState.chest?.title || "")}</div>
            {openState.icon ? (
              <img className="loot-icon" src={openState.icon} alt="loot" />
            ) : (
              <div className="loot-placeholder">—</div>
            )}
            <button className="close-btn" onClick={closeLootModal}>
              {t.ok}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .chests h2 { margin-bottom: 12px; }

        .ton-hint{ margin-bottom:14px; }
        .ton-row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .ton-pill{
          display:inline-flex; align-items:center; gap:8px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.10);
          padding:8px 12px; border-radius:999px; font-weight:900;
        }
        .ton-pill .dot{
          width:8px; height:8px; border-radius:50%;
          background:linear-gradient(180deg, #53ffa6 0%, #15d3c0 100%);
          box-shadow:0 0 0 3px rgba(83,255,166,.12);
        }
        .ton-btn{
          display:inline-flex; align-items:center; gap:8px;
          background:#161f2b; color:#37a6ff; border:1px solid #1f2d3d;
          padding:8px 12px; border-radius:10px; font-weight:800; text-decoration:none;
        }
        .ton-btn:hover{ filter:brightness(1.08); }
        .ton-sub{ opacity:.72; font-size:13px; margin-top:8px; }

        .chest-grid{
          display:grid; gap:14px;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        .chest-card{
          background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
          border-radius:16px; padding:14px; text-align:center;
          box-shadow: inset 0 0 18px rgba(255,255,255,.03);
        }
        .chest-img{ width:120px; height:120px; object-fit:contain; margin:6px auto 10px; display:block; }
        .chest-title{ font-weight:900; margin-bottom:4px; letter-spacing:.2px; }
        .chest-price{ opacity:.9; margin-bottom:10px; }

        .open-btn{
          width:100%;
          padding:10px 14px; border-radius:12px; border:0; cursor:pointer; font-weight:900;
          background:linear-gradient(180deg, #53ffa6 0%, #15d3c0 100%); color:#042018;
        }

        .chest-card.tier-blue   { box-shadow: inset 0 0 18px rgba(80,200,255,.14); }
        .chest-card.tier-purple { box-shadow: inset 0 0 18px rgba(185,120,255,.16); }
        .chest-card.tier-gold   { box-shadow: inset 0 0 18px rgba(255,210,90,.20); }

        .pay-modal{
          position:fixed; inset:0; background:rgba(0,0,0,.60);
          display:grid; place-items:center; z-index:60;
        }
        .pay-box{
          width:min(92vw, 520px);
          background:rgba(20,25,35,.96); border:1px solid rgba(255,255,255,.10);
          border-radius:16px; padding:16px;
        }
        .pay-title{ font-weight:1000; font-size:18px; margin-bottom:10px; }
        .pay-row{
          display:flex; align-items:flex-start; justify-content:space-between; gap:10px;
          padding:12px; border-radius:14px;
          background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
        }
        .pay-name{ font-weight:900; margin-bottom:4px; }
        .pay-meta{ opacity:.85; font-size:13px; }
        .badge{
          font-weight:900; font-size:12px; text-transform:uppercase;
          padding:6px 10px; border-radius:999px;
          border:1px solid rgba(255,255,255,.10);
        }
        .badge-blue{ color:#6fd3ff; background:rgba(111,211,255,.10); }
        .badge-purple{ color:#d2a3ff; background:rgba(210,163,255,.10); }
        .badge-gold{ color:#ffd57a; background:rgba(255,213,122,.12); }

        .pay-help{
          margin-top:12px;
          padding:12px; border-radius:14px;
          background:rgba(255,255,255,.04);
          border:1px dashed rgba(255,255,255,.12);
        }
        .pay-ref{
          margin-top:6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size:12px;
          padding:8px 10px;
          border-radius:10px;
          background:rgba(0,0,0,.25);
          border:1px solid rgba(255,255,255,.08);
          word-break:break-all;
        }
        .pay-info{
          margin-top:10px;
          padding:10px 12px;
          border-radius:12px;
          background:rgba(80,160,255,.10);
          border:1px solid rgba(80,160,255,.20);
          color:#d7ecff;
          font-weight:800;
        }
        .pay-error{
          margin-top:10px;
          padding:10px 12px;
          border-radius:12px;
          background:rgba(255,80,80,.12);
          border:1px solid rgba(255,80,80,.25);
          color:#ffd1d1;
          font-weight:800;
        }
        .pay-actions{
          display:flex; gap:10px; flex-wrap:wrap;
          margin-top:12px;
        }
        .pay-btn{
          flex:1;
          padding:10px 12px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,.10);
          cursor:pointer;
          font-weight:900;
        }
        .pay-btn.secondary{ background:rgba(255,255,255,.06); color:#fff; }
        .pay-btn.primary{
          border:0;
          background:linear-gradient(180deg, #53ffa6 0%, #15d3c0 100%);
          color:#042018;
        }
        .pay-close{
          margin-top:10px;
          width:100%;
          padding:10px 12px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,.12);
          background:rgba(255,255,255,.04);
          color:#fff;
          cursor:pointer;
          font-weight:900;
          opacity:.9;
        }

        .loot-modal{
          position:fixed; inset:0; background:rgba(0,0,0,.55);
          display:grid; place-items:center; z-index:50;
        }
        .loot-box{
          width:min(92vw, 420px);
          background:rgba(25,30,40,.95); border:1px solid rgba(255,255,255,.1);
          border-radius:16px; padding:18px; text-align:center;
        }
        .loot-title{ font-weight:800; margin-bottom:10px; }
        .loot-icon{
          width:96px; height:96px; object-fit:contain;
          border-radius:12px; box-shadow: 0 0 0 2px rgba(255,255,255,.06), inset 0 0 18px rgba(255,255,255,.04);
          margin:10px auto 14px; display:block;
        }
        .close-btn{
          padding:10px 14px; border-radius:10px; border:0; cursor:pointer; font-weight:800;
          background:rgba(255,255,255,.1); color:#fff;
        }
      `}</style>
    </section>
  );
}
