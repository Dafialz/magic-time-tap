import React from "react";

type Props = {
  buyHcUpgrade: (cost: number, apply: () => void) => void;
  setClickPower: React.Dispatch<React.SetStateAction<number>>;
  setAutoPerSec: React.Dispatch<React.SetStateAction<number>>;
};

export default function HcShop({ buyHcUpgrade, setClickPower, setAutoPerSec }: Props) {
  return (
    <section className="hc-shop">
      <h2>Магазин HC</h2>
      <div className="hc-items">
        <div className="hc-item">
          <div>+5% до clickPower (перманентно)</div>
          <button onClick={() => buyHcUpgrade(1, () => setClickPower(cp => cp * 1.05))}>
            Купити (1 HC)
          </button>
        </div>
        <div className="hc-item">
          <div>+2% до autoPerSec (перманентно)</div>
          <button onClick={() => buyHcUpgrade(2, () => setAutoPerSec(a => a * 1.02))}>
            Купити (2 HC)
          </button>
        </div>
      </div>
    </section>
  );
}
