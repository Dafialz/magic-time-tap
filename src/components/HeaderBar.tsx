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
      {/* Верхній заголовок MAGIC TIME */}
      <h1 className="hero__title" style={{ margin: "12px 0 0", textAlign: "center" }}>
        MAGIC TIME
      </h1>
    </header>
  );
}

/** Форматування чисел під uk-UA */
function formatNumber(n: number) {
  return Math.floor(n).toLocaleString("uk-UA");
}
