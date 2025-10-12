import React from "react";

type Props = {
  onTap: () => void;
  tapStyle?: React.CSSProperties;

  meteorVisible: boolean;
  onMeteorClick: () => void;
  meteorBuffLeft: number;
  meteorSpawnIn: number;
};

export default function TapArea({
  onTap,
  tapStyle,
  meteorVisible,
  onMeteorClick,
  meteorBuffLeft,
  meteorSpawnIn,
}: Props) {
  return (
    <section className="tap-area" aria-label="Зона натискань">
      <button
        type="button"
        className="tap-btn"
        style={tapStyle}
        onClick={onTap}
      >
        TAP
      </button>

      <div className="tap-hint">Натискай, щоб збирати Часову Енергію</div>

      {/* нижній текст-таймер, банер метеорита тепер у HERO секції */}
      <div style={{ marginTop: 10, opacity: 0.9, textAlign: "center" }}>
        {meteorVisible ? (
          <span role="button" onClick={onMeteorClick} style={{ cursor: "pointer" }}>
            ✨ Метеор активний • буст ще ~{Math.max(0, meteorBuffLeft)}s
          </span>
        ) : (
          <span>Метеор через ~{Math.max(0, meteorSpawnIn)}s</span>
        )}
      </div>
    </section>
  );
}
