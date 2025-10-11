import React from "react";
import type { BossDef } from "../systems/bosses";
import { formatNum } from "../utils/format";

type Props = {
  level: number;
  isBossLevel: boolean;
  bossActive: boolean;
  bossData: BossDef | null;
  bossRetryCooldown: number;
  startBossFight: () => void;

  bossHP: number; bossMaxHP: number; bossTimeLeft: number;
  bossHPpct: number; bossTimePct: number;
};

export default function BossPanel(p: Props) {
  if (!p.isBossLevel) return null;

  return (
    <section className="boss">
      <h2>Бос рівня {p.level}</h2>
      {!p.bossActive ? (
        <div>
          <button onClick={p.startBossFight} disabled={p.bossRetryCooldown > 0}>Викликати боса</button>
          {p.bossRetryCooldown > 0 && (
            <div style={{ opacity: 0.8, marginTop: 6 }}>Кулдаун: {p.bossRetryCooldown}s</div>
          )}
        </div>
      ) : (
        <div className="boss-ui">
          <div><b>{p.bossData?.name}</b></div>
          <div>HP: {formatNum(p.bossHP)} / {formatNum(p.bossMaxHP)}</div>
          <div className="bar"><div className="bar-fill" style={{ width: p.bossHPpct + "%" }} /></div>
          <div>Час: {Math.max(0, p.bossTimeLeft)}s</div>
          <div className="bar"><div className="bar-fill bar-time" style={{ width: p.bossTimePct + "%" }} /></div>
        </div>
      )}
    </section>
  );
}
