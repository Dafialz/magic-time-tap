// src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { loadState, scheduleSave } from "./core/storage";
import type { SaveState, ArtifactInstance } from "./core/storage";

import { calcBossHP, calcRewards, getBossByTier } from "./systems/bosses";
import type { BossDef, BossTier } from "./systems/bosses";

import { epochByLevel } from "./systems/epochs";
import type { Epoch } from "./systems/epochs";

import { GOLDEN_METEOR, nextMeteorIn } from "./systems/events";

import { rollArtifactId, getArtifactById, aggregateArtifacts } from "./systems/artifacts";
import type { AggregatedBonus } from "./systems/artifacts";

import { buildCraftItems, incomePerHourAtLevel, mgpPrestigeMult } from "./systems/economy";

import { formatNum } from "./utils/format";

import HeaderBar from "./components/HeaderBar";
import TapArea from "./components/TapArea";
import UpgradesList, { Upgrade } from "./components/UpgradesList";
import ArtifactsPanel from "./components/ArtifactsPanel";
import CraftPanel from "./components/CraftPanel";
import SkinsShop from "./components/SkinsShop";
import BottomNav, { TabKey } from "./components/BottomNav";
import AppModal from "./components/AppModal";
import LeadersPanel from "./components/LeadersPanel";

// сервіс лідерборду
import { upsertScore } from "./services/leaderboard";

const CRAFT_SLOT_COUNT = 21;
const OFFLINE_CAP_SECS = 3 * 3600;

const ANON_ID_KEY = "mt_anon_id_v1";
function getOrCreateAnonId(): string {
  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const id = Math.random().toString(16).slice(2) + Date.now().toString(16);
    localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("tap");

  const [username, setUsername] = useState<string>("Гість");
  const [leaderUserId, setLeaderUserId] = useState<string>(() => `anon_${getOrCreateAnonId()}`);

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor?.("#0b1220");
      tg.setBackgroundColor?.("#0b1220");
    } catch {}

    try {
      const u = tg?.initDataUnsafe?.user;

      // унікальний id для лідерборду (Telegram user id)
      const tgId = u?.id;
      if (tgId) setLeaderUserId(`tg_${String(tgId)}`);

      const name =
        u?.username ||
        [u?.first_name, u?.last_name].filter(Boolean).join(" ") ||
        "Гість";
      setUsername(name);
    } catch {}
  }, []);

  const [ce, setCe] = useState<number>(0);
  const [mm, setMm] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [clickPower, setClickPower] = useState<number>(1);
  const [autoPerSec, setAutoPerSec] = useState<number>(0);
  const [farmMult, setFarmMult] = useState<number>(1);
  const [hc, setHc] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [prestiges, setPrestiges] = useState<number>(0);

  const [mgp, setMgp] = useState<number>(0);
  const [craftSlots, setCraftSlots] = useState<number[]>(() => Array(CRAFT_SLOT_COUNT).fill(0));

  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [offlineModalText, setOfflineModalText] = useState("");

  const initialUpgrades: Upgrade[] = [
    { id: "u1", name: "Пісочний Годинник", level: 0, baseCost: 10, costMult: 1.15, clickPowerBonus: 1 },
    { id: "u2", name: "Міні Вежа", level: 0, baseCost: 100, costMult: 1.18, autoPerSecBonus: 0.5 },
    { id: "u3", name: "Хронокристалічний Ротор", level: 0, baseCost: 1000, costMult: 1.2, clickPowerBonus: 5, autoPerSecBonus: 2 },
  ];
  const [upgrades, setUpgrades] = useState<Upgrade[]>(initialUpgrades);

  const epoch: Epoch = useMemo(() => epochByLevel(level), [level]);
  const epochMult = epoch.mult;

  const bossTier: BossTier | 0 = useMemo(() => Math.floor(level / 10) as BossTier | 0, [level]);
  const isBossLevel = level >= 10 && level % 10 === 0;

  const [bossActive, setBossActive] = useState(false);
  const [bossHP, setBossHP] = useState<number>(0);
  const [bossMaxHP, setBossMaxHP] = useState<number>(0);
  const [bossData, setBossData] = useState<BossDef | null>(null);
  const [bossTimeLeft, setBossTimeLeft] = useState<number>(0);
  const [bossRetryCooldown, setBossRetryCooldown] = useState<number>(0);

  const [meteorVisible, setMeteorVisible] = useState(false);
  const [meteorBuffLeft, setMeteorBuffLeft] = useState(0);
  const [meteorSpawnIn, setMeteorSpawnIn] = useState<number>(() => nextMeteorIn(GOLDEN_METEOR));

  const [artifacts, setArtifacts] = useState<ArtifactInstance[]>([]);
  const [equippedIds, setEquippedIds] = useState<string[]>([]); // <= 3

  const [ownedSkins, setOwnedSkins] = useState<string[]>(["classic"]);
  const [equippedSkinId, setEquippedSkinId] = useState<string>("classic");

  const craftItems = useMemo(() => buildCraftItems(), []);

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

    setMgp(sAny.mgp ?? 0);
    if (Array.isArray(sAny.craftSlots)) {
      const arr = [...sAny.craftSlots];
      if (arr.length < CRAFT_SLOT_COUNT) {
        while (arr.length < CRAFT_SLOT_COUNT) arr.push(0);
        setCraftSlots(arr);
      } else setCraftSlots(arr.slice(0, CRAFT_SLOT_COUNT));
    } else setCraftSlots(Array(CRAFT_SLOT_COUNT).fill(0));

    if (Array.isArray(sAny.upgrades)) {
      setUpgrades((prev) =>
        prev.map((u) => {
          const found = sAny.upgrades.find((x: { id: string; level: number }) => x.id === u.id);
          return found ? { ...u, level: found.level } : u;
        })
      );
    }

    setArtifacts(sAny.artifacts ?? []);
    setEquippedIds(sAny.equippedArtifactIds ?? []);
    setOwnedSkins(sAny.ownedSkins ?? ["classic"]);
    setEquippedSkinId(sAny.equippedSkinId ?? "classic");

    if (sAny.lastSeenAt && sAny.autoPerSec) {
      const secsAway = Math.min(OFFLINE_CAP_SECS, Math.floor((now - sAny.lastSeenAt) / 1000));
      const gain = sAny.autoPerSec * epochByLevel(sAny.level ?? 1).mult * sAny.farmMult * secsAway;
      if (gain > 0) {
        setCe((v) => v + gain);
        setMgp((v) => v + gain);
        setTotalEarned((te) => te + gain);
        setTimeout(() => {
          setOfflineModalText(`Поки тебе не було: +${formatNum(gain)} MTP`);
          setOfflineModalOpen(true);
        }, 60);
      }
    }
  }, []);

  useEffect(() => {
    const payload: SaveState = {
      ce,
      mm,
      totalEarned,
      clickPower,
      autoPerSec,
      farmMult,
      hc,
      level,
      prestiges,
      upgrades: upgrades.map((u) => ({ id: u.id, level: u.level })),
      lastSeenAt: Date.now(),
      artifacts,
      equippedArtifactIds: equippedIds,
      ownedSkins,
      equippedSkinId,
      mgp,
      craftSlots,
    };
    scheduleSave(payload);
  }, [
    ce,
    mm,
    totalEarned,
    clickPower,
    autoPerSec,
    farmMult,
    hc,
    level,
    prestiges,
    upgrades,
    artifacts,
    equippedIds,
    ownedSkins,
    equippedSkinId,
    mgp,
    craftSlots,
  ]);

  const artifactLevels: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of artifacts) map[a.id] = a.level;
    return map;
  }, [artifacts]);

  const artAgg: AggregatedBonus = useMemo(
    () => aggregateArtifacts(equippedIds, artifactLevels),
    [equippedIds, artifactLevels]
  );

  const meteorMult = meteorBuffLeft > 0 ? GOLDEN_METEOR.mult : 1;
  const effectiveClickMult = (1 + artAgg.click) * meteorMult * epochMult * farmMult;
  const effectiveAutoMult = (1 + artAgg.auto) * meteorMult * epochMult * farmMult;

  const mgpIncomePerHour = useMemo(() => {
    const base = craftSlots.reduce((sum, lvl) => sum + (lvl > 0 ? incomePerHourAtLevel(lvl) : 0), 0);
    return base * mgpPrestigeMult(prestiges);
  }, [craftSlots, prestiges]);

  const onClickTap = () => {
    const inc = clickPower * effectiveClickMult;
    setCe((prev) => prev + inc);
    setMgp((prev) => prev + inc);
    setTotalEarned((te) => te + inc);
    if (bossActive) setBossHP((hp) => Math.max(0, hp - clickPower));
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      if (autoPerSec > 0) {
        const inc = autoPerSec * effectiveAutoMult;
        setCe((prev) => prev + inc);
        setTotalEarned((te) => te + inc);
        if (bossActive) setBossHP((hp) => Math.max(0, hp - autoPerSec));
      }
      if (mgpIncomePerHour > 0) setMgp((v) => v + mgpIncomePerHour / 3600);

      if (bossActive && bossTimeLeft > 0) setBossTimeLeft((t) => Math.max(0, t - 1));
      if (bossRetryCooldown > 0) setBossRetryCooldown((t) => Math.max(0, t - 1));

      if (meteorBuffLeft > 0) setMeteorBuffLeft((t) => Math.max(0, t - 1));
      else {
        setMeteorSpawnIn((t) => {
          if (meteorVisible) return t;
          const nt = Math.max(0, t - 1);
          if (nt === 0) setMeteorVisible(true);
          return nt;
        });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [
    autoPerSec,
    effectiveAutoMult,
    bossActive,
    bossTimeLeft,
    bossRetryCooldown,
    meteorBuffLeft,
    meteorVisible,
    mgpIncomePerHour,
  ]);

  const onMeteorClick = () => {
    setMeteorVisible(false);
    setMeteorBuffLeft(GOLDEN_METEOR.activeSecs);
    setMeteorSpawnIn(nextMeteorIn(GOLDEN_METEOR));
  };

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
      setFarmMult((m) => m * ceMult);
      setMm((prev) => prev + mmDrop);

      const rolled = Math.random() < artifactChance;
      let dropMsg = "";
      if (rolled) {
        const id = rollArtifactId(bossData.tier);
        setArtifacts((prev) => {
          const idx = prev.findIndex((a) => a.id === id);
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

      setOfflineModalText(`💥 Боса подолано! Farm x${ceMult.toFixed(2)}; MM +${mmDrop}.${dropMsg}`);
      setOfflineModalOpen(true);

      setBossActive(false);
      setBossHP(0);
      setBossMaxHP(0);
      setBossTimeLeft(0);
      setBossData(null);
      setLevel((l) => l + 1);
      return;
    }

    if (bossTimeLeft <= 0 && bossHP > 0 && bossData) {
      setOfflineModalText(`⏳ ${bossData.name} утік. Повтор через ${bossData.fleeCooldownSec}s.`);
      setOfflineModalOpen(true);
      setBossActive(false);
      setBossHP(0);
      setBossMaxHP(0);
      setBossTimeLeft(0);
      setBossData(null);
      setBossRetryCooldown(bossData.fleeCooldownSec);
      return;
    }
  }, [bossActive, bossHP, bossTimeLeft, bossData, prestiges]);

  const buyUpgrade = (u: Upgrade) => {
    const cost = Math.floor(u.baseCost * Math.pow(u.costMult, u.level));
    if (ce < cost) return;
    setCe((prev) => prev - cost);
    setUpgrades((prev) => prev.map((x) => (x.id === u.id ? { ...x, level: x.level + 1 } : x)));
    setClickPower((cp) => cp + (u.clickPowerBonus ?? 0));
    setAutoPerSec((a) => a + (u.autoPerSecBonus ?? 0));
    setLevel((l) => l + 1);
  };
  const getCost = (u: Upgrade) => Math.floor(u.baseCost * Math.pow(u.costMult, u.level));

  const toggleEquip = (id: string) => {
    setEquippedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        setOfflineModalText("Макс. 3 артефакти одночасно");
        setOfflineModalOpen(true);
        return prev;
      }
      return [...prev, id];
    });
  };

  const addToCraft = (levelToPlace = 1): boolean => {
    const idx = craftSlots.findIndex((v) => v === 0);
    if (idx === -1) {
      setOfflineModalText("Немає вільних слотів у крафті");
      setOfflineModalOpen(true);
      return false;
    }
    setCraftSlots((prev) => {
      const copy = [...prev];
      copy[idx] = Math.max(1, levelToPlace);
      return copy;
    });
    return true;
  };

  // пуш у лідерборд (тротлінг)
  const lastPush = useRef<{ t: number; s: number }>({ t: 0, s: 0 });
  useEffect(() => {
    const score = Math.floor(mgp);
    if (!leaderUserId || score <= 0) return;

    // якщо людина ще не має нормального імені — все одно пушимо,
    // але відображатиметься як "Гість" (або TG username якщо є)
    const displayName = (username || "Гість").trim();

    const now = Date.now();
    const dt = now - lastPush.current.t;
    const ds = score - lastPush.current.s;

    // тротлінг: не частіше ніж раз на 15с, і тільки якщо приріст нормальний
    if (dt < 15_000 && ds < 50_000) return;

    upsertScore(leaderUserId, displayName, score).catch(() => {});
    lastPush.current = { t: now, s: score };
  }, [mgp, username, leaderUserId]);

  return (
    <div className="app" style={{ minHeight: "100vh", background: "transparent" }}>
      <HeaderBar
        ce={ce}
        mm={mm}
        hc={hc}
        level={level}
        epochName={epoch.name}
        epochMult={epochMult}
        clickPower={clickPower}
        autoPerSec={autoPerSec}
        effectiveFarmMult={(1 + artAgg.farm) * epochMult * farmMult}
        meteorBuffLeft={meteorBuffLeft}
        meteorMult={meteorMult}
      />

      <main className="page-content">
        {activeTab === "tap" && (
          <TapArea
            onTap={onClickTap}
            currentEnergy={mgp}
            meteorVisible={meteorVisible}
            onMeteorClick={onMeteorClick}
            meteorBuffLeft={meteorBuffLeft}
            meteorSpawnIn={meteorSpawnIn}
            meteorBonus={0}
            meteorMultiplier={GOLDEN_METEOR.mult}
            onDailyBonusClaim={(amount) => setMgp((v) => v + amount)}
            onOpenLeaders={() => setActiveTab("leaders")}
          />
        )}

        {activeTab === "upgrades" && (
          <UpgradesList upgrades={upgrades} ce={ce} getCost={getCost} buyUpgrade={buyUpgrade} />
        )}

        {activeTab === "artifacts" && <ArtifactsPanel mgp={mgp} setMgp={setMgp} addToCraft={addToCraft} />}

        {activeTab === "craft" && (
          <CraftPanel mgp={mgp} setMgp={setMgp} slots={craftSlots} setSlots={setCraftSlots} items={craftItems} />
        )}

        {activeTab === "skins" && (
          <SkinsShop
            ownedSkins={ownedSkins}
            equippedSkinId={equippedSkinId}
            buySkin={(id: string, price: number) => {
              if (ownedSkins.includes(id)) {
                setEquippedSkinId(id);
                return;
              }
              if (mm < price) {
                setOfflineModalText("Не вистачає MM");
                setOfflineModalOpen(true);
                return;
              }
              setMm((v) => v - price);
              setOwnedSkins((list) => [...list, id]);
              setEquippedSkinId(id);
            }}
            onLoot={({ level }) => {
              addToCraft(level);
            }}
          />
        )}

        {activeTab === "leaders" && <LeadersPanel nickname={username} currentScore={mgp} />}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      <AppModal open={offlineModalOpen} text={offlineModalText} onClose={() => setOfflineModalOpen(false)} />

      <style>{`.page-content{ padding-bottom: 92px; }`}</style>
    </div>
  );
}
