import React from "react";

type Props = {
  ce: number;
  mm: number;
  hc: number;
  level: number;

  epochName: string;
  epochMult: number;

  clickPower: number;
  autoPerSec: number;
  effectiveFarmMult: number;

  meteorBuffLeft: number;
  meteorMult: number;
};

export default function HeaderBar({
  ce, mm, hc, level,
  epochName, epochMult,
  clickPower, autoPerSec, effectiveFarmMult,
  meteorBuffLeft, meteorMult
}: Props) {
  return (
    <header className="header">
      {/* великий бірюзовий заголовок як у референсі */}
      <h1 className="hero__title">MAGIC TIME</h1>

      {/* компактний інфобар як картка зверху */}
      <div className="card header__stats">
        <div className="row">
          <strong>CE:</strong> {Math.floor(ce)}&nbsp;&nbsp;
          <strong>MM:</strong> {Math.floor(mm)}&nbsp;&nbsp;
          <strong>HC:</strong> {Math.floor(hc)}&nbsp;&nbsp;
          <strong>Lvl:</strong> {level}
        </div>
        <div className="row">
          <strong>Epoch:</strong> {epochName} (x{epochMult.toFixed(2)})&nbsp;&nbsp;
          <strong>Click:</strong> {clickPower}&nbsp;&nbsp;
          <strong>Auto/s:</strong> {autoPerSec}
        </div>
        <div className="row">
          <strong>Farm</strong> x{effectiveFarmMult.toFixed(2)}
          {meteorBuffLeft > 0 && (
            <span className="badge badge--meteor">
              ☄️ x{meteorMult.toFixed(1)} • {meteorBuffLeft}s
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
