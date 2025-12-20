// src/components/SkinsShop.tsx
import React from "react";
import { iconByLevel } from "../systems/shop_icons";

/* ===== Пули іконок (колірні набори) ===== */
const BLUE_POOL = [
  "/shop_icons/SapphireValorMedal1.png",
  "/shop_icons/SapphireHonorCoin2.png",
  "/shop_icons/FrostGloryMedal3.png",
  "/shop_icons/AzureLaurelMedal4.png",
  "/shop_icons/AzureSunCoin5.png",
  "/shop_icons/AzureValorMedal6.png",
  "/shop_icons/SapphireHonorCoin7.png",
  "/shop_icons/GlacialGloryMedal8.png",
  "/shop_icons/SapphireLaurelMedal9.png",
  "/shop_icons/GlacialSunCoin20.png",
  "/shop_icons/AzureValorMedal21.png",
  "/shop_icons/GlacialHonorCoin22.png",
  "/shop_icons/CeruleanGloryMedal23.png",
  "/shop_icons/AzureLaurelMedal24.png",
  "/shop_icons/GlacialValorMedal26.png",
  "/shop_icons/FrostHonorCoin27.png",
  "/shop_icons/SapphireGloryMedal28.png",
  "/shop_icons/AzureLaurelMedal29.png",
  "/shop_icons/CeruleanSunCoin30.png",
  "/shop_icons/FrostHonorCoin32.png",
  "/shop_icons/AzureGloryMedal33.png",
  "/shop_icons/AzureSunCoin15.png",
  "/shop_icons/AzureValorMedal16.png",
  "/shop_icons/GlacialHonorCoin17.png",
  "/shop_icons/GlacialGloryMedal18.png",
  "/shop_icons/SapphireLaurelMedal19.png",
];

const PURPLE_POOL = [
  "/shop_icons/RoyalHonorCoin42.png",
  "/shop_icons/GlacialSunCoin10.png",
  "/shop_icons/CeruleanValorMedal11.png",
  "/shop_icons/SapphireHonorCoin12.png",
  "/shop_icons/SapphireGloryMedal13.png",
  "/shop_icons/SapphireLaurelMedal14.png",
  "/shop_icons/CeruleanSunCoin25.png",
  "/shop_icons/FrostValorMedal31.png",
  "/shop_icons/VioletLaurelMedal34.png",
  "/shop_icons/ArcaneSunCoin35.png",
  "/shop_icons/AmethystValorMedal36.png",
  "/shop_icons/AmethystHonorCoin37.png",
  "/shop_icons/MysticGloryMedal38.png",
  "/shop_icons/AmethystLaurelMedal39.png",
  "/shop_icons/ArcaneSunCoin40.png",
  "/shop_icons/ArcaneValorMedal41.png",
  "/shop_icons/ArcaneGloryMedal43.png",
];

const GOLD_POOL = [
  "/shop_icons/GoldenLaurelMedal44.png",
  "/shop_icons/SunCoin45.png",
  "/shop_icons/GildedValorMedal46.png",
  "/shop_icons/GoldenHonorCoin47.png",
  "/shop_icons/SolarGloryMedal48.png",
  "/shop_icons/GoldenLaurelMedal49.png",
  "/shop_icons/SunCoin50.png",
];

type Tier = "blue" | "purple" | "gold";
type Chest = {
  tier: Tier;
  title: string;
  priceTon: number; // TON
  chestImg: string;
  pool: string[];
  weights: number[]; // (залишено на майбутнє)
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
 * ✅ Твій гаманець Tonkeeper (отримувач платежу)
 * Всі платежі за сундуки йдуть сюди.
 */
const MERCHANT_TON_ADDRESS = "UQAZ4VN0UzqZ570GjM3EpDFszzs4zsw8cD8_YfC0M2ca6N17";

/**
 * Поки що робимо “реальний платіж” через Tonkeeper deep link.
 * ВАЖЛИВО: без серверної перевірки (наступним кроком зробимо Cloud Function),
 * користувач теоретично може натиснути “Я оплатив” без оплати.
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

/* ===== Firestore lightweight logger (без окремих файлів) ===== */

const LOCAL_ID_KEY = "mt_local_id_v1";

function env() {
  return ((import.meta as any)?.env ?? {}) as Record<string, string>;
}

function hasFirebaseEnv() {
  const e = env();
  return !!(e.VITE_FB_API_KEY && e.VITE_FB_PROJECT_ID && e.VITE_FB_AUTH_DOMAIN);
}

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

async function logChestEvent(params: {
  userId: string;
  name: string;
  type: "open_chest";
  chestTier: Tier;
  chestTitle: string;
  priceTon: number;
  lootLevel: number;
  lootIcon: string;

  // ✅ додаємо "paymentRef" (коментар/реф) щоб потім звіряти з транзакцією
  paymentRef?: string;
}) {
  // пишемо:
  // 1) events_v1 (аудит)
  // 2) users_v1/{userId} (профіль)
  // 3) users_v1/{userId}/inventory_v1/{itemKey} (інвентар)
  await withFirestore(async (db, fs) => {
    const now = fs.serverTimestamp();
    const uid = params.userId;

    // events_v1
    await fs.addDoc(fs.collection(db, "events_v1"), {
      userId: uid,
      name: params.name,
      type: params.type,
      chestTier: params.chestTier,
      chestTitle: params.chestTitle,
      priceTon: params.priceTon,
      lootLevel: params.lootLevel,
      lootIcon: params.lootIcon,
      paymentRef: params.paymentRef ?? "",
      ts: now,
    });

    // users_v1/{uid}
    await fs.setDoc(
      fs.doc(db, "users_v1", uid),
      {
        name: params.name,
        lastSeenAt: now,
        lastChest: {
          tier: params.chestTier,
          title: params.chestTitle,
          priceTon: params.priceTon,
          lootLevel: params.lootLevel,
          lootIcon: params.lootIcon,
          paymentRef: params.paymentRef ?? "",
        },
      },
      { merge: true }
    );

    // inventory агреговано по ключу
    const itemKey = `loot_level_${params.lootLevel}`;
    const invRef = fs.doc(db, "users_v1", uid, "inventory_v1", itemKey);

    // increment qty
    await fs.setDoc(
      invRef,
      {
        kind: "loot_level",
        level: params.lootLevel,
        icon: params.lootIcon,
        qty: fs.increment(1),
        updatedAt: now,
      },
      { merge: true }
    );

    return true as any;
  });
}

/* ===== TON payment helpers (deeplink) ===== */

const LS_PENDING_PAY_KEY = "mt_pending_ton_purchase_v1";

type PendingPay = {
  id: string; // nonce/intent id
  tier: Tier;
  title: string;
  priceTon: number;
  createdAtMs: number;
  userId: string;
};

function nanoFromTon(ton: number): string {
  // TON -> nanoton (string)
  // 1 TON = 1_000_000_000 nanoton
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
    if (!p.id || !p.tier || !p.priceTon || !p.userId) return null;
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

  // web fallback (Tonkeeper supports https scheme)
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

  // якщо deep link не відкрився (десктоп/браузер) — пробуємо web
  try {
    window.location.href = deep;
    window.setTimeout(() => {
      // якщо браузер не підтримує — переведемо на web
      window.location.href = web;
    }, 600);
  } catch {
    window.open(web, "_blank", "noopener,noreferrer");
  }
}

/* ===== компонент ===== */

type Props = {
  ownedSkins?: string[];
  equippedSkinId?: string;
  buySkin?: (id: string, price: number) => void;

  /** (опціонально) стабільний userId, краще auth.uid */
  userId?: string;
  /** (опціонально) нік для логів */
  nickname?: string;
  /** (опціонально) якщо забанений — блокуємо дії */
  isBanned?: boolean;

  /** Коли випадає лут — App кладе предмет у крафт */
  onLoot?: (payload: { level: number; icon: string; chest: Chest }) => void;
};

export default function SkinsShop(props: Props) {
  const [openState, setOpenState] = React.useState<{ chest?: Chest; icon?: string }>({});
  const [payState, setPayState] = React.useState<{
    open: boolean;
    pending?: PendingPay;
    step?: "idle" | "sent" | "claiming";
    error?: string;
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

  // Якщо після refresh був “pending payment” — показуємо модалку, щоб юзер міг завершити
  React.useEffect(() => {
    const p = readPending();
    if (!p) return;
    if (p.userId !== effectiveUserId) return;
    setPayState({ open: true, pending: p, step: "sent" });
  }, [effectiveUserId]);

  const closeLootModal = () => setOpenState({});
  const closePayModal = () => setPayState({ open: false, step: "idle" });

  const openChestWithLoot = async (chest: Chest, paymentRef?: string) => {
    // 1) Обираємо рівень ТІЛЬКИ з дозволених для кольору скрині
    const levels = LEVELS_BY_TIER[chest.tier];
    if (!levels.length) return;

    const level = levels[Math.floor(Math.random() * levels.length)];

    // 2) Іконку показуємо через iconByLevel(level) — точно співпаде з крафтом
    const icon = iconByLevel(level);

    setOpenState({ chest, icon }); // попап
    props.onLoot?.({ level, icon, chest }); // у крафт

    // 3) Лог у Firestore (якщо підключено env)
    logChestEvent({
      userId: effectiveUserId,
      name: effectiveName,
      type: "open_chest",
      chestTier: chest.tier,
      chestTitle: chest.title,
      priceTon: chest.priceTon,
      lootLevel: level,
      lootIcon: icon,
      paymentRef: paymentRef ?? "",
    }).catch(() => {});
  };

  const startPurchase = async (chest: Chest) => {
    if (props.isBanned) return;

    const nonce = makeNonce();
    const pending: PendingPay = {
      id: nonce,
      tier: chest.tier,
      title: chest.title,
      priceTon: chest.priceTon,
      createdAtMs: Date.now(),
      userId: effectiveUserId,
    };

    writePending(pending);
    setPayState({ open: true, pending, step: "sent", error: "" });

    // Коментар (референс) який прийде до тебе разом з TON транзакцією
    // Формат: mt|<uid>|<tier>|<nonce>
    const comment = `mt|${effectiveUserId}|${chest.tier}|${nonce}`;

    openTonTransfer({
      to: MERCHANT_TON_ADDRESS,
      amountNano: nanoFromTon(chest.priceTon),
      text: comment,
    });
  };

  const claimAfterPay = async () => {
    if (!payState.pending) return;
    const p = payState.pending;

    const chest = CHESTS.find((c) => c.tier === p.tier);
    if (!chest) {
      setPayState((s) => ({ ...s, error: "Сундук не знайдено. Онови сторінку." }));
      return;
    }

    setPayState((s) => ({ ...s, step: "claiming", error: "" }));

    // ⚠️ Тимчасово: довіряємо натисканню “Я оплатив”.
    // Далі зробимо Cloud Function, яка підтвердить транзакцію і тоді видаватиме лут.
    const paymentRef = `mt|${p.userId}|${p.tier}|${p.id}`;

    await openChestWithLoot(chest, paymentRef);

    // закриваємо pending
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
          <a
            className="ton-btn"
            href="https://ton.org/wallets"
            target="_blank"
            rel="noreferrer"
            title="Офіційні гаманці TON"
          >
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
          Після оплати натисни <b>“Я оплатив”</b>. (Наступним кроком підключимо автоматичну перевірку транзакції.)
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
              <div style={{ opacity: 0.9 }}>
                Переказ має містити коментар:
              </div>
              <div className="pay-ref">
                mt|{payState.pending.userId}|{payState.pending.tier}|{payState.pending.id}
              </div>
              <div style={{ opacity: 0.75, fontSize: 13, marginTop: 8 }}>
                Це потрібно для зв’язки платежу з покупкою.
              </div>
            </div>

            {payState.error ? <div className="pay-error">{payState.error}</div> : null}

            <div className="pay-actions">
              <button
                className="pay-btn secondary"
                onClick={() => {
                  // знову відкрити Tonkeeper
                  const comment = `mt|${payState.pending!.userId}|${payState.pending!.tier}|${payState.pending!.id}`;
                  openTonTransfer({
                    to: MERCHANT_TON_ADDRESS,
                    amountNano: nanoFromTon(payState.pending!.priceTon),
                    text: comment,
                  });
                }}
              >
                Відкрити Tonkeeper
              </button>

              <button
                className="pay-btn primary"
                onClick={claimAfterPay}
                disabled={payState.step === "claiming"}
              >
                {payState.step === "claiming" ? "Перевіряємо..." : "Я оплатив"}
              </button>
            </div>

            <button
              className="pay-close"
              onClick={() => {
                // якщо юзер закрив — pending лишається, щоб після refresh він міг завершити
                closePayModal();
              }}
            >
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

        .ton-hint{
          margin-bottom:14px;
        }
        .ton-row{
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        }
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

        /* payment modal */
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
        .pay-btn.secondary{
          background:rgba(255,255,255,.06);
          color:#fff;
        }
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

        /* loot modal */
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
