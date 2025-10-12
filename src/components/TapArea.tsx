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

  // Фільтруємо стилі, щоб нічого не перекривало картинку-кнопку
  const { background, backgroundImage, boxShadow, ...safeTapStyle } = tapStyle || {};

  return (
    <div className="tap-area">
      {/* HERO: великий водяний знак годинника під заголовком */}
      <div className="hero" aria-hidden="true">
        <div className="hero__bg" />
        <h1 className="hero__title">MAGIC TIME</h1>
      </div>

      {/* КНОПКА TAP = ЗОБРАЖЕННЯ /hero-hourglass.jpg */}
      <button
        className="tap-btn tap-btn--hourglass"
        onClick={onTap}
        aria-label="Tap"
        style={{
          ...safeTapStyle,
          background: "transparent",
          boxShadow: "none",
          backgroundImage: 'url("/hero-hourglass.jpg")',
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 8%",
          backgroundSize: "72%",
          width: "min(72vw, 420px)",
          height: "min(72vw, 420px)",
          padding: 0,
          border: "none",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
          filter: "drop-shadow(0 0 18px rgba(40,231,168,.45))",
          transition: "transform .08s ease, filter .15s ease",
        }}
      />

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

/** Формат чисел (1 234 567) */
function formatNumber(n: number) {
  return Math.floor(n).toLocaleString("uk-UA");
}
