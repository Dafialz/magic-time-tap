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
  return (
    Math.random().toString(16).slice(2) +
    Math.random().toString(16).slice(2) +
    Date.now().toString(16)
  ).slice(0, 32);
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

function openTonTransfer(opts: { to: string; amountNano: string; text: string }) {
  const to = opts.to;
  const amountNano = opts.amountNano;
  const text = opts.text;

  const deep = `ton://transfer/${encodeURIComponent(to)}?amount=${encodeURIComponent(
    amountNano
  )}&text=${encodeURIComponent(text)}`;

  const web = `https://app.tonkeeper.com/transfer/${encodeURIComponent(to)}?amount=${encodeURIComponent(
    amountNano
  )}&text=${encodeURIComponent(text)}`;

  const tg = (window as any)?.Telegram?.WebApp;
  try {
    if (tg?.openLink) {
      tg.openLink(deep);
      return;
    }
  } catch {}

  try {
    window.location.href = deep;
    window.setTimeout(() => {
      window.location.href = web;
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
    return "Гість";
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
      info: "Є незавершена покупка. Якщо ти оплатив — натисни “Перевірити оплату”.",
    });
  }, [effectiveUserId]);

  const closeLootModal = () => setOpenState({});
  const closePayModal = () => setPayState({ open: false, step: "idle" });

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
      info: "Відкрий Tonkeeper і зроби переказ. Потім натисни “Перевірити оплату”.",
    });

    createPurchaseIntent(pending, effectiveName).catch(() => {
      setPayState((s) => ({
        ...s,
        error: "Не вдалося створити intent у Firestore. Перевір rules для purchase_intents_v1.",
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
      info: "Перевіряємо оплату на сервері…",
    }));

    const result = await verifyViaFunction({ intentId: p.id }).catch(() => null);

    if (!result || typeof result !== "object") {
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error:
          "Не вдалося викликати серверну перевірку. Перевір: (1) firebase/functions у вебі, (2) регіон europe-west1, (3) user залогінений.",
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
        info:
          message ||
          "Оплата ще не знайдена/не підтверджена. Якщо оплатив — зачекай 10–30 сек і натисни ще раз.",
      }));
      return;
    }

    if (status === "rejected" || status === "expired") {
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error: message || "Платіж відхилено або прострочено. Спробуй ще раз.",
        info: "",
      }));
      return;
    }

    if (status !== "confirmed") {
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error: message || `Невідомий статус: ${status}`,
        info: "",
      }));
      return;
    }

    const chest = CHESTS.find((c) => c.tier === p.tier);
    if (!chest) {
      setPayState((s) => ({
        ...s,
        step: "waiting",
        error: "Сундук не знайдено. Онови сторінку.",
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
      info: "Оплату підтверджено ✅ Нагороду додано в інвентар.",
      error: "",
    }));

    await showLoot(chest, lvl);

    writePending(null);
    setPayState({ open: false, step: "idle" });
  };

  return (
    <section className="chests">
      <h2>Сундуки</h2>

      <div className="ton-hint">
        <div className="ton-row">
          <div className="ton-pill">
            <span className="dot" />
            Оплата TON → Tonkeeper
          </div>
          <a className="ton-btn" href="https://ton.org/wallets" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2C7.59 4 4 7.59 4 12c0 4.08 3.06 7.44 7 7.93V13H8l4-7 4 7h-3v6.93c3.94-.49 7-3.85 7-7.93 0-4.41-3.59-8-8-8z"
                fill="currentColor"
              />
            </svg>
            <span>TON Wallet</span>
          </a>
        </div>

        <div className="ton-sub">
          Лут видає <b>сервер</b>. Після оплати натисни <b>“Перевірити оплату”</b>.
        </div>
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
              title={props.isBanned ? "Ви заблоковані" : "Оплатити через Tonkeeper"}
              style={props.isBanned ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
            >
              Купити за {c.priceTon} TON
            </button>
          </div>
        ))}
      </div>

      {/* Модалка оплати */}
      {payState.open && payState.pending && (
        <div className="pay-modal" onClick={closePayModal}>
          <div className="pay-box" onClick={(e) => e.stopPropagation()}>
            <div className="pay-title">Оплата сундука</div>

            <div className="pay-row">
              <div className="pay-left">
                <div className="pay-name">{payState.pending.title}</div>
                <div className="pay-meta">
                  Ціна: <b>{payState.pending.priceTon} TON</b>
                </div>
              </div>
              <div className={`badge badge-${payState.pending.tier}`}>{payState.pending.tier}</div>
            </div>

            <div className="pay-help">
              <div style={{ opacity: 0.9 }}>Коментар до переказу:</div>
              <div className="pay-ref">{payState.pending.comment}</div>
              <div style={{ opacity: 0.75, fontSize: 13, marginTop: 8 }}>
                Не змінюй коментар — він потрібен для автоматичної перевірки.
              </div>
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
                Відкрити Tonkeeper
              </button>

              <button
                className="pay-btn primary"
                onClick={checkPaymentAndGrant}
                disabled={payState.step === "checking"}
              >
                {payState.step === "checking" ? "Перевіряємо..." : "Перевірити оплату"}
              </button>
            </div>

            <button className="pay-close" onClick={closePayModal}>
              Закрити
            </button>
          </div>
        </div>
      )}

      {/* Модалка луту */}
      {openState.chest && (
        <div className="loot-modal" onClick={closeLootModal}>
          <div className="loot-box" onClick={(e) => e.stopPropagation()}>
            <div className="loot-title">Випало зі {openState.chest?.title}:</div>
            {openState.icon ? (
              <img className="loot-icon" src={openState.icon} alt="loot" />
            ) : (
              <div className="loot-placeholder">—</div>
            )}
            <button className="close-btn" onClick={closeLootModal}>
              Гаразд
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
