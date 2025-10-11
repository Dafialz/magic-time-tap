import React from "react";

type Props = {
  onTap: () => void;
  tapStyle: React.CSSProperties;
  meteorVisible: boolean;
  onMeteorClick: () => void;
  meteorBuffLeft: number;
  meteorSpawnIn: number;
};

export default function TapArea(p: Props) {
  return (
    <section className="tap-area" style={{ textAlign: "center", padding: 16 }}>
      <button className="tap-btn" style={p.tapStyle} onClick={p.onTap}>TAP</button>
      <p>Натискай, щоб збирати Часову Енергію</p>

      {p.meteorVisible && (
        <div className="meteor" onClick={p.onMeteorClick} title="Золотий Метеорит — натисни!">
          ✨ Золотий Метеорит! Натисни — x10 на 10s
        </div>
      )}
      {p.meteorBuffLeft === 0 && !p.meteorVisible && (
        <small>Метеор через ~{p.meteorSpawnIn}s</small>
      )}
    </section>
  );
}
