import React from "react";

type Props = {
  // TAP
  onTap: () => void;
  tapStyle?: React.CSSProperties;

  // CE
  currentEnergy: number;

  // Метеор
  meteorVisible: boolean;
  onMeteorClick: () => void;
  meteorBuffLeft: number;
  meteorSpawnIn: number;

  // (необов’язково)
  meteorBonus?: number;
  meteorMultiplier?: number;
};

export default function TapArea({
  onTap,
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
      {/* HERO-КНОПКА: годинник під літерами, тап по всій шапці */}
      <button
        type="button"
        className="hero hero--tap"
        onClick={onTap}
        aria-label="Tap"
      >
        <div className="hero__bg" aria-hidden="true" />
        <h1 className="hero__title">MAGIC TIME</h1>
      </button>

      {/* CE — скляна картка */}
      <section className="stat-card" aria-live="polite">
        <div className="stat-card__caption">Косм. Енергія</div>
        <div className="stat-card__value">{formatNumber(currentEnergy)}</div>
      </section>

      {/* Банер «Золотий Метеорит» */}
      <button
        type="button"
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

/** Формат чисел (1 234 567) */
function formatNumber(n: number) {
  return Math.floor(n).toLocaleString("uk-UA");
}
