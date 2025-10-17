import React from "react";

type Props = {
  mgp: number;
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  addToCraft: (levelToPlace?: number) => boolean;
};

// ====== КАТАЛОГ ІКОНОК (шлях з /public) =====================================
// Порядок тiрів у вітрині: BLUE → PURPLE → GOLD.
const BLUE_ICONS = [
  "AzureValorMedal6.png",
  "AzureLaurelMedal4.png",
  "AzureLaurelMedal24.png",
  "AzureLaurelMedal29.png",
  "AzureGloryMedal33.png",
  "AzureSunCoin5.png",
  "AzureSunCoin15.png",
  "CeruleanGloryMedal23.png",
  "CeruleanSunCoin25.png",
  "CeruleanSunCoin30.png",
  "CeruleanValorMedal21.png",
  "CeruleanLaurelMedal24.png",
  "GlacialGloryMedal18.png",
  "GlacialHonorCoin17.png",
  "GlacialSunCoin10.png",
  "GlacialSunCoin20.png",
  "GlacialValorMedal26.png",
  "FrostGloryMedal31.png",
  "FrostHonorCoin27.png",
  "FrostHonorCoin32.png",
  "SapphireGloryMedal13.png",
  "SapphireGloryMedal28.png",
  "SapphireHonorCoin7.png",
  "SapphireLaurelMedal14.png",
  "SapphireLaurelMedal19.png",
  "SapphireValorMedal11.png",
];

const PURPLE_ICONS = [
  "AmethystHonorCoin37.png",
  "AmethystLaurelMedal39.png",
  "AmethystValorMedal36.png",
  "ArcaneGloryMedal43.png",
  "ArcaneSunCoin35.png",
  "ArcaneSunCoin40.png",
  "ArcaneValorMedal41.png",
  "MysticGloryMedal38.png",
  "RoyalHonorCoin42.png",
  "VioletLaurelMedal34.png",
];

const GOLD_ICONS = [
  "GoldenLaurelMedal44.png",
  "GoldenHonorCoin47.png",
  "GoldenValorMedal49.png",
  "GildedValorMedal46.png",
  "SolarGloryMedal48.png",
  "SunCoin45.png",
  "SunCoin50.png",
];

const ICON_POOLS = {
  blue: BLUE_ICONS.map((f) => `/shop_icons/${f}`),
  purple: PURPLE_ICONS.map((f) => `/shop_icons/${f}`),
  gold: GOLD_ICONS.map((f) => `/shop_icons/${f}`),
};

// ====== МОДЕЛЬ МАГАЗИНУ (50 позицій) =======================================

type Tier = "blue" | "purple" | "gold";
type ShopItem = { id: string; name: string; price: number; tier: Tier; icon: string };

// Розподіл тiрів по ціні: найдешевші — BLUE, середні — PURPLE, найдорожчі — GOLD.
const COUNT = 50;
const BLUE_COUNT = 30;
const PURPLE_COUNT = 14;
const GOLD_COUNT = COUNT - BLUE_COUNT - PURPLE_COUNT;

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

// Прайс: плавне зростання.
const BASE = 500;
const MULT = 1.28;

const pickIcon = (tier: Tier, indexWithinTier: number) => {
  const pool = ICON_POOLS[tier];
  if (!pool.length) return "";
  return pool[indexWithinTier % pool.length];
};

const SHOP_ITEMS: ShopItem[] = Array.from({ length: COUNT }, (_, i) => {
  let tier: Tier;
  let rankInTier: number;

  if (i < BLUE_COUNT) { tier = "blue"; rankInTier = i; }
  else if (i < BLUE_COUNT + PURPLE_COUNT) { tier = "purple"; rankInTier = i - BLUE_COUNT; }
  else { tier = "gold"; rankInTier = i - BLUE_COUNT - PURPLE_COUNT; }

  const icon = pickIcon(tier, rankInTier);
  const price = Math.round(BASE * Math.pow(MULT, i));
  const name = NAMES[i] || `Товар ${i + 1}`;

  return { id: `shop_${i + 1}`, name, price, tier, icon };
});

// ——— Компонент іконки з fallback (JSX, без прямого DOM)
function IconWithFallback({ src, name }: { src?: string; name: string }) {
  const [broken, setBroken] = React.useState(false);

  if (!src || broken) {
    const ch = (name || "?").trim().charAt(0).toUpperCase() || "•";
    return <div className="badge-fallback">{ch}</div>;
  }
  return (
    <img
      src={src}
      alt={name}
      className="shop-icon-img"
      onError={() => setBroken(true)}
    />
  );
}

export default function ArtifactsPanel({ mgp, setMgp, addToCraft }: Props) {
  const tryBuy = (item: ShopItem) => {
    if (mgp < item.price) { alert("Не вистачає MGP"); return; }
    const placed = addToCraft(1); // Купівля = L1 у крафт-сітку
    if (!placed) return;
    setMgp(v => v - item.price);
  };

  return (
    <section className="shop">
      <h2>Магазин артефактів</h2>
      <div className="shop-balance">
        Баланс: <b>{Math.floor(mgp).toLocaleString("uk-UA")}</b> mgp
      </div>

      <div className="shop-list">
        {SHOP_ITEMS.map((it) => {
          const enough = mgp >= it.price;
          return (
            <div key={it.id} className={`shop-item ${enough ? "can" : ""} tier-${it.tier}`}>
              <div className="shop-left">
                <IconWithFallback src={it.icon} name={it.name} />
                <div className="shop-text">
                  <div className="shop-title">{it.name}</div>
                  <div className="shop-sub">Ціна: {it.price.toLocaleString("uk-UA")} mgp</div>
                </div>
              </div>
              <button
                className="shop-buy"
                disabled={!enough}
                onClick={() => tryBuy(it)}
              >
                {enough ? "КУПИТИ" : "Не вистачає"}
              </button>
            </div>
          );
        })}
      </div>

      {/* локальні стилі (можна перенести в App.css) */}
      <style>{`
        .shop-list{ display:flex; flex-direction:column; gap:12px; }
        .shop-item{
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 14px; border-radius:14px;
          background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
        }
        .shop-left{ display:flex; align-items:center; gap:12px; min-width:0; }
        .badge-fallback{
          width:48px; height:48px; border-radius:10px; display:grid; place-items:center;
          font-weight:800; letter-spacing:.3px;
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
          border:1px solid rgba(255,255,255,.12);
        }
        .shop-icon-img{ width:48px; height:48px; border-radius:10px; object-fit:contain;
          box-shadow: 0 0 0 2px rgba(255,255,255,.06), inset 0 0 18px rgba(255,255,255,.04);
        }
        .shop-title{ font-weight:700; }
        .shop-sub{ opacity:.85; font-size:14px; }
        .shop-buy{ padding:10px 14px; border-radius:12px; border:0; font-weight:800; cursor:pointer; }
        .shop-buy:disabled{ opacity:.5; cursor:default; }

        /* Кольорові ореоли по тiрах */
        .tier-blue .shop-icon-img{ box-shadow: 0 0 0 2px rgba(80,200,255,.35), inset 0 0 18px rgba(80,200,255,.15); }
        .tier-purple .shop-icon-img{ box-shadow: 0 0 0 2px rgba(185,120,255,.35), inset 0 0 18px rgba(185,120,255,.18); }
        .tier-gold .shop-icon-img{ box-shadow: 0 0 0 2px rgba(255,210,90,.45), inset 0 0 18px rgba(255,210,90,.25); }
      `}</style>
    </section>
  );
}
