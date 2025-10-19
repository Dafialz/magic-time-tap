import React from "react";
import { formatNum } from "../utils/format";

export type Upgrade = {
  id: string;
  name: string;
  level: number;
  baseCost: number;
  costMult: number;
  clickPowerBonus?: number;
  autoPerSecBonus?: number;
};

type Props = {
  upgrades: Upgrade[];
  ce: number;                 // лишаємо як є, щоб не ламати пропси
  getCost: (u: Upgrade) => number;
  buyUpgrade: (u: Upgrade) => void;
};

export default function UpgradesList({ upgrades, ce, getCost, buyUpgrade }: Props) {
  return (
    <section className="upgrades">
      <h2>Апгрейди</h2>
      <div className="upgrades-list">
        {upgrades.map(u => {
          const cost = getCost(u);
          const disabled = ce < cost;
          return (
            <div key={u.id} className="upgrade">
              <div className="u-info">
                <div className="u-name">{u.name} (рів. {u.level})</div>
                <div className="u-cost">Вартість: {formatNum(cost)} MTP</div>
              </div>
              <button onClick={() => buyUpgrade(u)} disabled={disabled}>Купити</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
