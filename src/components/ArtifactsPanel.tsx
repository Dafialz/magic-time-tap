// src/components/ArtifactsPanel.tsx
import React from "react";

type Props = {
  mgp: number;
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  addToCraft: (levelToPlace?: number) => boolean;
};

/* ================= ІКОНКИ У ТОЧНІЙ ПОСЛІДОВНОСТІ =================
   Порядок: спочатку всі BLUE (дешеві), далі PURPLE, вкінці GOLD (дорогі).
   Шляхи абсолютні — /shop_icons/... з папки public/shop_icons.
*/
const BLUE_ICONS: string[] = [
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

const PURPLE_ICONS: string[] = [
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

const GOLD_ICONS: string[] = [
  "/shop_icons/GoldenLaurelMedal44.png",
  "/shop_icons/SunCoin45.png",
  "/shop_icons/GildedValorMedal46.png",
  "/shop_icons/GoldenHonorCoin47.png",
  "/shop_icons/SolarGloryMedal48.png",
  "/shop_icons/GoldenLaurelMedal49.png",
  "/shop_icons/SunCoin50.png",
];

// Збираємо список у повній черзі і збережемо межі тiрів
const ICONS_IN_ORDER = [...BLUE_ICONS, ...PURPLE_ICONS, ...GOLD_ICONS];
const BLUE_END = BLUE_ICONS.length;                           // 33
const PURPLE_END = BLUE_ICONS.length + PURPLE_ICONS.length;   // 43

type Tier = "blue" | "purple" | "gold";
const tierByIndex = (i: number): Tier =>
  i < BLUE_END ? "blue" : i < PURPLE_END ? "purple" : "gold";

/* ================= Модель магазину ================= */
type ShopItem = { id: string; name: string; price: number; tier: Tier; icon: string };

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

const SHOP_ITEMS: ShopItem[] = NAMES.map((name, i) => ({
  id: `shop_${i + 1}`,
  name,
  price: Math.round(BASE * Math.pow(MULT, i)),
  tier: tierByIndex(i),
  icon: ICONS_IN_ORDER[i] || "",
}));

/* ====== Іконка з простим fallback (без DOM-маніпуляцій) ====== */
function IconWithFallback({ src, name, tier }: { src?: string; name: string; tier: Tier }) {
  const [broken, setBroken] = React.useState(false);
  if (!src || broken) {
    const ch = (name || "?").trim().charAt(0).toUpperCase() || "•";
    return <div className={`badge-fallback tier-${tier}`}>{ch}</div>;
  }
  return <img src={src} alt={name} className="shop-icon-img" onError={() => setBroken(true)} />;
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
                <IconWithFallback src={it.icon} name={it.name} tier={it.tier} />
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

        /* Оріоли по тiрах */
        .tier-blue .shop-icon-img, .tier-blue .badge-fallback{ box-shadow: 0 0 0 2px rgba(80,200,255,.35), inset 0 0 18px rgba(80,200,255,.15); }
        .tier-purple .shop-icon-img, .tier-purple .badge-fallback{ box-shadow: 0 0 0 2px rgba(185,120,255,.35), inset 0 0 18px rgba(185,120,255,.18); }
        .tier-gold .shop-icon-img, .tier-gold .badge-fallback{ box-shadow: 0 0 0 2px rgba(255,210,90,.45), inset 0 0 18px rgba(255,210,90,.25); }
      `}</style>
    </section>
  );
}
