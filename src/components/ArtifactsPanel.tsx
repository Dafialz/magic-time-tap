import React from "react";

type Props = {
  mgp: number;
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  addToCraft: (levelToPlace?: number) => boolean;
};

// 50 товарів магазину (ціна росте плавно)
type ShopItem = { id: string; name: string; price: number };

const SHOP_ITEMS: ShopItem[] = Array.from({ length: 50 }, (_, i) => {
  const idx = i + 1;
  const base = 25;           // стартова ціна
  const mult = 1.18;         // м’який приріст
  const price = Math.round(base * Math.pow(mult, i)); // ≈ експоненційне зростання
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
    const placed = addToCraft(1);
    if (!placed) return;
    setMgp(v => v - item.price);
  };

  return (
    <section className="shop">
      <h2>Магазин артефактів</h2>
      <p style={{ marginTop: 6, opacity: 0.9 }}>
        Баланс: <b>{Math.floor(mgp).toLocaleString("uk-UA")}</b> mgp
      </p>

      <div className="inv-grid">
        {SHOP_ITEMS.map((it) => (
          <div key={it.id} className="inv-card">
            <div className="title">{it.name}</div>
            <div className="row">Ціна: {it.price.toLocaleString("uk-UA")} mgp</div>
            <button onClick={() => tryBuy(it)} disabled={mgp < it.price}>
              {mgp >= it.price ? "Купити" : "Не вистачає"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
