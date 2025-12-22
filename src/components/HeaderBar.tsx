// src/components/HeaderBar.tsx
import React from "react";

type Props = {
  ce: number;
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

export default function HeaderBar(_: Props) {
  // ✅ ВИДАЛЕНО: кнопка мови + випадаючий список (вона була "зайвою кнопкою").
  // Залишаємо компонент як "noop", щоб App.tsx не треба було міняти.
  return null;
}
