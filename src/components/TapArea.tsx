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
    <section className="tap-area" style={{ textAlign: "center", padding: 12 }}>
      {/* Велика кнопка TAP */}
      <button className="tap-btn" style={p.tapStyle} onClick={p.onTap}>TAP</button>

      {/* Підпис під кнопкою */}
      <p className="tap-hint">Натискай, щоб збирати Часову Енергію</p>

      {/* Тільки текстовий таймер під кнопкою — без білої “карточки” зверху */}
      {p.meteorBuffLeft === 0 && !p.meteorVisible && (
        <div style={{ marginTop: 8, opacity: .9 }}>
          Метеор через ~{Math.max(0, p.meteorSpawnIn)}s
        </div>
      )}

      {/* Якщо метеор з’явився — клікабельний банер (він стилиться через .meteor у твоєму CSS) */}
      {p.meteorVisible && (
        <div className="meteor" onClick={p.onMeteorClick} title="Золотий Метеорит — натисни!">
          ✨ Золотий Метеорит! Натисни — x10 на 10s
        </div>
      )}
    </section>
  );
}
