import React from "react";
import type { Rarity } from "../systems/crafting";

type Props = {
  rarityCount: Record<Rarity, number>;
  canCraft: (r: Rarity) => boolean;
  craftRarity: (r: Rarity) => void;
};

const RARITIES: Rarity[] = ["common","rare","epic","legendary"];

export default function CraftPanel({ rarityCount, canCraft, craftRarity }: Props) {
  return (
    <section className="craft">
      <h2>Крафт артефактів</h2>
      <p>3 × однієї рідкості → 1 × наступної (у межах відкритих тирів).</p>
      <div className="inv-grid">
        {RARITIES.map((r) => {
          const can = canCraft(r);
          const next = r === "common" ? "rare" :
                       r === "rare" ? "epic" :
                       r === "epic" ? "legendary" : "—";
          return (
            <div key={r} className="inv-card">
              <div className="title" style={{ textTransform: "capitalize" }}>
                {r} → {next}
              </div>
              <div className="row">В тебе: {rarityCount[r] ?? 0} шт.</div>
              <div className="row">Статус: {next !== "—" ? (can ? "можна крафтити" : "потрібно 3 шт.") : "максимум"}</div>
              <button disabled={!can || next === "—"} onClick={() => craftRarity(r)}>
                Скрафтити
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
