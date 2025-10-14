import React from "react";

type Props = {
  mgp: number;
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  addToCraft: (levelToPlace?: number) => boolean;
};

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
        {SHOP_ITEMS.map((it) => {
          const enough = mgp >= it.price;
          return (
            <div key={it.id} className={`shop-item ${enough ? "can" : ""}`}>
              <div className="shop-left">
                <div className="shop-icon">🜲</div>
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
    </section>
  );
}
