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
    <header className="header-bar">
      {/* Скляна картка зі статами. Прокручується разом із сторінкою */}
      <div className="card header__stats" role="group" aria-label="Поточні стати">
        <div className="row" aria-label="Ресурси та рівень">
          <strong>CE:</strong>&nbsp;{formatNumber(ce)}&nbsp;&nbsp;
          <strong>MM:</strong>&nbsp;{formatNumber(mm)}&nbsp;&nbsp;
          <strong>HC:</strong>&nbsp;{formatNumber(hc)}&nbsp;&nbsp;
          <strong>Lvl:</strong>&nbsp;{level}
        </div>

        <div className="row" aria-label="Множники та швидкість">
          <strong>Epoch:</strong>&nbsp;{epochName}&nbsp;(x{epochMult.toFixed(2)})&nbsp;&nbsp;
          <strong>Click:</strong>&nbsp;{formatNumber(clickPower)}&nbsp;&nbsp;
          <strong>Auto/s:</strong>&nbsp;{formatNumber(autoPerSec)}
        </div>

        <div className="row" aria-label="Фарм множник і метеор-баф">
          <strong>Farm</strong>&nbsp;x{effectiveFarmMult.toFixed(2)}
          {meteorBuffLeft > 0 && (
            <span className="badge badge--meteor" style={{ marginLeft: 10 }}>
              ☄️ x{meteorMult.toFixed(1)} • {meteorBuffLeft}s
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

/** Форматування чисел під uk-UA */
function formatNumber(n: number) {
  return Math.floor(n).toLocaleString("uk-UA");
}
