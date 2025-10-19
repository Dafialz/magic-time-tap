// src/components/SkinsShop.tsx
import React from "react";

/**
 * СУНДУКИ
 * - 3 скрині: Azure (1 TON), Amethyst (2 TON), Gilded (3 TON)
 * - Дропають лише зі свого тиру (blue/purple/gold)
 * - Рідкість: предмети дорожчі у магазині випадають рідше
 *   (ваги ~ 1/(index+1)^k; k: blue=1.3, purple=1.55, gold=1.8)
 * - Зображення скринь поклади в /public/chests:
 *      /chests/AzureChest.png
 *      /chests/AmethystChest.png
 *      /chests/GildedChest.png
 * - Іконки луту — ті самі, що в магазині (/public/shop_icons/...)
 */

/* ====== Пули іконок (точно в порядку магазину) ====== */
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
  priceTon: number;
  chestImg: string;
  pool: string[];
  weights: number[]; // ваги дропа 1:1 до pool
};

/* ===== Ваги: дорожчі випадають рідше ===== */
function powerWeights(poolLen: number, k: number): number[] {
  // w[i] = 1 / (i+1)^k
  return Array.from({ length: poolLen }, (_, i) => 1 / Math.pow(i + 1, k));
}

/* ===== Опис трьох скринь ===== */
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

/* ===== Вибір із пула з урахуванням ваг ===== */
function pickWeighted(pool: string[], weights: number[]): string {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/* ===== Пропси робимо необов’язковими, щоб не ламати App.tsx ===== */
type Props = {
  ownedSkins?: string[];
  equippedSkinId?: string;
  buySkin?: (id: string, price: number) => void;
};

/* ============================= UI ============================= */
export default function SkinsShop(_props: Props) {
  const [openState, setOpenState] = React.useState<{ chest?: Chest; icon?: string }>({});

  const openChest = (chest: Chest) => {
    // TODO: інтегрувати TonConnect і списання TON.
    // Зараз демо — просто випадковий лут із вагами.
    const icon = pickWeighted(chest.pool, chest.weights);
    setOpenState({ chest, icon });
  };

  const closeModal = () => setOpenState({});

  return (
    <section className="chests">
      <h2>Сундуки</h2>

      {/* Офіційна кнопка TON (перехід на сторінку гаманців) */}
      <div className="ton-hint">
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
        <div className="ton-sub">Демо-режим: оплати ще нема, показує лише випадковий лут.</div>
      </div>

      <div className="chest-grid">
        {CHESTS.map((c) => (
          <div key={c.tier} className={`chest-card tier-${c.tier}`}>
            <img className="chest-img" src={c.chestImg} alt={c.title} />
            <div className="chest-title">{c.title}</div>
            <div className="chest-price">{c.priceTon} TON</div>
            <button className="open-btn" onClick={() => openChest(c)}>
              Відкрити
            </button>
          </div>
        ))}
      </div>

      {openState.chest && (
        <div className="loot-modal" onClick={closeModal}>
          <div className="loot-box" onClick={(e) => e.stopPropagation()}>
            <div className="loot-title">Випало зі {openState.chest?.title}:</div>
            {openState.icon ? (
              <img className="loot-icon" src={openState.icon} alt="loot" />
            ) : (
              <div className="loot-placeholder">—</div>
            )}
            <button className="close-btn" onClick={closeModal}>Гаразд</button>
          </div>
        </div>
      )}

      <style>{`
        .chests h2 { margin-bottom: 12px; }

        .ton-hint{
          display:flex; align-items:center; gap:12px; flex-wrap:wrap;
          margin-bottom:14px;
        }
        .ton-btn{
          display:inline-flex; align-items:center; gap:8px;
          background:#161f2b; color:#37a6ff; border:1px solid #1f2d3d;
          padding:8px 12px; border-radius:10px; font-weight:800; text-decoration:none;
        }
        .ton-btn:hover{ filter:brightness(1.08); }
        .ton-sub{ opacity:.7; font-size:13px; }

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
          padding:10px 14px; border-radius:12px; border:0; cursor:pointer; font-weight:900;
          background:linear-gradient(180deg, #53ffa6 0%, #15d3c0 100%); color:#042018;
        }

        /* Підсвітка за тирами (виправлено селектори) */
        .chest-card.tier-blue   { box-shadow: inset 0 0 18px rgba(80,200,255,.14); }
        .chest-card.tier-purple { box-shadow: inset 0 0 18px rgba(185,120,255,.16); }
        .chest-card.tier-gold   { box-shadow: inset 0 0 18px rgba(255,210,90,.20); }

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
