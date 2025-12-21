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

/** На головній нічого не показуємо — заголовок у TapArea */
export default function HeaderBar(_: Props) {
  return null;
}
