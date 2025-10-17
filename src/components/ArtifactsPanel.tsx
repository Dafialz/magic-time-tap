// src/components/ArtifactsPanel.tsx
import React from "react";
import { shopPriceAt } from "../systems/economy";
import { BLUE_ICONS, PURPLE_ICONS, ICONS_IN_ORDER } from "../systems/shop_icons";

type Props = {
  mgp: number;
  setMgp: React.Dispatch<React.SetStateAction<number>>;
  addToCraft: (levelToPlace?: number) => boolean;
};

/* ================= ІКОНКИ ТЕПЕР ІЗ systems/shop_icons.ts =================
   Порядок: BLUE (дешеві) → PURPLE → GOLD (дорогі).
*/
const BLUE_END = BLUE_ICONS.length;
const PURPLE_END = BLUE_ICONS.length + PURPLE_ICONS.length;

type Tier = "blue" | "purple" | "gold";
const tierByIndex = (i: number): Tier =>
  i < BLUE_END ? "blue" : i < PURPLE_END ? "purple" : "gold";

/* ================= Модель магазину ================= */
type ShopItem = { id: string; name: string; price: number; tier: Tier; icon: string };

const NAMES: string[] = [
  "Grain of Time","Chrono Spark","Mini Clock","Quartz Sand","Tick Module",
  "Nanosand","Chrono Dust","Minor Spiral","Wave Clock","Stream of Seconds",
  "Scythe of Time","Blade of the Moment","Glass Core","Pulse Geode","Resonator m1",
  "Resonator m2","Resonator m3","Resonator m4","Resonator m5","Crystal Δ",
  "Crystal Ω","Crystal Σ","Edge of Epoch","Portalite","Chrono Drop",
  "Chrono Spring","Node m7","Node m8","Node m9","Node m10",
  "Sync Core","Astral Sand","Chalice of Moments","Sphere of Rhythm","Quantum Dust",
  "Heart of the Clock","Spring of Ages","Echo Beacon","Cesium Isotope","Rotor V",
  "Rotor VI","Rotor VII","Rotor VIII","Rotor IX","Rotor X",
  "Radiance Δ","Radiance Ω","Radiance Σ","Time Fold","Archiflux"
];

// ↓↓↓ Ціни з systems/economy.ts (налаштовано під 270 днів) ↓↓↓
const SHOP_ITEMS: ShopItem[] = NAMES.map((name, i) => ({
  id: `shop_${i + 1}`,
  name,
  price: shopPriceAt(i + 1),
  tier: tierByIndex(i),
  icon: ICONS_IN_ORDER[i] || "",
}));

/* ====== Іконка з простим fallback (без DOM-маніпуляцій) ====== */
function IconWithFallback({ src, name, tier }: { src?: string; name: string; tier: Tier }) {
  const [broken, setBroken] = React.useState(false);
  if (!src || broken) {
    const ch = (name || "?").trim().charAt(0).toUpperCase() || "•";
    return <div className={`badge-fallback tier-${tier}`}>{ch}</div>;
  }
  return <img src={src} alt={name} className="shop-icon-img" onError={() => setBroken(true)} />;
}

export default function ArtifactsPanel({ mgp, setMgp, addToCraft }: Props) {
  const tryBuy = (item: ShopItem) => {
    if (mgp < item.price) { alert("Не вистачає MGP"); return; }
    const placed = addToCraft(1);
    if (!placed) return;
    setMgp(v => v - item.price);
  };

  return (
    <section className="shop">
      <h2>Магазин артефактів</h2>
      <div className="shop-balance">Баланс: <b>{Math.floor(mgp).toLocaleString("uk-UA")}</b> mgp</div>

      <div className="shop-list">
        {SHOP_ITEMS.map((it) => {
          const enough = mgp >= it.price;
          return (
            <div key={it.id} className={`shop-item ${enough ? "can" : ""} tier-${it.tier}`}>
              <div className="shop-left">
                <IconWithFallback src={it.icon} name={it.name} tier={it.tier} />
                <div className="shop-text">
                  <div className="shop-title">{it.name}</div>
                  <div className="shop-sub">Ціна: {it.price.toLocaleString("uk-UA")} mgp</div>
                </div>
              </div>
              <button className="shop-buy" disabled={!enough} onClick={() => tryBuy(it)}>
                {enough ? "КУПИТИ" : "Не вистачає"}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .shop-list{ display:flex; flex-direction:column; gap:12px; }
        .shop-item{
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 14px; border-radius:14px;
          background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
        }
        .shop-left{ display:flex; align-items:center; gap:12px; min-width:0; }
        .shop-icon-img{ width:48px; height:48px; border-radius:10px; object-fit:contain; }
        .badge-fallback{
          width:48px; height:48px; border-radius:10px; display:grid; place-items:center;
          font-weight:800; letter-spacing:.3px;
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
          border:1px solid rgba(255,255,255,.12);
        }
        .shop-title{ font-weight:700; }
        .shop-sub{ opacity:.85; font-size:14px; }
        .shop-buy{ padding:10px 14px; border-radius:12px; border:0; font-weight:800; cursor:pointer; }
        .shop-buy:disabled{ opacity:.5; cursor:default; }

        /* Оріоли по тiрах */
        .tier-blue .shop-icon-img, .tier-blue .badge-fallback{ box-shadow: 0 0 0 2px rgba(80,200,255,.35), inset 0 0 18px rgba(80,200,255,.15); }
        .tier-purple .shop-icon-img, .tier-purple .badge-fallback{ box-shadow: 0 0 0 2px rgba(185,120,255,.35), inset 0 0 18px rgba(185,120,255,.18); }
        .tier-gold .shop-icon-img, .tier-gold .badge-fallback{ box-shadow: 0 0 0 2px rgba(255,210,90,.45), inset 0 0 18px rgba(255,210,90,.25); }
      `}</style>
    </section>
  );
}
