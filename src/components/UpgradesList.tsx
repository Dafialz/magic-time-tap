// src/components/UpgradesList.tsx
import React from "react";
import { formatNum } from "../utils/format";

/**
 * ✅ Вкладка "Друзі" (реф-система + завдання).
 *
 * Сервер:
 * - registerReferral  (callable)
 * - claimTaskReward   (callable)
 *
 * Дані беремо з users_v1/{uid}:
 * - refCount: number
 * - recentRefs: Array<{ id: string; name?: string; at?: number }>
 * - tasksCompleted: string[]
 *
 * ВАЖЛИВО: rules забороняють клієнту збільшувати balance,
 * тому MGP нараховує ТІЛЬКИ сервер.
 */

/* ========= Backward compatibility =========
 * App.tsx у тебе імпортує { Upgrade } з цього файлу.
 * Щоб не ламати збірку — залишаємо тип (може бути "legacy").
 */
export type Upgrade = {
  id: string;
  name: string;
  level: number;
  baseCost: number;
  costMult: number;
  clickPowerBonus?: number;
  autoPerSecBonus?: number;
};

/* ===== reward plan ===== */

type RewardPlan = {
  levels: number[];
  cap: number;
};

const REWARD_PLAN: RewardPlan = {
  levels: [5_000, 10_000, 20_000, 40_000, 80_000, 160_000, 320_000, 640_000, 1_280_000, 2_560_000, 5_120_000],
  cap: 5_120_000,
};

function rewardForNthFriend(n: number): number {
  if (n <= 0) return 0;
  if (n <= REWARD_PLAN.levels.length) return REWARD_PLAN.levels[n - 1];
  return REWARD_PLAN.cap;
}

function nextRewardForCount(friendsCount: number): { nextN: number; amount: number } {
  const nextN = Math.max(1, Math.floor(friendsCount) + 1);
  return { nextN, amount: rewardForNthFriend(nextN) };
}

/* ===== Task config ===== */

export type TaskKey =
  | "tiktok"
  | "facebook"
  | "instagram"
  | "twitter"
  | "youtube"
  | "vk"
  | "telegram"
  | "site";

type TaskDef = {
  key: TaskKey;
  title: string;
  reward: number;
  url: string;
};

const TASKS: TaskDef[] = [
  { key: "tiktok", title: "Підписатися на TikTok", reward: 5_000, url: "https://tiktok.com" },
  { key: "facebook", title: "Підписатися на Facebook", reward: 5_000, url: "https://facebook.com" },
  { key: "instagram", title: "Підписатися на Instagram", reward: 5_000, url: "https://instagram.com" },
  { key: "twitter", title: "Підписатися на X (Twitter)", reward: 5_000, url: "https://x.com" },
  { key: "youtube", title: "Підписатися на YouTube", reward: 5_000, url: "https://youtube.com" },
  { key: "vk", title: "Підписатися на VK", reward: 5_000, url: "https://vk.com" },
  { key: "telegram", title: "Підписатися на Telegram", reward: 5_000, url: "https://t.me" },
  { key: "site", title: "Перейти на сайт MAGT", reward: 100_000, url: "https://magt.netlify.app/" },
];

/* ===== Types ===== */

export type ReferralLite = {
  id: string;
  name?: string;
  at?: number;
};

type LoadedUserData = {
  refCount: number;
  recentRefs: ReferralLite[];
  completedTasks: TaskKey[];
};

type Props = {
  userId?: string;
  nickname?: string;

  friendsCount?: number;
  recentRefs?: ReferralLite[];
  completedTasks?: TaskKey[];
};

/* ===== Firebase helpers ===== */

function env() {
  return ((import.meta as any)?.env ?? {}) as Record<string, string>;
}

function hasFirebaseEnv() {
  const e = env();
  return !!(e.VITE_FB_API_KEY && e.VITE_FB_PROJECT_ID && e.VITE_FB_AUTH_DOMAIN);
}

async function withFirestore<T>(fn: (db: any, fs: any) => Promise<T>) {
  if (!hasFirebaseEnv()) return null as any;

  const appMod: any = await import("firebase/app");
  const fsMod: any = await import("firebase/firestore");

  const e = env();
  const cfg = {
    apiKey: e.VITE_FB_API_KEY,
    authDomain: e.VITE_FB_AUTH_DOMAIN,
    projectId: e.VITE_FB_PROJECT_ID,
    appId: e.VITE_FB_APP_ID,
  };

  const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(cfg);
  const db = fsMod.getFirestore(app);
  return await fn(db, fsMod);
}

async function withCallable<T>(fn: (app: any, functionsMod: any) => Promise<T>) {
  if (!hasFirebaseEnv()) return null as any;

  const appMod: any = await import("firebase/app");
  const functionsMod: any = await import("firebase/functions");

  const e = env();
  const cfg = {
    apiKey: e.VITE_FB_API_KEY,
    authDomain: e.VITE_FB_AUTH_DOMAIN,
    projectId: e.VITE_FB_PROJECT_ID,
    appId: e.VITE_FB_APP_ID,
  };

  const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(cfg);
  return await fn(app, functionsMod);
}

const FUNCTIONS_REGION = "europe-west1";
const FN_CLAIM_TASK = "claimTaskReward";
const FN_REGISTER_REF = "registerReferral";

/* ===== Telegram start param parsing ===== */

function readStartParam(): string {
  try {
    const tg = (window as any)?.Telegram?.WebApp;
    const sp = tg?.initDataUnsafe?.start_param;
    if (typeof sp === "string" && sp.trim()) return sp.trim();
  } catch {}

  try {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("tgWebAppStartParam") || q.get("startapp") || q.get("start_param");
    if (v && v.trim()) return v.trim();
  } catch {}

  return "";
}

function parseReferrerUid(startParam: string): string {
  const s = String(startParam || "").trim();
  const m = s.match(/^ref_(.+)$/i);
  if (!m) return "";
  return (m[1] || "").trim();
}

/* ===== UI helpers ===== */

function makeRefLink(botUsername: string, uid: string): string {
  const sp = `ref_${uid}`;
  // ВАЖЛИВО: username без @
  return `https://t.me/${botUsername}?startapp=${encodeURIComponent(sp)}`;
}

function normalizeTaskKey(x: any): TaskKey | null {
  const s = String(x ?? "").trim();
  if (
    s === "tiktok" ||
    s === "facebook" ||
    s === "instagram" ||
    s === "twitter" ||
    s === "youtube" ||
    s === "vk" ||
    s === "telegram" ||
    s === "site"
  )
    return s;
  return null;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatEta(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${hh}:${pad2(mm)}:${pad2(ss)}`;
  return `${mm}:${pad2(ss)}`;
}

/* ===== Component ===== */

const BOT_USERNAME = "MagicTimeTapBot"; // ✅ твоє: @MagicTimeTapBot

// 1 година “перевірки”
const VERIFY_MS = 60 * 60 * 1000;

// localStorage key: коли юзер натиснув "Відкрити" для таску
function lsOpenKey(uid: string, task: TaskKey) {
  return `mt_task_open_v1:${uid}:${task}`;
}

function readOpenAt(uid: string, task: TaskKey): number | null {
  try {
    const raw = localStorage.getItem(lsOpenKey(uid, task));
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeOpenAt(uid: string, task: TaskKey, ts: number) {
  try {
    localStorage.setItem(lsOpenKey(uid, task), String(ts));
  } catch {}
}

export default function UpgradesList(props: Props & any) {
  const uid = String(props.userId || "").trim();
  const name = String(props.nickname || "Гість").trim();

  const [loaded, setLoaded] = React.useState<LoadedUserData>({
    refCount: Number.isFinite(props.friendsCount) ? Number(props.friendsCount) : 0,
    recentRefs: Array.isArray(props.recentRefs) ? props.recentRefs : [],
    completedTasks: Array.isArray(props.completedTasks)
      ? (props.completedTasks.map(normalizeTaskKey).filter(Boolean) as TaskKey[])
      : [],
  });

  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [refApplied, setRefApplied] = React.useState(false);

  // тикер для таймерів (щоб “через годину” кнопка ожила сама)
  const [, forceTick] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => forceTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  function showToast(s: string) {
    setToast(s);
    window.setTimeout(() => setToast(""), 2400);
  }

  const refLink = React.useMemo(() => {
    if (!uid) return "";
    return makeRefLink(BOT_USERNAME, uid);
  }, [uid]);

  const friendsCount = loaded.refCount || 0;
  const next = nextRewardForCount(friendsCount);
  const completed = React.useMemo(() => new Set<TaskKey>(loaded.completedTasks || []), [loaded.completedTasks]);

  async function reloadFromFirestore() {
    if (!uid) return;
    const res = await withFirestore(async (db, fs) => {
      const ref = fs.doc(db, "users_v1", uid);
      const snap = await fs.getDoc(ref);
      if (!snap.exists()) return null;

      const d: any = snap.data() || {};
      const refCount =
        typeof d.refCount === "number" && Number.isFinite(d.refCount) ? Math.max(0, Math.floor(d.refCount)) : 0;

      const recentRefsRaw: any[] = Array.isArray(d.recentRefs) ? d.recentRefs : [];
      const recentRefs: ReferralLite[] = recentRefsRaw
        .map((x) => ({
          id: String(x?.id ?? "").trim(),
          name: typeof x?.name === "string" ? x.name : "",
          at: typeof x?.at === "number" ? x.at : undefined,
        }))
        .filter((x) => !!x.id)
        .slice(0, 20);

      const tasksRaw: any[] = Array.isArray(d.tasksCompleted) ? d.tasksCompleted : [];
      const completedTasks: TaskKey[] = tasksRaw.map(normalizeTaskKey).filter(Boolean) as TaskKey[];

      return { refCount, recentRefs, completedTasks } as LoadedUserData;
    }).catch(() => null);

    if (res) setLoaded(res);
  }

  async function copyLink() {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      showToast("Посилання скопійовано ✅");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = refLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Посилання скопійовано ✅");
      } catch {
        showToast("Не вдалося скопіювати 😕");
      }
    }
  }

  async function shareLink() {
    if (!refLink) return;
    const tg = (window as any)?.Telegram?.WebApp;

    try {
      if (tg?.openTelegramLink) {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(
          "Мій реф-лінк у Magic Time 👇"
        )}`;
        tg.openTelegramLink(shareUrl);
        return;
      }
    } catch {}

    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: "Magic Time",
          text: "Мій реф-лінк у Magic Time",
          url: refLink,
        });
        return;
      }
    } catch {}

    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(
        "Мій реф-лінк у Magic Time 👇"
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function claimTask(key: TaskKey) {
    if (!uid) return;

    if (completed.has(key)) {
      showToast("Це завдання вже зараховано ✅");
      return;
    }

    // безпека: не даємо claim раніше ніж через 1 годину після open
    const openedAt = readOpenAt(uid, key);
    if (!openedAt) {
      showToast("Спочатку натисни “Відкрити” 👆");
      return;
    }
    const readyAt = openedAt + VERIFY_MS;
    if (Date.now() < readyAt) {
      showToast("Перевірка ще триває ⏳");
      return;
    }

    setBusy(true);
    const out = await withCallable(async (app, functionsMod) => {
      const fns = functionsMod.getFunctions(app, FUNCTIONS_REGION);
      const callable = functionsMod.httpsCallable(fns, FN_CLAIM_TASK);
      const res = await callable({ task: key });
      return (res?.data ?? null) as any;
    }).catch(() => null);
    setBusy(false);

    if (!out || out.ok !== true) {
      showToast(out?.message || "Не вдалося зарахувати завдання 😕");
      return;
    }

    showToast(out?.message || "Нагороду зараховано ✅");
    await reloadFromFirestore();
  }

  function openTask(t: TaskDef) {
    if (!uid) return;
    // запам'ятали момент відкриття
    writeOpenAt(uid, t.key, Date.now());

    // відкриваємо посилання (Telegram WebApp -> openLink краще)
    const tg = (window as any)?.Telegram?.WebApp;
    try {
      if (tg?.openLink) {
        tg.openLink(t.url);
        return;
      }
    } catch {}
    window.open(t.url, "_blank", "noopener,noreferrer");
  }

  // ✅ Авто-реєстрація реферала (1 раз), якщо є start_param = ref_<uid>
  React.useEffect(() => {
    if (!uid) return;
    if (refApplied) return;

    const start = readStartParam();
    const referrerUid = parseReferrerUid(start);
    if (!referrerUid) return;

    setRefApplied(true);

    (async () => {
      const out = await withCallable(async (app, functionsMod) => {
        const fns = functionsMod.getFunctions(app, FUNCTIONS_REGION);
        const callable = functionsMod.httpsCallable(fns, FN_REGISTER_REF);
        const res = await callable({ referrerUid });
        return (res?.data ?? null) as any;
      }).catch(() => null);

      if (out?.ok) {
        showToast("Реферал зараховано ✅");
        await reloadFromFirestore();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, refApplied]);

  // initial load
  React.useEffect(() => {
    if (!uid) return;
    reloadFromFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return (
    <section className="friends">
      <h2>Друзі</h2>

      {!uid ? (
        <div className="card">
          <div className="title">Підключення...</div>
          <div className="sub" style={{ marginTop: 6 }}>
            Зачекай, поки Firebase Auth підʼєднається.
          </div>
        </div>
      ) : null}

      {/* REF LINK CARD */}
      <div className="card">
        <div className="row">
          <div>
            <div className="title">Твій реф-лінк</div>
            <div className="sub">Запрошуй друзів і отримуй MGP за кожного.</div>
          </div>
          <div className="pill">{name}</div>
        </div>

        <div className="refbox">
          <div className="reflink">{uid ? refLink : "—"}</div>

          <div className="btnrow">
            <button className="btn" onClick={copyLink} disabled={!uid}>
              Скопіювати
            </button>
            <button className="btn primary" onClick={shareLink} disabled={!uid}>
              Поділитися
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="k">Друзів</div>
            <div className="v">{friendsCount}</div>
          </div>
          <div className="stat">
            <div className="k">Наступна нагорода</div>
            <div className="v">
              {formatNum(next.amount)} MGP <span className="muted">за {next.nextN}-го</span>
            </div>
          </div>
        </div>

        <details className="acc">
          <summary>Останні реферали</summary>
          <div className="accBody">
            {(!loaded.recentRefs || loaded.recentRefs.length === 0) && (
              <div className="muted" style={{ padding: "6px 0" }}>
                Поки порожньо.
              </div>
            )}

            {loaded.recentRefs && loaded.recentRefs.length > 0 ? (
              <div className="refList">
                {loaded.recentRefs.slice(0, 20).map((r) => (
                  <div key={r.id} className="refItem">
                    <div className="refName">{r.name || r.id}</div>
                    <div className="refTs">{r.at ? new Date(r.at).toLocaleString() : ""}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </details>

        <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12, fontWeight: 800 }}>
          Підказка: лінк веде на бота <b>@{BOT_USERNAME}</b> і відкриває мініапку зі старт-параметром.
        </div>
      </div>

      {/* TASKS */}
      <div className="card">
        <div className="row">
          <div>
            <div className="title">Завдання за монети</div>
            <div className="sub">Натисни “Відкрити”. Після цього перевірка займе 1 годину, і кнопка стане “Отримати”.</div>
          </div>
          <button className="btn tiny" onClick={reloadFromFirestore} disabled={!uid || busy}>
            Оновити
          </button>
        </div>

        <div className="tasks">
          {TASKS.map((t) => {
            const done = completed.has(t.key);
            const openedAt = uid ? readOpenAt(uid, t.key) : null;
            const readyAt = openedAt ? openedAt + VERIFY_MS : 0;
            const msLeft = openedAt ? Math.max(0, readyAt - Date.now()) : 0;

            const stage: "open" | "wait" | "claim" | "done" = done
              ? "done"
              : !openedAt
              ? "open"
              : msLeft > 0
              ? "wait"
              : "claim";

            const btnText =
              stage === "done" ? "Зараховано" : stage === "open" ? "Відкрити" : "Отримати";

            const btnDisabled =
              !uid || busy || stage === "done" || stage === "wait";

            const onBtnClick = async () => {
              if (!uid) return;
              if (stage === "open") {
                openTask(t);
                showToast("Посилання відкрито ✅");
                return;
              }
              if (stage === "claim") {
                await claimTask(t.key);
                return;
              }
            };

            return (
              <div key={t.key} className={`task ${done ? "done" : ""}`}>
                <div className="taskLeft">
                  <div className="taskTitle">{t.title}</div>
                  <div className="taskMeta">
                    Нагорода: <b>{formatNum(t.reward)} MGP</b>
                  </div>

                  {!done ? (
                    <div className="taskHint">
                      {stage === "open" ? (
                        <>Спочатку натисни <b>“Відкрити”</b>.</>
                      ) : stage === "wait" ? (
                        <>
                          Перевірка займе <b>1 годину</b>. Залишилось: <b>{formatEta(msLeft)}</b>
                        </>
                      ) : stage === "claim" ? (
                        <>Перевірка завершена ✅ Можна натиснути <b>“Отримати”</b>.</>
                      ) : null}
                    </div>
                  ) : (
                    <div className="taskHint">Вже зараховано ✅</div>
                  )}
                </div>

                <div className="taskActions">
                  <button
                    className={`btn primary single ${stage === "open" ? "open" : ""}`}
                    onClick={onBtnClick}
                    disabled={btnDisabled}
                    title={
                      stage === "open"
                        ? "Відкрити посилання"
                        : stage === "wait"
                        ? "Потрібно зачекати 1 годину"
                        : stage === "claim"
                        ? "Отримати нагороду через сервер"
                        : "Вже зараховано"
                    }
                  >
                    {busy && stage !== "done" ? "..." : btnText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 10, opacity: 0.72, fontSize: 12, fontWeight: 800 }}>
          ⚠️ Посилання на соцмережі зараз заглушки. Скинь свої реальні лінки — я підставлю.
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <style>{`
        .friends h2{ margin-bottom:12px; }
        .card{
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.08);
          border-radius:16px;
          padding:14px;
          margin-bottom:14px;
          box-shadow: inset 0 0 18px rgba(255,255,255,.03);
        }
        .row{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .title{ font-weight:1000; font-size:16px; }
        .sub{ opacity:.75; font-size:13px; margin-top:4px; }
        .pill{
          font-weight:900; font-size:12px;
          padding:6px 10px; border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
          background:rgba(0,0,0,.18);
          opacity:.9;
          white-space:nowrap;
        }

        .refbox{ margin-top:12px; }
        .reflink{
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
          font-size:12px;
          padding:10px 12px;
          border-radius:12px;
          background:rgba(0,0,0,.25);
          border:1px solid rgba(255,255,255,.08);
          word-break:break-all;
        }
        .btnrow{ display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
        .btn{
          padding:10px 12px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,.10);
          background:rgba(255,255,255,.06);
          color:#fff;
          cursor:pointer;
          font-weight:900;
        }
        .btn.primary{
          border:0;
          background:linear-gradient(180deg, #53ffa6 0%, #15d3c0 100%);
          color:#042018;
        }
        .btn.tiny{
          padding:8px 10px;
          border-radius:10px;
          font-size:12px;
          opacity:.9;
        }
        .btn:disabled{ opacity:.55; cursor:not-allowed; }

        .stats{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:10px;
          margin-top:12px;
        }
        .stat{
          padding:10px 12px;
          border-radius:14px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.08);
        }
        .k{ opacity:.75; font-size:12px; font-weight:800; }
        .v{ font-weight:1000; margin-top:4px; }
        .muted{ opacity:.65; font-weight:800; }

        .acc{
          margin-top:12px;
          padding:10px 12px;
          border-radius:14px;
          background:rgba(255,255,255,.03);
          border:1px dashed rgba(255,255,255,.12);
        }
        .acc summary{
          cursor:pointer;
          font-weight:900;
          opacity:.92;
        }
        .accBody{ margin-top:10px; }
        .refList{ display:flex; flex-direction:column; gap:8px; }
        .refItem{
          display:flex; justify-content:space-between; gap:10px;
          padding:8px 10px; border-radius:12px;
          background:rgba(0,0,0,.18);
          border:1px solid rgba(255,255,255,.06);
        }
        .refName{ font-weight:900; }
        .refTs{ opacity:.65; font-size:12px; }

        .tasks{ margin-top:12px; display:flex; flex-direction:column; gap:10px; }
        .task{
          display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
          padding:12px; border-radius:14px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.08);
        }
        .task.done{ opacity:.78; }
        .taskTitle{ font-weight:1000; }
        .taskMeta{ margin-top:4px; font-size:12px; opacity:.78; font-weight:800; }
        .taskHint{
          margin-top:8px;
          font-size:12px;
          opacity:.78;
          font-weight:800;
        }

        .taskActions{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .btn.single{
          min-width: 124px;
          justify-content:center;
        }
        .btn.single.open{
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.12);
          color:#fff;
        }

        .toast{
          position:fixed;
          left:50%;
          transform:translateX(-50%);
          bottom:86px;
          padding:10px 12px;
          border-radius:12px;
          background:rgba(0,0,0,.75);
          border:1px solid rgba(255,255,255,.12);
          color:#fff;
          font-weight:900;
          z-index:999;
          max-width:min(92vw, 520px);
          text-align:center;
        }
      `}</style>
    </section>
  );
}
