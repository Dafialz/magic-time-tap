import React from "react";

type Props = {
  onTap: () => void;
  tapStyle?: React.CSSProperties;      // ігноруємо кольори, усе робить CSS
  meteorVisible: boolean;
  onMeteorClick: () => void;
  meteorBuffLeft: number;
  meteorSpawnIn: number;
};

export default function TapArea({
  onTap,
  meteorVisible,
  meteorSpawnIn,
}: Props) {
  return (
    <div className="tap-area">
      {/* саме місце для TAP у вигляді піскового годинника */}
      <button className="tap-btn tap-btn--hourglass" onClick={onTap} aria-label="Tap">
        <HourglassIcon />
        <span className="tap-btn__label">TAP</span>
      </button>

      {/* підказка під кнопкою (як на референсі) */}
      <p className="tap-hint">
        Натискай, щоб збирати Часову Енергію
        {!meteorVisible && (
          <> • Метеор через ~{Math.max(0, Math.floor(meteorSpawnIn))}s</>
        )}
      </p>
    </div>
  );
}

function HourglassIcon() {
  // лого-«пісочний годинник» з плавною обводкою; колір дає CSS (градієнт через background-clip)
  return (
    <svg
      className="tap-hourglass"
      width="84"
      height="84"
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
      {/* маленькі «перемички» як у мокапі */}
      <path d="M26 26h20M38 58h20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
