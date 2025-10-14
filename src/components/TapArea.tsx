import React from "react";

type Props = {
  onTap: () => void;
  tapStyle?: React.CSSProperties;

  currentEnergy: number;

  meteorVisible: boolean;
  onMeteorClick: () => void;
  meteorBuffLeft: number;
  meteorSpawnIn: number;

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
      {/* HERO */}
      <div className="hero" style={{ position: "relative", userSelect: "none" }}>
        <h1 className="hero__title" style={{ pointerEvents: "none" }}>MAGIC TIME</h1>

        {/* Годинник фіксованого розміру */}
        <div className="hero__clock">
          <img
            src="/hero-hourglass.png"
            alt=""
            aria-hidden="true"
            className="hero__img"
            decoding="async"
          />
          {/* клікабельна зона рівно по годиннику */}
          <button
            type="button"
            className="hero__tap"
            onClick={onTap}
            aria-label="Tap"
          />
        </div>
      </div>

      {/* CE */}
      <section className="stat-card" aria-live="polite">
        <div className="stat-card__caption">Космічна енергія</div>
        <div className="stat-card__value">{formatNumber(currentEnergy)}</div>
      </section>

      {/* Метеор */}
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

      <p className="tap-hint">
        Натискай, щоб збирати Часову Енергію
        {!meteorVisible && <> • Метеор через ~{spawnIn}s</>}
      </p>
    </div>
  );
}

function formatNumber(n: number) {
  return Math.floor(n).toLocaleString("uk-UA");
}
