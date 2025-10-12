import React from "react";

type Props = {
  // TAP
  onTap: () => void;
  tapStyle?: React.CSSProperties;

  // CE (динамічне значення)
  currentEnergy: number;

  // Метеор
  meteorVisible: boolean;
  onMeteorClick: () => void;
  meteorBuffLeft: number;   // сек залишку бафа (якщо активний)
  meteorSpawnIn: number;    // сек до появи (якщо неактивний)

  // (необов’язково) відображення бонусу на банері
  meteorBonus?: number;      // скільки додасть (для відмальовки)
  meteorMultiplier?: number; // xN праворуч
};

export default function TapArea({
  onTap,
  tapStyle,
  currentEnergy,
  meteorVisible,
  onMeteorClick,
  meteorBuffLeft,
  meteorSpawnIn,
  meteorBonus = 0,
  meteorMultiplier = 10,
}: Props) {
  const spawnIn = Math.max(0, Math.floor(meteorSpawnIn));
  const buffLeft = Math.max(0, Math.floor(meteorBuffLeft));

  return (
    <div className="tap-area">
      {/* HERO: водяний знак годинника + великий заголовок */}
      <div className="hero" aria-hidden="true">
        <div className="hero__bg" />
        <h1 className="hero__title">MAGIC TIME</h1>
      </div>

      {/* Великий пісковий годинник (кнопка TAP) */}
      <button
        className="tap-btn tap-btn--hourglass"
        onClick={onTap}
        aria-label="Tap"
        style={tapStyle}
      >
        <HourglassIcon />
        <span className="tap-btn__label">TAP</span>
      </button>

      {/* CE — скляна картка */}
      <section className="stat-card" aria-live="polite">
        <div className="stat-card__caption">Косм. Енергія</div>
        <div className="stat-card__value">{formatNumber(currentEnergy)}</div>
      </section>

      {/* Банер «Золотий Метеорит» */}
      <button
        className={`meteor-card${meteorVisible ? " meteor-card--active" : ""}`}
        onClick={meteorVisible ? onMeteorClick : undefined}
        aria-label="Золотий Метеорит"
      >
        <div className="meteor-card__icon">☄️</div>

        <div className="meteor-card__text">
          <div className="meteor-card__title">
            {meteorVisible ? "Написати, щоб зібрати" : `Метеор через ~${spawnIn}s`}
          </div>
          <div className="meteor-card__subtitle">
            Золотий Метеорит{meteorVisible && buffLeft > 0 ? ` • ${buffLeft}s` : ""}
          </div>
        </div>

        <div className="meteor-card__bonus">
          <span>{meteorVisible ? `+${formatNumber(meteorBonus)}` : "+0"}</span>
          <small>{`x${meteorMultiplier}`}</small>
        </div>
      </button>

      {/* Хінт під кнопкою */}
      <p className="tap-hint">
        Натискай, щоб збирати Часову Енергію
        {!meteorVisible && <> • Метеор через ~{spawnIn}s</>}
      </p>
    </div>
  );
}

/** Лого-«пісочний годинник» */
function HourglassIcon() {
  return (
    <svg
      className="tap-hourglass"
      width="132"
      height="132"
      viewBox="0 0 84 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 14h48L50 36l16 22H18l16-22L18 14Z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* перемички як у мокапі */}
      <path d="M26 26h20M38 58h20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/** Формат чисел (1 234 567) */
function formatNumber(n: number) {
  return Math.floor(n).toLocaleString("uk-UA");
}
