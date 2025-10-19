// src/App.tsx
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

import {
  buildCraftItems,
  incomePerHourAtLevel,
  mgpPrestigeMult,
} from "./systems/economy";

import { formatNum } from "./utils/format";

// UI
import HeaderBar from "./components/HeaderBar";
import TapArea from "./components/TapArea";
import UpgradesList, { Upgrade } from "./components/UpgradesList";
import ArtifactsPanel from "./components/ArtifactsPanel";
import CraftPanel from "./components/CraftPanel";
import SkinsShop from "./components/SkinsShop";
import BottomNav, { TabKey } from "./components/BottomNav";

const CRAFT_SLOT_COUNT = 21;

export default function App() {
  // ===== Tabs
  const [activeTab, setActiveTab] = useState<TabKey>("tap");

  // ===== Telegram WebApp
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor?.("#0b1220");
      tg.setBackgroundColor?.("#0b1220");
    } catch {}
  }, []);

  // ===== Currencies / state
  const [ce, setCe] = useState<number>(0);
  const [mm, setMm] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [clickPower, setClickPower] = useState<number>(1);
  const [autoPerSec, setAutoPerSec] = useState<number>(0);
  const [farmMult, setFarmMult] = useState<number>(1);
  const [hc, setHc] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [prestiges, setPrestiges] = useState<number>(0);

  // ===== Магазин/крафт (MGP + 21 слот)
  const [mgp, setMgp] = useState<number>(0);
  const [craftSlots, setCraftSlots] = useState<number[]>(
    () => Array(CRAFT_SLOT_COUNT).fill(0)
  );

  // Upgrades
  const initialUpgrades: Upgrade[] = [
    { id: "u1", name: "Пісочний Годинник", level: 0, baseCost: 10, costMult: 1.15, clickPowerBonus: 1 },
    { id: "u2", name: "Міні Вежа", level: 0, baseCost: 100, costMult: 1.18, autoPerSecBonus: 0.5 },
    { id: "u3", name: "Хронокристалічний Ротор", level: 0, baseCost: 1000, costMult: 1.2, clickPowerBonus: 5, autoPerSecBonus: 2 },
  ];
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);

  // Epoch
  const epoch: Epoch = useMemo(() => epochByLevel(level), [level]);
  const epochMult = epoch.mult;

  // Boss flags
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

  // Артефакти (дроп із босів)
  const [artifacts, setArtifacts] = useState<ArtifactInstance[]>([]);
  const [equippedIds, setEquippedIds] = useState<string[]>([]); // <= 3

  // Skins
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["classic"]);
  const [equippedSkinId, setEquippedSkinId] = useState<string>("classic");

  // ===== Економіка крафту (формули з однієї точки)
  const craftItems = useMemo(() => buildCraftItems(), []);

  // ===== LOAD SAVE (+ офлайн-доход, + міграція під нові поля)
  useEffect(() => {
    const sAny = loadState() as any;
    const now = Date.now();
    if (!sAny) return;

    setCe(sAny.ce ?? 0);
    setMm(sAny.mm ?? 0);
    setTotalEarned(sAny.totalEarned ?? 0);
    setClickPower(sAny.clickPower ?? 1);
    setAutoPerSec(sAny.autoPerSec ?? 0);
    setFarmMult(sAny.farmMult ?? 1);
    setHc(sAny.hc ?? 0);
    setLevel(sAny.level ?? 1);
    setPrestiges(sAny.prestiges ?? 0);

    // нове: mgp + craftSlots (м’яка міграція + підгін до 21 слота)
    setMgp(sAny.mgp ?? 0);
    if (Array.isArray(sAny.craftSlots)) {
      const arr = [...sAny.craftSlots];
      if (arr.length < CRAFT_SLOT_COUNT) {
        while (arr.length < CRAFT_SLOT_COUNT) arr.push(0);
        setCraftSlots(arr);
      } else {
        setCraftSlots(arr.slice(0, CRAFT_SLOT_COUNT));
      }
    } else {
      setCraftSlots(Array(CRAFT_SLOT_COUNT).fill(0));
    }

    if (Array.isArray(sAny.upgrades)) {
      setUpgrades(prev =>
        prev.map(u => {
          const found = sAny.upgrades.find((x: { id: string; level: number }) => x.id === u.id);
          return found ? { ...u, level: found.level } : u;
        })
      );
    }

    setArtifacts(sAny.artifacts ?? []);
    setEquippedIds(sAny.equippedArtifactIds ?? []);
    setOwnedSkins(sAny.ownedSkins ?? ["classic"]);
    setEquippedSkinId(sAny.equippedSkinId ?? "classic");

    // ОФЛАЙН-ДОХІД: додаємо і в CE (для апгрейдів), і в MTP (mgp), але повідомляємо як MTP
    if (sAny.lastSeenAt && sAny.autoPerSec) {
      const secsAway = Math.min(12 * 3600, Math.floor((now - sAny.lastSeenAt) / 1000));
      const gain = sAny.autoPerSec * epochByLevel(sAny.level ?? 1).mult * sAny.farmMult * secsAway;
      if (gain > 0) {
        setCe(v => v + gain);
        setMgp(v => v + gain);
        setTotalEarned(te => te + gain);
        setTimeout(() => alert(`Поки тебе не було: +${formatNum(gain)} MTP`), 60);
      }
    }
  }, []);

  // ===== AUTOSAVE (включно з mgp та craftSlots)
  useEffect(() => {
    const payload: SaveState = {
      ce, mm, totalEarned, clickPower, autoPerSec, farmMult, hc, level, prestiges,
      upgrades: upgrades.map(u => ({ id: u.id, level: u.level })),
      lastSeenAt: Date.now(),
      artifacts,
      equippedArtifactIds: equippedIds,
      ownedSkins,
      equippedSkinId,
      // нове
      mgp,
      craftSlots,
    };
    scheduleSave(payload);
  }, [
    ce, mm, totalEarned, clickPower, autoPerSec, farmMult, hc, level, prestiges,
    upgrades, artifacts, equippedIds, ownedSkins, equippedSkinId,
    mgp, craftSlots
  ]);

  // ==== Артефакти → агреговані бонуси
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

  // ====== Дохід MGP від сітки (g=1.20, L1=1 mgp/год) з урахуванням престиж-множника
  const mgpIncomePerHour = useMemo(() => {
    const base = craftSlots.reduce((sum, lvl) => sum + (lvl > 0 ? incomePerHourAtLevel(lvl) : 0), 0);
    return base * mgpPrestigeMult(prestiges);
  }, [craftSlots, prestiges]);

  // TAP: додаємо **і MGP**
  const onClickTap = () => {
    const inc = clickPower * effectiveClickMult;
    setCe(prev => prev + inc);   // лишаємо CE для апгрейдів
    setMgp(prev => prev + inc);  // головна валюта на головному екрані
    setTotalEarned(te => te + inc);
    if (bossActive) setBossHP(hp => Math.max(0, hp - clickPower));
  };

  // автофарм + таймери + MGP нарахування
  useEffect(() => {
    const id = window.setInterval(() => {
      if (autoPerSec > 0) {
        const inc = autoPerSec * effectiveAutoMult;
        setCe(prev => prev + inc);
        setTotalEarned(te => te + inc);
        if (bossActive) setBossHP(hp => Math.max(0, hp - autoPerSec));
      }
      // MGP: додаємо щосекунди з крафт-сітки
      if (mgpIncomePerHour > 0) {
        setMgp(v => v + mgpIncomePerHour / 3600);
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
  }, [autoPerSec, effectiveAutoMult, bossActive, bossTimeLeft, bossRetryCooldown, meteorBuffLeft, meteorVisible, mgpIncomePerHour]);

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

  // ==== Equip
  const toggleEquip = (id: string) => {
    setEquippedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) { alert("Макс. 3 артефакти одночасно"); return prev; }
      return [...prev, id];
    });
  };

  // ==== Додати предмет у крафт (L1 за замовчуванням)
  const addToCraft = (levelToPlace = 1): boolean => {
    const idx = craftSlots.findIndex(v => v === 0);
    if (idx === -1) { alert("Немає вільних слотів у крафті"); return false; }
    setCraftSlots(prev => {
      const copy = [...prev];
      copy[idx] = Math.max(1, levelToPlace);
      return copy;
    });
    return true;
  };

  return (
    <div className="app" style={{ minHeight: "100vh", background: "transparent" }}>
      <HeaderBar
        ce={ce} mm={mm} hc={hc} level={level}
        epochName={epoch.name} epochMult={epochMult}
        clickPower={clickPower} autoPerSec={autoPerSec}
        effectiveFarmMult={(1 + artAgg.farm) * epochMult * farmMult}
        meteorBuffLeft={meteorBuffLeft} meteorMult={meteorMult}
      />

      <main className="page-content">
        {activeTab === "tap" && (
          <TapArea
            onTap={onClickTap}
            currentEnergy={mgp}            // показуємо MTP (mgp)
            meteorVisible={meteorVisible}
            onMeteorClick={onMeteorClick}
            meteorBuffLeft={meteorBuffLeft}
            meteorSpawnIn={meteorSpawnIn}
            meteorBonus={0}
            meteorMultiplier={GOLDEN_METEOR.mult}
          />
        )}

        {activeTab === "upgrades" && (
          <UpgradesList
            upgrades={upgrades}
            ce={ce}
            getCost={getCost}
            buyUpgrade={buyUpgrade}
          />
        )}

        {activeTab === "artifacts" && (
          <ArtifactsPanel
            mgp={mgp}
            setMgp={setMgp}
            addToCraft={addToCraft}
          />
        )}

        {activeTab === "craft" && (
          <CraftPanel
            mgp={mgp}
            setMgp={setMgp}
            slots={craftSlots}
            setSlots={setCraftSlots}
            items={craftItems}
          />
        )}

        {activeTab === "skins" && (
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
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      <style>{`
        .page-content{ padding-bottom: 92px; }
      `}</style>
    </div>
  );
}
