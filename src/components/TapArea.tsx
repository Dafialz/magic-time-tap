import React from "react";

type Props = {
  onTap: () => void;
  tapStyle?: React.CSSProperties;

  // залишаємо пропси для сумісності з існуючим кодом
  meteorVisible?: boolean;
  onMeteorClick?: () => void;
  meteorBuffLeft?: number;
  meteorSpawnIn?: number;
};

/**
 * TAP-кнопка у вигляді піскового годинника (як у референсі).
 * Стилі лежать у .tap-btn, .tap-btn__glass.
 */
export default function TapArea({ onTap }: Props) {
  return (
    <div className="tap-area">
      <button className="tap-btn" onClick={onTap} aria-label="Tap">
        <svg className="tap-btn__glass" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="4">
          {/* контур верхнього трикутника */}
          <path d="M16 14h40L40 34h-8L16 14z" />
          {/* контур нижнього трикутника */}
          <path d="M16 58h40L40 38h-8L16 58z" />
          {/* горизонтальні риски (як у логотипі) */}
          <path d="M24 26h14M34 46h14" />
        </svg>
        <span className="tap-btn__label">TAP</span>
      </button>
      <div className="tap-hint">Натискай, щоб збирати Часову Енергію</div>
    </div>
  );
}
