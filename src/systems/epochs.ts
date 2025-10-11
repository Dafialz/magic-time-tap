// src/systems/epochs.ts
export type Epoch = {
  idx: number;
  name: string;
  mult: number;      // бонус до заробітку
  bg: string;        // css фон контейнера
};

export const EPOCHS: Epoch[] = [
  { idx: 0, name: "Початок Часу",         mult: 1.00, bg: "linear-gradient(180deg,#0b1220,#0b1628)" },
  { idx: 1, name: "Стародавній Єгипет",   mult: 1.10, bg: "linear-gradient(180deg,#1a1430,#2a1838)" },
  { idx: 2, name: "Римська Доба",         mult: 1.15, bg: "linear-gradient(180deg,#141c30,#18243b)" },
  { idx: 3, name: "Середньовіччя",        mult: 1.20, bg: "linear-gradient(180deg,#0e1f26,#0f2b33)" },
  { idx: 4, name: "Кіберпанк",            mult: 1.30, bg: "linear-gradient(180deg,#101629,#1e1a35)" },
  { idx: 5, name: "Космос",               mult: 1.40, bg: "linear-gradient(180deg,#0b0f2a,#11103a)" },
];

export function epochByLevel(level: number): Epoch {
  const idx = Math.max(0, Math.floor((level - 1) / 10));
  return EPOCHS[Math.min(idx, EPOCHS.length - 1)];
}
