// src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { loadState, scheduleSave } from "./core/storage";
import type { SaveState, ArtifactInstance } from "./core/storage";

import { epochByLevel } from "./systems/epochs";
import type { Epoch } from "./systems/epochs";

import { GOLDEN_METEOR, nextMeteorIn } from "./systems/events";

import { aggregateArtifacts } from "./systems/artifacts";
import type { AggregatedBonus } from "./systems/artifacts";

import { buildCraftItems, incomePerHourAtLevel, mgpPrestigeMult } from "./systems/economy";

import { formatNum } from "./utils/format";

import HeaderBar from "./components/HeaderBar";
import TapArea from "./components/TapArea";
import UpgradesList from "./components/UpgradesList";
import ArtifactsPanel from "./components/ArtifactsPanel";
import CraftPanel from "./components/CraftPanel";
import SkinsShop from "./components/SkinsShop";
import BottomNav, { TabKey } from "./components/BottomNav";
import AppModal from "./components/AppModal";
import LeadersPanel from "./components/LeadersPanel";
import AdminPanel from "./components/AdminPanel";

import { upsertScore, ensureAuth, subscribeUser, upsertUserProfile } from "./services/leaderboard";

import { I18nProvider, useI18n } from "./i18n";

const CRAFT_SLOT_COUNT = 21;
const OFFLINE_CAP_SECS = 3 * 3600;

const ADMIN_AUTH_UID = "zzyUPc53FPOwOSn2DcNZirHyusu1";

const LS_APPLIED_SERVER_BAL_KEY = "mt_applied_server_balance_v1";
const LS_APPLIED_SERVER_BAL_AT_KEY = "mt_applied_server_balance_at_v1";

function readNumLS(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeNumLS(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

function tsToMs(x: any): number | null {
  try {
    const d: Date = typeof x?.toDate === "function" ? x.toDate() : x instanceof Date ? x : (null as any);
    if (!d) return null;
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

function AppInner() {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<TabKey>("tap");

  const [leaderUserId, setLeaderUserId] = useState<string>("");

  const [username, setUsername] = useState<string>("Гість");

  const [tgMeta, setTgMeta] = useState<{
    tgId?: number;
    tgUsername?: string;
    first?: string;
    last?: string;
  }>({});

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    // ✅ FIX iOS: не даємо Telegram згорнути mini app свайпом вниз
    try {
      tg.disableVerticalSwipes?.();
    } catch {}

    try {
      tg.setHeaderColor?.("#0b1220");
      tg.setBackgroundColor?.("#0b1220");
    } catch {}

    try {
      const u = tg?.initDataUnsafe?.user;
      const name = u?.username || [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "Гість";
      setUsername(name);

      setTgMeta({
        tgId: u?.id,
        tgUsername: u?.username,
        first: u?.first_name,
        last: u?.last_name,
      });
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const uid = await ensureAuth();
      if (!alive) return;
      if (uid) setLeaderUserId(uid);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const [ce, setCe] = useState<number>(0);
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

  const epoch: Epoch = useMemo(() => epochByLevel(level), [level]);
  const epochMult = epoch.mult;

  const [meteorVisible, setMeteorVisible] = useState(false);
  const [meteorBuffLeft, setMeteorBuffLeft] = useState(0);
  const [meteorSpawnIn, setMeteorSpawnIn] = useState<number>(() => nextMeteorIn(GOLDEN_METEOR));

  const [artifacts, setArtifacts] = useState<ArtifactInstance[]>([]);
  const [equippedIds, setEquippedIds] = useState<string[]>([]);

  const [ownedSkins, setOwnedSkins] = useState<string[]>(["classic"]);
  const [equippedSkinId, setEquippedSkinId] = useState<string>("classic");

  const craftItems = useMemo(() => buildCraftItems(), []);

  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string>("");

  const hydratedFromLocalRef = useRef(false);

  const lastAppliedServerBalRef = useRef<number | null>(null);
  const lastAppliedServerAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!leaderUserId) return;

    if (lastAppliedServerBalRef.current === null) {
      const savedBal = readNumLS(LS_APPLIED_SERVER_BAL_KEY);
      if (savedBal != null) lastAppliedServerBalRef.current = savedBal;
    }
    if (lastAppliedServerAtRef.current === null) {
      const savedAt = readNumLS(LS_APPLIED_SERVER_BAL_AT_KEY);
      if (savedAt != null) lastAppliedServerAtRef.current = savedAt;
    }

    const unsub = subscribeUser(leaderUserId, (profile) => {
      const d: any = profile || {};
      setIsBanned(!!d.banned);
      setBanReason(String(d.banReason || ""));

      const hasBal = typeof d.balance === "number" && Number.isFinite(d.balance);
      if (!hasBal) return;

      const serverBal = Math.max(0, Math.floor(d.balance));
      const serverAtMs = tsToMs(d.balanceUpdatedAt);

      const prevBal = lastAppliedServerBalRef.current;
      const prevAt = lastAppliedServerAtRef.current;

      let serverChanged = false;

      if (serverAtMs != null) {
        if (prevAt != null) serverChanged = serverAtMs !== prevAt;
        else if (prevBal != null) serverChanged = serverBal !== prevBal;
        else serverChanged = true;
      } else {
        if (prevBal != null) serverChanged = serverBal !== prevBal;
        else serverChanged = true;
      }

      if (!serverChanged && hydratedFromLocalRef.current) {
        if (prevBal == null) {
          lastAppliedServerBalRef.current = serverBal;
          writeNumLS(LS_APPLIED_SERVER_BAL_KEY, serverBal);
        }
        if (serverAtMs != null && prevAt == null) {
          lastAppliedServerAtRef.current = serverAtMs;
          writeNumLS(LS_APPLIED_SERVER_BAL_AT_KEY, serverAtMs);
        }
        return;
      }

      if (serverChanged) {
        lastAppliedServerBalRef.current = serverBal;
        writeNumLS(LS_APPLIED_SERVER_BAL_KEY, serverBal);

        if (serverAtMs != null) {
          lastAppliedServerAtRef.current = serverAtMs;
          writeNumLS(LS_APPLIED_SERVER_BAL_AT_KEY, serverAtMs);
        }

        setMgp((prev) => (prev === serverBal ? prev : serverBal));
        return;
      }

      if (!hydratedFromLocalRef.current) {
        lastAppliedServerBalRef.current = serverBal;
        writeNumLS(LS_APPLIED_SERVER_BAL_KEY, serverBal);

        if (serverAtMs != null) {
          lastAppliedServerAtRef.current = serverAtMs;
          writeNumLS(LS_APPLIED_SERVER_BAL_AT_KEY, serverAtMs);
        }

        setMgp((prev) => (prev === serverBal ? prev : serverBal));
      }
    });

    return () => {
      try {
        unsub();
      } catch {}
    };
  }, [leaderUserId]);

  useEffect(() => {
    if (!leaderUserId) return;

    let stop = false;

    const tick = async () => {
      if (stop) return;

      const name = (username || "Гість").trim();
      const score = Math.floor(mgp);

      await upsertUserProfile(
        leaderUserId,
        {
          name,
          score,
          lastSeenAt: "__SERVER_TIMESTAMP__" as any,
          tgId: tgMeta.tgId ?? null,
          tgUsername: tgMeta.tgUsername ?? "",
          tgFirst: tgMeta.first ?? "",
          tgLast: tgMeta.last ?? "",
        } as any
      );

      if (!stop) window.setTimeout(tick, 20_000);
    };

    tick();
    return () => {
      stop = true;
    };
  }, [leaderUserId, username, mgp, tgMeta.tgId, tgMeta.tgUsername, tgMeta.first, tgMeta.last]);

  useEffect(() => {
    const sAny = loadState() as any;
    const now = Date.now();
    if (!sAny) {
      hydratedFromLocalRef.current = true;
      return;
    }

    setCe(sAny.ce ?? 0);
    setTotalEarned(sAny.totalEarned ?? 0);
    setClickPower(sAny.clickPower ?? 1);
    setAutoPerSec(sAny.autoPerSec ?? 0);
    setFarmMult(sAny.farmMult ?? 1);
    setHc(sAny.hc ?? 0);
    setLevel(sAny.level ?? 1);
    setPrestiges(sAny.prestiges ?? 0);

    setMgp(sAny.mgp ?? sAny.mm ?? 0);

    if (Array.isArray(sAny.craftSlots)) {
      const arr = [...sAny.craftSlots];
      if (arr.length < CRAFT_SLOT_COUNT) {
        while (arr.length < CRAFT_SLOT_COUNT) arr.push(0);
        setCraftSlots(arr);
      } else setCraftSlots(arr.slice(0, CRAFT_SLOT_COUNT));
    } else setCraftSlots(Array(CRAFT_SLOT_COUNT).fill(0));

    setArtifacts(sAny.artifacts ?? []);
    setEquippedIds(sAny.equippedArtifactIds ?? []);
    setOwnedSkins(sAny.ownedSkins ?? ["classic"]);
    setEquippedSkinId(sAny.equippedSkinId ?? "classic");

    hydratedFromLocalRef.current = true;

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
      totalEarned,
      clickPower,
      autoPerSec,
      farmMult,
      hc,
      level,
      prestiges,
      upgrades: [],
      lastSeenAt: Date.now(),
      artifacts,
      equippedArtifactIds: equippedIds,
      ownedSkins,
      equippedSkinId,
      mm: mgp,
      craftSlots,
    };

    scheduleSave(payload);
  }, [
    ce,
    totalEarned,
    clickPower,
    autoPerSec,
    farmMult,
    hc,
    level,
    prestiges,
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
    if (isBanned) {
      setOfflineModalText(`${t("banned.title")}${banReason ? ` ${t("banned.reason")} ${banReason}` : ""}`);
      setOfflineModalOpen(true);
      return;
    }
    const inc = clickPower * effectiveClickMult;
    setCe((prev) => prev + inc);
    setMgp((prev) => prev + inc);
    setTotalEarned((te) => te + inc);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      if (autoPerSec > 0) {
        const inc = autoPerSec * effectiveAutoMult;
        setCe((prev) => prev + inc);
        setTotalEarned((te) => te + inc);
      }
      if (mgpIncomePerHour > 0) setMgp((v) => v + mgpIncomePerHour / 3600);

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
  }, [autoPerSec, effectiveAutoMult, meteorBuffLeft, meteorVisible, mgpIncomePerHour]);

  const onMeteorClick = () => {
    if (isBanned) return;
    setMeteorVisible(false);
    setMeteorBuffLeft(GOLDEN_METEOR.activeSecs);
    setMeteorSpawnIn(nextMeteorIn(GOLDEN_METEOR));
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

  const lastPush = useRef<{ t: number; s: number }>({ t: 0, s: 0 });
  useEffect(() => {
    if (isBanned) return;

    const score = Math.floor(mgp);
    if (!leaderUserId || score <= 0) return;

    const displayName = (username || "Гість").trim();
    const now = Date.now();
    const dt = now - lastPush.current.t;
    const ds = score - lastPush.current.s;

    if (dt < 15_000 && ds < 50_000) return;

    upsertScore(leaderUserId, displayName, score).catch(() => {});
    lastPush.current = { t: now, s: score };
  }, [mgp, username, leaderUserId, isBanned]);

  const [adminOpen, setAdminOpen] = useState(false);
  const isAdmin = useMemo(() => !!leaderUserId && leaderUserId === ADMIN_AUTH_UID, [leaderUserId]);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("admin") === "1" && isAdmin) setAdminOpen(true);
    } catch {}
  }, [isAdmin]);

  return (
    <div className="app" style={{ minHeight: "100vh", background: "transparent" }}>
      <HeaderBar
        ce={ce}
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
        {!leaderUserId ? (
          <div
            style={{
              margin: "14px 12px",
              padding: "14px",
              borderRadius: 14,
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)",
              textAlign: "center",
              opacity: 0.9,
            }}
          >
            {t("loading")}
          </div>
        ) : null}

        {isBanned ? (
          <div
            style={{
              margin: "14px 12px",
              padding: "14px",
              borderRadius: 14,
              background: "rgba(255,80,80,.12)",
              border: "1px solid rgba(255,80,80,.25)",
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>{t("banned.title")}</div>
            {banReason ? (
              <div style={{ opacity: 0.9 }}>
                {t("banned.reason")} <b>{banReason}</b>
              </div>
            ) : (
              <div style={{ opacity: 0.9 }}>Зверніться до адміністратора.</div>
            )}
          </div>
        ) : null}

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

        {activeTab === "upgrades" && <UpgradesList userId={leaderUserId} nickname={username} />}

        {activeTab === "artifacts" && <ArtifactsPanel mgp={mgp} setMgp={setMgp} addToCraft={addToCraft} />}

        {activeTab === "craft" && (
          <CraftPanel mgp={mgp} setMgp={setMgp} slots={craftSlots} setSlots={setCraftSlots} items={craftItems} />
        )}

        {activeTab === "skins" && (
          <SkinsShop userId={leaderUserId || "no_uid"} nickname={username} isBanned={isBanned} onLoot={({ level }) => addToCraft(level)} />
        )}

        {activeTab === "leaders" && (
          <div>
            <LeadersPanel nickname={username} currentScore={mgp} />
            {isAdmin ? (
              <div style={{ textAlign: "center", marginTop: 10, opacity: 0.85 }}>
                <button
                  onClick={() => setAdminOpen(true)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(255,255,255,.06)",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Адмін панель
                </button>
              </div>
            ) : null}
          </div>
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      <AppModal
        open={adminOpen}
        title="Адмін панель"
        icon={null as any}
        width={"min(94vw, 920px)" as any}
        maxBodyHeight={"66vh" as any}
        footer={
          <button
            onClick={() => setAdminOpen(false)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(255,255,255,.06)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Закрити
          </button>
        }
        onClose={() => setAdminOpen(false)}
      >
        {isAdmin ? <AdminPanel adminId={leaderUserId} /> : <div>Недостатньо прав.</div>}
      </AppModal>

      <AppModal open={offlineModalOpen} text={offlineModalText} onClose={() => setOfflineModalOpen(false)} />

      <style>{`.page-content{ padding-bottom: 92px; }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}
