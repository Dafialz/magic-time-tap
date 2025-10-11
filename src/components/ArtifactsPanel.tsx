import React from "react";
import type { ArtifactInstance } from "../core/storage";
import { getArtifactById } from "../systems/artifacts";

type Props = {
  artifacts: ArtifactInstance[];
  equippedIds: string[];
  toggleEquip: (id: string) => void;
};

export default function ArtifactsPanel({ artifacts, equippedIds, toggleEquip }: Props) {
  return (
    <section className="artifacts">
      <h2>Артефакти <small>(екіпуйте до 3)</small></h2>
      {artifacts.length === 0 && <div>Поки немає артефактів. Перемагай босів — може дропнути!</div>}
      <div className="inv-grid">
        {artifacts.map(a => {
          const meta = getArtifactById(a.id)!;
          const equipped = equippedIds.includes(a.id);
          return (
            <div key={a.id} className={`inv-card ${equipped ? "eq" : ""}`}>
              <div className="title">{meta.name}</div>
              <div className="row">Рівень: {a.level}</div>
              <div className="row">Рідкість: {meta.rarity}</div>
              <div className="row">
                Бонус:&nbsp;
                {meta.bonus.allMult ? `все +${Math.round(meta.bonus.allMult*100)}%`
                  : [
                      meta.bonus.clickMult ? `клік +${Math.round(meta.bonus.clickMult*100)}%` : "",
                      meta.bonus.autoMult  ? `авто +${Math.round(meta.bonus.autoMult*100)}%` : "",
                      meta.bonus.farmMult  ? `фарм +${Math.round(meta.bonus.farmMult*100)}%` : "",
                    ].filter(Boolean).join(", ")
                }
              </div>
              <button onClick={() => toggleEquip(a.id)}>
                {equipped ? "Зняти" : (equippedIds.length < 3 ? "Екіпувати" : "Місць немає")}
              </button>
            </div>
          );
        })}
      </div>
      {equippedIds.length > 0 && (
        <div className="equipped-note">
          Активні: {equippedIds.map(id => getArtifactById(id)?.name).join(", ")}.
        </div>
      )}
    </section>
  );
}
