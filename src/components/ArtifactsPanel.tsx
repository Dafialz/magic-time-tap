import React from "react";

type Props = {
  mgp: number;
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  addToCraft: (levelToPlace?: number) => boolean;
};

// ====== ІКОНКИ ===============================================================
// Поклади ВСІ ці PNG у public/shop_icons/ (шляхи абсолютні від /public).
// Можеш змінювати назви у цьому масиві під свої файли — порядок відповідає item-ам.
const ICONS: string[] = [
  "/shop_icons/AzureValorMedal6.png",
  // 2–10
  "/shop_icons/AmethystLaurelMedal39.png",
  "/shop_icons/AmethystValorMedal36.png",
  "/shop_icons/ArcaneGloryMedal43.png",
  "/shop_icons/AzureGloryMedal33.png",
  "/shop_icons/AzureSunCoin15.png",
  "/shop_icons/CeruleanGloryMedal23.png",
  "/shop_icons/CeruleanSunCoin25.png",
  "/shop_icons/CeruleanSunCoin30.png",
  "/shop_icons/CeruleanValorMedal21.png",
  // 11–20
  "/shop_icons/FrostHonorCoin27.png",
  "/shop_icons/FrostHonorCoin32.png",
  "/shop_icons/FrostGloryMedal31.png",
  "/shop_icons/GlacialGloryMedal18.png",
  "/shop_icons/GlacialHonorCoin17.png",
  "/shop_icons/GlacialSunCoin20.png",
  "/shop_icons/GlacialValorMedal26.png",
  "/shop_icons/SapphireGloryMedal13.png",
  "/shop_icons/SapphireHonorCoin7.png",
  "/shop_icons/SapphireLaurelMedal14.png",
  // 21–30
  "/shop_icons/SapphireValorMedal11.png",
  "/shop_icons/AmethystHonorCoin37.png",
  "/shop_icons/ArcaneSunCoin35.png",
  "/shop_icons/ArcaneSunCoin40.png",
  "/shop_icons/ArcaneValorMedal41.png",
  "/shop_icons/GildedValorMedal46.png",
  "/shop_icons/GoldenHonorCoin47.png",
  "/shop_icons/GoldenLaurelMedal44.png",
  "/shop_icons/GoldenValorMedal49.png",
  "/shop_icons/MysticGloryMedal38.png",
  // 31–40
  "/shop_icons/RoyalHonorCoin42.png",
  "/shop_icons/SolarGloryMedal48.png",
  "/shop_icons/SunCoin45.png",
  "/shop_icons/SunCoin50.png",
  "/shop_icons/VioletLaurelMedal34.png",
  "/shop_icons/CeruleanLaurelMedal24.png",
  "/shop_icons/GlacialSunCoin10.png",
  "/shop_icons/AzureLaurelMedal24.png",
  "/shop_icons/AzureLaurelMedal29.png",
  "/shop_icons/AzureLaurelMedal4.png",
  // 41–50
  "/shop_icons/AzureSunCoin15.png",
  "/shop_icons/GlacialGloryMedal18.png",
  "/shop_icons/SapphireGloryMedal28.png",
  "/shop_icons/ArcaneSunCoin35.png",
  "/shop_icons/AmethystHonorCoin37.png",
  "/shop_icons/AmethystLaurelMedal39.png",
  "/shop_icons/AmethystValorMedal36.png",
  "/shop_icons/ArcaneGloryMedal43.png",
  "/shop_icons/GoldenHonorCoin47.png",
  "/shop_icons/GoldenValorMedal49.png",
];
// ============================================================================

// Магазин (50 позицій) — «картки» як у Trump’s Empire.
// Ціни підняті: експоненційно із м’яким множником та високою базою.
type ShopItem = { id: string; name: string; price: number };

const SHOP_ITEMS: ShopItem[] = Array.from({ length: 50 }, (_, i) => {
  const idx = i + 1;
  const BASE = 500;      // стартова ціна помітно вища
  const MULT = 1.28;     // плавне, але відчутне зростання
  const price = Math.round(BASE * Math.pow(MULT, i));

  const name =
    [
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
    ][i] || `Товар ${idx}`;
  return { id: `shop_${idx}`, name, price };
});

export default function ArtifactsPanel({ mgp, setMgp, addToCraft }: Props) {
  const tryBuy = (item: ShopItem) => {
    if (mgp < item.price) { alert("Не вистачає MGP"); return; }
    const placed = addToCraft(1);     // купівля = поставити L1 у крафт-сітку
    if (!placed) return;
    setMgp(v => v - item.price);
  };

  return (
    <section className="shop">
      <h2>Магазин артефактів</h2>
      <div className="shop-balance">Баланс: <b>{Math.floor(mgp).toLocaleString("uk-UA")}</b> mgp</div>

      <div className="shop-list">
        {SHOP_ITEMS.map((it, i) => {
          const enough = mgp >= it.price;
          const icon = ICONS[i]; // шлях до картинки з public/shop_icons
          return (
            <div key={it.id} className={`shop-item ${enough ? "can" : ""}`}>
              <div className="shop-left">
                {icon ? (
                  <img
                    src={icon}
                    alt={it.name}
                    className="shop-icon-img"
                    onError={(e) => { (e.currentTarget.style.display = "none"); }}
                  />
                ) : (
                  <div className="shop-icon">🜲</div>
                )}
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

      {/* невеликий fallback-стиль, якщо в CSS ще нема */}
      <style>{`
        .shop-list{ display:flex; flex-direction:column; gap:12px; }
        .shop-item{
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 14px; border-radius:14px;
          background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
        }
        .shop-left{ display:flex; align-items:center; gap:12px; min-width:0; }
        .shop-icon{ width:48px; height:48px; display:grid; place-items:center; font-size:22px; border-radius:10px;
          background: rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);}
        .shop-icon-img{ width:48px; height:48px; border-radius:10px; object-fit:contain; }
        .shop-title{ font-weight:700; }
        .shop-sub{ opacity:.85; font-size:14px; }
        .shop-buy{ padding:10px 14px; border-radius:12px; border:0; font-weight:800; cursor:pointer; }
        .shop-buy:disabled{ opacity:.5; cursor:default; }
      `}</style>
    </section>
  );
}
