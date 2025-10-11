import { useEffect, useMemo, useState } from "react";
import { loadState, scheduleSave, wipeSave } from "./core/storage";
import type { SaveState, ArtifactInstance } from "./core/storage";

import { calcBossHP, calcRewards, getBossByTier } from "./systems/bosses";
import type { BossDef, BossTier } from "./systems/bosses";

import { epochByLevel } from "./systems/epochs";
import type { Epoch } from "./systems/epochs";

import { GOLDEN_METEOR, nextMeteorIn } from "./systems/events";

import { rollArtifactId, getArtifactById, aggregateArtifacts } from "./systems/artifacts";
import type { AggregatedBonus } from "./systems/artifacts";

import { getSkinById } from "./systems/skins";

import { countByRarity, nextRarity, rollByRarity } from "./systems/crafting";
import type { Rarity } from "./systems/crafting";

import { formatNum } from "./utils/format";

// UI
import HeaderBar from "./components/HeaderBar";
import TapArea from "./components/TapArea";
import BossPanel from "./components/BossPanel";
import UpgradesList, { Upgrade } from "./components/UpgradesList";
import ArtifactsPanel from "./components/ArtifactsPanel";
import CraftPanel from "./components/CraftPanel";
import SkinsShop from "./components/SkinsShop";
import HcShop from "./components/HcShop";

export default function App() {
  // ===== Telegram WebApp integration (ready + colors)
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp; // <- кастинг щоб TS не лаявся
    if (!tg) return;
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor?.("#0b1220");
      tg.setBackgroundColor?.("#0b1220");
    } catch {}
  }, []);

  // ===== Валюти/стани
  const [ce, setCe] = useState<number>(0);
  const [mm, setMm] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [clickPower, setClickPower] = useState<number>(1);
  const [autoPerSec, setAutoPerSec] = useState<number>(0);
  const [farmMult, setFarmMult] = useState<number>(1);
  const [hc, setHc] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [prestiges, setPrestiges] = useState<number>(0);

  // Апгрейди
  const initialUpgrades: Upgrade[] = [
    { id: "u1", name: "Пісочний Годинник", level: 0, baseCost: 10, costMult: 1.15, clickPowerBonus: 1 },
    { id: "u2", name: "Міні Вежа", level: 0, baseCost: 100, costMult: 1.18, autoPerSecBonus: 0.5 },
    { id: "u3", name: "Хронокристалічний Ротор", level: 0, baseCost: 1000, costMult: 1.2, clickPowerBonus: 5, autoPerSecBonus: 2 },
  ];
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);

  // Epoch
  const epoch: Epoch = useMemo(() => epochByLevel(level), [level]);
  const epochMult = epoch.mult;

  // Boss
  const bossTier: BossTier | 0 = useMemo(() => Math.floor(level / 10) as BossTier | 0, [level]);
  const isBossLevel = level >= 10 && level % 10 === 0;

  const [bossActive, setBossActive] = useState(false);
  const [bossHP, setBossHP] = useState<number>(0);
  const [bossMaxHP, setBossMaxHP] = useState<number>(0);
  const [bossData, setBossData] = useState<BossDef | null>(null);
  const [bossTimeLeft, setBossTimeLeft] = useState<number>(0);
  const [bossRetryCooldown, setBossRetryCooldown] = useState<number>(0);

  // Meteor
  const [meteorVisible, setMeteorVisible] = useState(false);
  const [meteorBuffLeft, setMeteorBuffLeft] = useState(0);
  const [meteorSpawnIn, setMeteorSpawnIn] = useState<number>(() => nextMeteorIn(GOLDEN_METEOR));

  // Artifacts / Inventory
  const [artifacts, setArtifacts] = useState<ArtifactInstance[]>([]);
  const [equippedIds, setEquippedIds] = useState<string[]>([]); // <= 3

  // Skins (cosmetics)
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["classic"]);
  const [equippedSkinId, setEquippedSkinId] = useState<string>("classic");

  // ===== LOAD SAVE (+ офлайн)
  useEffect(() => {
    const s = loadState();
    const now = Date.now();
    if (!s) return;

    setCe(s.ce ?? 0);
    setMm(s.mm ?? 0);
    setTotalEarned(s.totalEarned ?? 0);
    setClickPower(s.clickPower ?? 1);
    setAutoPerSec(s.autoPerSec ?? 0);
    setFarmMult(s.farmMult ?? 1);
    setHc(s.hc ?? 0);
    setLevel(s.level ?? 1);
    setPrestiges(s.prestiges ?? 0);

    if (Array.isArray(s.upgrades)) {
      setUpgrades(prev =>
        prev.map(u => {
          const found = s.upgrades.find((x: { id: string; level: number }) => x.id === u.id);
          return found ? { ...u, level: found.level } : u;
        })
      );
    }

    setArtifacts(s.artifacts ?? []);
    setEquippedIds(s.equippedArtifactIds ?? []);
    setOwnedSkins(s.ownedSkins ?? ["classic"]);
    setEquippedSkinId(s.equippedSkinId ?? "classic");

    if (s.lastSeenAt && s.autoPerSec) {
      const secsAway = Math.min(12 * 3600, Math.floor((now - s.lastSeenAt) / 1000));
      const gain = s.autoPerSec * epochByLevel(s.level ?? 1).mult * s.farmMult * secsAway;
      if (gain > 0) {
        setCe(v => v + gain);
        setTotalEarned(te => te + gain);
        setTimeout(() => alert(`Поки тебе не було: +${formatNum(gain)} CE`), 60);
      }
    }
  }, []);

  // ===== AUTOSAVE
  useEffect(() => {
    const payload: SaveState = {
      ce, mm, totalEarned, clickPower, autoPerSec, farmMult, hc, level, prestiges,
      upgrades: upgrades.map(u => ({ id: u.id, level: u.level })),
      lastSeenAt: Date.now(),
      artifacts,
      equippedArtifactIds: equippedIds,
      ownedSkins,
      equippedSkinId,
    };
    scheduleSave(payload);
  }, [ce, mm, totalEarned, clickPower, autoPerSec, farmMult, hc, level, prestiges, upgrades, artifacts, equippedIds, ownedSkins, equippedSkinId]);

  // ==== Артефакти → агрегація бонусів
  const artifactLevels: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of artifacts) map[a.id] = a.level;
    return map;
  }, [artifacts]);

  const artAgg: AggregatedBonus = useMemo(
    () => aggregateArtifacts(equippedIds, artifactLevels),
    [equippedIds, artifactLevels]
  );

  // Ефективні множники
  const meteorMult = meteorBuffLeft > 0 ? GOLDEN_METEOR.mult : 1;
  const effectiveClickMult = (1 + artAgg.click) * meteorMult * epochMult * farmMult;
  const effectiveAutoMult  = (1 + artAgg.auto)  * meteorMult * epochMult * farmMult;
  const effectiveFarmMult  = (1 + artAgg.farm)  * epochMult * farmMult;

  // TAP
  const onClickTap = () => {
    const inc = clickPower * effectiveClickMult;
    setCe(prev => prev + inc);
    setTotalEarned(te => te + inc);
    if (bossActive) setBossHP(hp => Math.max(0, hp - clickPower));
  };

  // автофарм + таймери
  useEffect(() => {
    const id = window.setInterval(() => {
      if (autoPerSec > 0) {
        const inc = autoPerSec * effectiveAutoMult;
        setCe(prev => prev + inc);
        setTotalEarned(te => te + inc);
        if (bossActive) setBossHP(hp => Math.max(0, hp - autoPerSec));
      }
      if (bossActive && bossTimeLeft > 0) setBossTimeLeft(t => Math.max(0, t - 1));
      if (bossRetryCooldown > 0) setBossRetryCooldown(t => Math.max(0, t - 1));

      if (meteorBuffLeft > 0) setMeteorBuffLeft(t => Math.max(0, t - 1));
      else {
        setMeteorSpawnIn(t => {
          if (meteorVisible) return t;
          const nt = Math.max(0, t - 1);
          if (nt === 0) setMeteorVisible(true);
          return nt;
        });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [autoPerSec, effectiveAutoMult, bossActive, bossTimeLeft, bossRetryCooldown, meteorBuffLeft, meteorVisible]);

  const onMeteorClick = () => {
    setMeteorVisible(false);
    setMeteorBuffLeft(GOLDEN_METEOR.activeSecs);
    setMeteorSpawnIn(nextMeteorIn(GOLDEN_METEOR));
  };

  // ==== Boss start / finish
  const startBossFight = () => {
    if (bossRetryCooldown > 0) return;
    const tier = bossTier as BossTier;
    const def = getBossByTier(tier);
    if (!def) return;
    const hp = calcBossHP(def.baseHP, def.epochBonus, prestiges);
    setBossData(def);
    setBossActive(true);
    setBossHP(hp);
    setBossMaxHP(hp);
    setBossTimeLeft(def.durationSec);
  };

  useEffect(() => {
    if (!bossActive) return;

    if (bossHP <= 0 && bossData) {
      const { ceMult, mmDrop, artifactChance } = calcRewards(bossData.tier, prestiges);
      setFarmMult(m => m * ceMult);
      setMm(prev => prev + mmDrop);

      const rolled = Math.random() < artifactChance;
      let dropMsg = "";
      if (rolled) {
        const id = rollArtifactId(bossData.tier);
        setArtifacts(prev => {
          const idx = prev.findIndex(a => a.id === id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], level: copy[idx].level + 1 };
            dropMsg = ` Випав дуплікат: ${getArtifactById(id)?.name} → рівень ${copy[idx].level}.`;
            return copy;
          } else {
            dropMsg = ` Новий артефакт: ${getArtifactById(id)?.name}!`;
            return [...prev, { id, level: 1 }];
          }
        });
      }

      alert(`💥 Боса подолано! Farm x${ceMult.toFixed(2)}; MM +${mmDrop}.${dropMsg}`);
      setBossActive(false); setBossHP(0); setBossMaxHP(0); setBossTimeLeft(0); setBossData(null);
      setLevel(l => l + 1);
      return;
    }

    if (bossTimeLeft <= 0 && bossHP > 0 && bossData) {
      alert(`⏳ ${bossData.name} утік. Повтор через ${bossData.fleeCooldownSec}s.`);
      setBossActive(false); setBossHP(0); setBossMaxHP(0); setBossData(null);
      setBossRetryCooldown(bossData.fleeCooldownSec);
      return;
    }
  }, [bossActive, bossHP, bossTimeLeft, bossData, prestiges]);

  // ==== Upgrades
  const buyUpgrade = (u: Upgrade) => {
    const cost = Math.floor(u.baseCost * Math.pow(u.costMult, u.level));
    if (ce < cost) return;
    setCe(prev => prev - cost);
    setUpgrades(prev => prev.map(x => (x.id === u.id ? { ...x, level: x.level + 1 } : x)));
    setClickPower(cp => cp + (u.clickPowerBonus ?? 0));
    setAutoPerSec(a => a + (u.autoPerSecBonus ?? 0));
    setLevel(l => l + 1);
  };
  const getCost = (u: Upgrade) => Math.floor(u.baseCost * Math.pow(u.costMult, u.level));

  // ==== Prestige
  const canPrestige = level >= 10;
  const performPrestige = () => {
    if (!canPrestige) return;
    const gained = Math.floor(totalEarned / 10000);
    if (gained <= 0) { alert("Немає достатньо заробітку для Хронокристалів. Грайте далі!"); return; }
    setHc(h => h + gained);
    setPrestiges(p => p + 1);
    setCe(0); setMm(0); setTotalEarned(0);
    setClickPower(1 + gained * 0.5);
    setAutoPerSec(0 + gained * 0.2);
    setFarmMult(1);
    setUpgrades(initialUpgrades.map(u0 => ({ ...u0, level: 0 })));
    setLevel(1);
    setBossActive(false); setBossHP(0); setBossMaxHP(0); setBossTimeLeft(0); setBossData(null);
    alert(`Престиж виконано! Отримано ${gained} HC.`);
  };

  // ==== HC shop
  const buyHcUpgrade = (cost: number, apply: () => void) => {
    if (hc < cost) { alert("Немає стільки Хронокристалів"); return; }
    setHc(prev => prev - cost); apply();
  };

  // ==== Equip
  const toggleEquip = (id: string) => {
    setEquippedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) { alert("Макс. 3 артефакти одночасно"); return prev; }
      return [...prev, id];
    });
  };

  // ==== Craft 3→1
  const rarityCount = useMemo(() => countByRarity(artifacts), [artifacts]);
  const openedTier = useMemo(() => Math.max(1, Math.floor(level / 10)), [level]);
  function canCraft(r: Rarity) {
    const nr = nextRarity(r);
    if (!nr) return false;
    return rarityCount[r] >= 3;
  }
  const craftRarity = (r: Rarity) => {
    const target = nextRarity(r);
    if (!target) { alert("Максимальна рідкість. Крафт недоступний."); return; }
    if (!canCraft(r)) { alert("Потрібно 3 артефакти цієї рідкості."); return; }

    setArtifacts(prev => {
      let left = 3;
      const newInv: ArtifactInstance[] = [];
      for (const it of prev) {
        const meta = getArtifactById(it.id);
        if (left > 0 && meta?.rarity === r) { left--; continue; }
        newInv.push(it);
      }
      if (left > 0) return prev;

      const newId = rollByRarity(target, openedTier);
      if (!newId) { alert("Ще не відкриті артефакти цієї рідкості для твого прогресу."); return prev; }

      alert(`🔧 Крафт успішний! Отримано: ${getArtifactById(newId)?.name}`);
      return [...newInv, { id: newId, level: 1 }];
    });
  };

  // UI helpers
  const bossHPpct = bossMaxHP > 0 ? Math.max(0, Math.min(100, (bossHP / bossMaxHP) * 100)) : 0;
  const bossTimePct = bossData && bossData.durationSec > 0 ? Math.max(0, Math.min(100, (bossTimeLeft / bossData.durationSec) * 100)) : 0;

  const activeSkin = getSkinById(equippedSkinId) ?? getSkinById("classic")!;
  const tapStyle: React.CSSProperties = {
    background: activeSkin?.tapStyle.background,
    color: activeSkin?.tapStyle.color,
    boxShadow: activeSkin?.tapStyle.boxShadow ?? "none",
    border: "none", borderRadius: 12, padding: "18px 32px", fontSize: 22, cursor: "pointer"
  };

  return (
    <div className="app" style={{ background: epoch.bg, minHeight: "100vh" }}>
      <HeaderBar
        ce={ce} mm={mm} hc={hc} level={level}
        epochName={epoch.name} epochMult={epochMult}
        clickPower={clickPower} autoPerSec={autoPerSec}
        effectiveFarmMult={effectiveFarmMult}
        meteorBuffLeft={meteorBuffLeft} meteorMult={meteorMult}
      />

      <main>
        <TapArea
          onTap={onClickTap}
          tapStyle={tapStyle}
          meteorVisible={meteorVisible}
          onMeteorClick={onMeteorClick}
          meteorBuffLeft={meteorBuffLeft}
          meteorSpawnIn={meteorSpawnIn}
        />

        <BossPanel
          level={level}
          isBossLevel={isBossLevel}
          bossActive={bossActive}
          bossData={bossData}
          bossRetryCooldown={bossRetryCooldown}
          startBossFight={startBossFight}
          bossHP={bossHP} bossMaxHP={bossMaxHP} bossTimeLeft={bossTimeLeft}
          bossHPpct={bossHPpct} bossTimePct={bossTimePct}
        />

        <UpgradesList
          upgrades={upgrades}
          ce={ce}
          getCost={getCost}
          buyUpgrade={buyUpgrade}
        />

        <ArtifactsPanel
          artifacts={artifacts}
          equippedIds={equippedIds}
          toggleEquip={toggleEquip}
        />

        <CraftPanel
          rarityCount={rarityCount}
          canCraft={canCraft}
          craftRarity={craftRarity}
        />

        <SkinsShop
          ownedSkins={ownedSkins}
          equippedSkinId={equippedSkinId}
          buySkin={(id: string, price: number) => {
            if (ownedSkins.includes(id)) { setEquippedSkinId(id); return; }
            if (mm < price) { alert("Не вистачає MM"); return; }
            setMm(v => v - price);
            setOwnedSkins(list => [...list, id]);
            setEquippedSkinId(id);
          }}
        />

        <section className="prestige">
          <h2>Престиж (Time Reset)</h2>
          <p>Доступний з рівня 10. Хронокристали дають перманентні бонуси.</p>
          <button onClick={performPrestige} disabled={!canPrestige}>Виконати Time Reset</button>
        </section>

        <HcShop
          buyHcUpgrade={buyHcUpgrade}
          setClickPower={setClickPower}
          setAutoPerSec={setAutoPerSec}
        />
      </main>

      <footer>
        <small>Білд: артефакти, крафт, інвентар, скіни, епохи, метеорит, боси, офлайн-доход.</small>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => { wipeSave(); window.location.reload(); }}>Новий початок (очистити сейв)</button>
        </div>
      </footer>

      <style>{`
        .tap-area { position: relative; }
        .meteor { margin:12px auto 0;max-width:520px;padding:10px 12px;border-radius:10px;background:rgba(255,215,0,.12);cursor:pointer }
        .boss .bar{width:100%;height:12px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden;margin:6px 0 8px;}
        .boss .bar-fill{height:100%;background:#7c3aed;}
        .boss .bar-fill.bar-time{background:#10b981;}
        .inv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
        .inv-card{background:rgba(255,255,255,.06);padding:10px;border-radius:10px}
        .inv-card.eq{outline:2px solid #7c3aed}
        .inv-card .title{font-weight:700;margin-bottom:6px}
        .inv-card .row{opacity:.9;margin:2px 0}
      `}</style>
    </div>
  );
}
