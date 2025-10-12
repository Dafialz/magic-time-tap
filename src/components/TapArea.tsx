import React from "react";

type Props = {
  onTap: () => void;
  tapStyle?: React.CSSProperties;

  // залишаємо пропси для сумісності, але тут не відмальовуємо їх
  meteorVisible?: boolean;
  onMeteorClick?: () => void;
  meteorBuffLeft?: number;
  meteorSpawnIn?: number;
};

/**
 * Компактна TAP-зона під HERO:
 * - не показує фіолетову кнопку
 * - дозволяє тапати будь-де в зоні (див. .tap-area--hero у CSS)
 * - вигляд відповідає референсу (на екрані лише герої, стати і банер метеорита)
 */
export default function TapArea({ onTap }: Props) {
  return (
    <div
      className="tap-area tap-area--hero"
      onClick={onTap}
      aria-label="Tap area"
      role="button"
    />
  );
}
