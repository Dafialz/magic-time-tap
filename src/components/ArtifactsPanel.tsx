// src/components/ArtifactsPanel.tsx
import React from "react";

type Props = {
  mgp: number;
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  addToCraft: (levelToPlace?: number) => boolean;
};

/* ================= Пули іконок (з /public/shop_icons) =================
   Вітрина: BLUE → PURPLE → GOLD.
   Всі шляхи відносні (shop_icons/...), щоб коректно працювало під сабпутями. */
const BLUE_ALL = [
  "AzureValorMedal6.png","AzureLaurelMedal4.png","AzureLaurelMedal24.png","AzureLaurelMedal29.png",
  "AzureGloryMedal33.png","AzureSunCoin5.png","AzureSunCoin15.png",
  "CeruleanSunCoin25.png","CeruleanSunCoin30.png","CeruleanValorMedal21.png","CeruleanLaurelMedal24.png",
  "FrostGloryMedal31.png","FrostHonorCoin27.png","FrostHonorCoin32.png",
  "GlacialGloryMedal18.png","GlacialHonorCoin17.png","GlacialSunCoin10.png","GlacialSunCoin20.png","GlacialValorMedal26.png",
  "SapphireGloryMedal13.png","SapphireGloryMedal28.png","SapphireHonorCoin7.png","SapphireLaurelMedal14.png","SapphireLaurelMedal19.png","SapphireValorMedal11.png",
  // ще трохи синіх повторів, щоб довести до 30
  "AzureLaurelMedal24.png","AzureSunCoin15.png","GlacialSunCoin20.png","SapphireGloryMedal28.png"
];

const PURPLE_ALL = [
  "AmethystHonorCoin37.png","AmethystLaurelMedal39.png","AmethystValorMedal36.png",
  "ArcaneGloryMedal43.png","ArcaneSunCoin35.png","ArcaneSunCoin40.png","ArcaneValorMedal41.png",
  "MysticGloryMedal38.png","RoyalHonorCoin42.png","VioletLaurelMedal34.png",
  // добиваємо до 14 фіолетових
  "AmethystValorMedal36.png","ArcaneSunCoin35.png","ArcaneValorMedal41.png","AmethystLaurelMedal39.png"
];

const GOLD_ALL = [
  "GoldenLaurelMedal44.png","GoldenHonorCoin47.png","GoldenValorMedal49.png",
  "GildedValorMedal46.png","SolarGloryMedal48.png","SunCoin45.png"
  // SunCoin50.png лишив у запасі
];

// перетворимо у повні шляхи
const PATH = (n: string) => `shop_icons/${n}`;
const BLUE = BLUE_ALL.map(PATH);
const PURPLE = PURPLE_ALL.map(PATH);
const GOLD = GOLD_ALL.map(PATH);

/* ================= Модель магазину ================= */
type Tier = "blue" | "purple" | "gold";
type ShopItem = {
  id: string;
  name: string;
  price: number;
  tier: Tier;
  pool: string[];
  startIdx: number;
};

const COUNT = 50;
const BLUE_COUNT = 30;   // найдешевші — сині
const PURPLE_COUNT = 14; // середні — фіолетові
const GOLD_COUNT = COUNT - BLUE_COUNT - PURPLE_COUNT; // найдорожчі — золоті

const NAMES: string[] = [
  "Піщинка Часу","Іскорка Хроно","Міні-Годинник","Кварцовий Пісок","Тік-Модуль",
  "Нанопісок","Хронопил","Мала Спіраль","Хвильовий Годинник","Потік Секунд",
  "Серп Часу","Клинок Миті","Скляне Ядро","Геод Пульсу","Резонатор m1",
  "Резонатор m2","Резонатор m3","Резонатор m4","Резонатор m5","Кристал Δ",
  "Кристал Ω","Кристал Σ","Грань Епохи","Порталик","Хронокрапля",
  "Хроноджерело","Вузол m7","Вузол m8","Вузол m9","Вузол m10",
  "Синхроядро","Астральний Пісок","Кубок Миттєвості","Сфера Ритму","Квантовий Пил",
  "Серце Годинника","Пружина Епохи","Ехо-Маяк","Цезієвий Ізотоп","Ротор V",
  "Ротор VI","Ротор VII","Ротор VIII","Ротор IX","Ротор X",
  "Сяйво Δ","Сяйво Ω","Сяйво Σ","Згортка Часу","Архіфлукс"
];

const BASE = 500;
const MULT = 1.28;

const SHOP_ITEMS: ShopItem[] = Array.from({ length: COUNT }, (_, i) => {
  let tier: Tier, pool: string[], startIdx: number;

  if (i < BLUE_COUNT) { tier = "blue"; pool = BLUE; startIdx = i; }
  else if (i < BLUE_COUNT + PURPLE_COUNT) { tier = "purple"; pool = PURPLE; startIdx = i - BLUE_COUNT; }
  else { tier = "gold"; pool = GOLD; startIdx = i - BLUE_COUNT - PURPLE_COUNT; }

  const price = Math.round(BASE * Math.pow(MULT, i));
  return {
    id: `shop_${i + 1}`,
    name: NAMES[i] || `Товар ${i + 1}`,
    price,
    tier,
    pool,
    startIdx
  };
});

/* ===== Іконка з автоперебором у межах тиру (без DOM-хаків) ===== */
function IconWithTierFallback({
  pool, startIdx, name, tier
}: { pool: string[]; startIdx: number; name: string; tier: Tier }) {
  const [idx, setIdx] = React.useState(startIdx % Math.max(pool.length, 1));
  const [tries, setTries] = React.useState(0);

  if (!pool.length || tries >= pool.length) {
    const ch = (name || "?").trim().charAt(0).toUpperCase() || "•";
    return <div className={`badge-fallback tier-${tier}`}>{ch}</div>;
  }

  const src = pool[idx];
  return (
    <img
      src={src}
      alt={name}
      className="shop-icon-img"
      onError={() => {
        setIdx((v) => (v + 1) % pool.length);
        setTries((t) => t + 1);
      }}
    />
  );
}

export default function ArtifactsPanel({ mgp, setMgp, addToCraft }: Props) {
  const tryBuy = (item: ShopItem) => {
    if (mgp < item.price) { alert("Не вистачає MGP"); return; }
    const placed = addToCraft(1);
    if (!placed) return;
    setMgp(v => v - item.price);
  };

  return (
    <section className="shop">
      <h2>Магазин артефактів</h2>
      <div className="shop-balance">Баланс: <b>{Math.floor(mgp).toLocaleString("uk-UA")}</b> mgp</div>

      <div className="shop-list">
        {SHOP_ITEMS.map((it) => {
          const enough = mgp >= it.price;
          return (
            <div key={it.id} className={`shop-item ${enough ? "can" : ""} tier-${it.tier}`}>
              <div className="shop-left">
                <IconWithTierFallback pool={it.pool} startIdx={it.startIdx} name={it.name} tier={it.tier} />
                <div className="shop-text">
                  <div className="shop-title">{it.name}</div>
                  <div className="shop-sub">Ціна: {it.price.toLocaleString("uk-UA")} mgp</div>
                </div>
              </div>
              <button className="shop-buy" disabled={!enough} onClick={() => tryBuy(it)}>
                {enough ? "КУПИТИ" : "Не вистачає"}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .shop-list{ display:flex; flex-direction:column; gap:12px; }
        .shop-item{
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 14px; border-radius:14px;
          background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
        }
        .shop-left{ display:flex; align-items:center; gap:12px; min-width:0; }
        .shop-icon-img{ width:48px; height:48px; border-radius:10px; object-fit:contain; }
        .badge-fallback{
          width:48px; height:48px; border-radius:10px; display:grid; place-items:center;
          font-weight:800; letter-spacing:.3px;
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
          border:1px solid rgba(255,255,255,.12);
        }
        .shop-title{ font-weight:700; }
        .shop-sub{ opacity:.85; font-size:14px; }
        .shop-buy{ padding:10px 14px; border-radius:12px; border:0; font-weight:800; cursor:pointer; }
        .shop-buy:disabled{ opacity:.5; cursor:default; }

        /* Візуальний ореол по тiрах */
        .tier-blue .shop-icon-img, .tier-blue .badge-fallback{ box-shadow: 0 0 0 2px rgba(80,200,255,.35), inset 0 0 18px rgba(80,200,255,.15); }
        .tier-purple .shop-icon-img, .tier-purple .badge-fallback{ box-shadow: 0 0 0 2px rgba(185,120,255,.35), inset 0 0 18px rgba(185,120,255,.18); }
        .tier-gold .shop-icon-img, .tier-gold .badge-fallback{ box-shadow: 0 0 0 2px rgba(255,210,90,.45), inset 0 0 18px rgba(255,210,90,.25); }
      `}</style>
    </section>
  );
}
