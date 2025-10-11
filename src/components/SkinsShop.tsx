import React from "react";
import { SKINS } from "../systems/skins";

type Props = {
  ownedSkins: string[];
  equippedSkinId: string;
  buySkin: (id: string, price: number) => void;
};

export default function SkinsShop({ ownedSkins, equippedSkinId, buySkin }: Props) {
  return (
    <section className="skins">
      <h2>Крамниця Скiнів TAP</h2>
      <div className="inv-grid">
        {SKINS.map(s => {
          const owned = ownedSkins.includes(s.id);
          return (
            <div key={s.id} className={`inv-card ${owned && equippedSkinId === s.id ? "eq" : ""}`}>
              <div className="title">{s.name}</div>
              <div className="row">Ціна: {s.priceMM} MM</div>
              <button onClick={() => buySkin(s.id, s.priceMM)}>
                {owned ? (equippedSkinId === s.id ? "Активний" : "Увімкнути") : "Купити"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
