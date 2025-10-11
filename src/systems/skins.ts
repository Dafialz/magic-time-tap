// src/systems/skins.ts
export type Skin = {
  id: string;
  name: string;
  priceMM: number; // скільки коштує у Магічних Монетах
  tapStyle: {      // простий стиль для TAP-кнопки
    background: string;
    color: string;
    boxShadow?: string;
  };
};

export const SKINS: Skin[] = [
  { id: "classic",  name: "Класика",       priceMM: 0,   tapStyle: { background: "#7c3aed", color: "#fff" } },
  { id: "emerald",  name: "Емеральд",      priceMM: 120, tapStyle: { background: "#10b981", color: "#04120c" } },
  { id: "sunflare", name: "Сонячний Спалах", priceMM: 250, tapStyle: { background: "linear-gradient(45deg,#ffdd55,#ff7b00)", color: "#2b1600" } },
  { id: "quantum",  name: "Квантовий",     priceMM: 500, tapStyle: { background: "linear-gradient(45deg,#00f0ff,#7c3aed)", color: "#06101a", boxShadow: "0 0 18px rgba(0,240,255,.6)" } },
];

export function getSkinById(id: string) {
  return SKINS.find(s => s.id === id);
}
