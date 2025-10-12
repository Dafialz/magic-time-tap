import React from "react";
import { formatNum } from "../utils/format";

type Props = {
  ce: number; mm: number; hc: number; level: number;
  epochName: string; epochMult: number;
  clickPower: number; autoPerSec: number;
  effectiveFarmMult: number;
  meteorBuffLeft: number; meteorMult: number;
};

export default function HeaderBar(p: Props) {
  return (
    <header className="card" style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Magic Time: Chrono Legends — MVP</div>
      <div className="topbar" style={{ display: "flex", flexWrap: "wrap", gap: 10, opacity: .9 }}>
        <div>CE: <b>{formatNum(p.ce)}</b></div>
        <div>MM: <b>{formatNum(p.mm)}</b></div>
        <div>HC: <b>{p.hc}</b></div>
        <div>Lvl: <b>{p.level}</b></div>
        <div>Epoch: <b>{p.epochName}</b> (x{p.epochMult.toFixed(2)})</div>
        <div>Click: <b>{formatNum(p.clickPower)}</b></div>
        <div>Auto/s: <b>{formatNum(p.autoPerSec)}</b></div>
        <div>Farm x<b>{p.effectiveFarmMult.toFixed(2)}</b></div>
        {p.meteorBuffLeft > 0 && <div>🔥 x{p.meteorMult} • {p.meteorBuffLeft}s</div>}
      </div>
    </header>
  );
}
