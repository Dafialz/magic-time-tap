import React, { useEffect, useMemo, useState } from "react";
import type { LBEntry } from "../services/leaderboard";
import { subscribeTopN } from "../services/leaderboard";

export type LeaderEntry = LBEntry;

type Props = {
  nickname?: string;
  currentScore?: number;
  entries?: LeaderEntry[];
};

const STORAGE_KEY = "mt_leaderboard_v1";
const CLOUD_TIMEOUT_MS = 1800;

function fmt(n: number) {
  return Math.floor(n).toLocaleString("uk-UA");
}

/* ===== local ===== */

function loadLB(): LeaderEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as LeaderEntry[];
    if (Array.isArray(arr)) {
      return arr.filter(
        (x) => x && typeof x.name === "string" && Number.isFinite(x.score)
      );
    }
  } catch {}
  return [];
}

function saveLB(arr: LeaderEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

/* ===== demo ===== */

function seedDemo(): LeaderEntry[] {
  const list: LeaderEntry[] = [];
  for (let i = 1; i <= 100; i++) {
    list.push({
      name: `Hero ${String(i).padStart(3, "0")}`,
      score: Math.round(10_000_000 / i),
    });
  }
  return list;
}

type CloudState = "entries" | "pending" | "active" | "fallback";

export default function LeadersPanel({
  nickname,
  currentScore = 0,
  entries,
}: Props) {
  const [lb, setLb] = useState<LeaderEntry[]>(() => {
    // якщо передали entries — показуємо їх, без хмари/демо
    if (entries?.length) return entries;

    // локал показуємо одразу (якщо є), щоб не було пустого екрану
    const local = loadLB();
    return local.length ? local : [];
  });

  const [cloudState, setCloudState] = useState<CloudState>(() =>
    entries?.length ? "entries" : "pending"
  );

  const usingCloud = cloudState === "active";

  /* ===== init ===== */
  useEffect(() => {
    // 1) якщо є entries — ніяких підписок/фолбеків
    if (entries?.length) {
      setLb(entries);
      setCloudState("entries");
      return;
    }

    setCloudState("pending");

    // беремо локал (але НЕ сідаємо демо одразу — щоб не блимало)
    const local = loadLB();
    if (local.length) setLb(local);
    else setLb([]); // покажемо "Завантаження..." замість Hero-демо

    // якщо хмара не відповіла — робимо fallback
    const t = window.setTimeout(() => {
      const curLocal = loadLB();
      if (curLocal.length) {
        setLb(curLocal);
      } else {
        const demo = seedDemo();
        setLb(demo);
        saveLB(demo);
      }
      setCloudState("fallback");
    }, CLOUD_TIMEOUT_MS);

    // пробуємо cloud: перший snapshot фіксує режим (навіть якщо пусто)
    const unsub = subscribeTopN(100, (rows) => {
      window.clearTimeout(t);
      setCloudState("active");
      setLb(Array.isArray(rows) ? rows : []);
    });

    return () => {
      window.clearTimeout(t);
      unsub();
    };
  }, [entries]);

  /* ===== local update (тільки коли НЕ cloud і не entries) ===== */
  useEffect(() => {
    if (usingCloud) return;
    if (cloudState === "entries") return;
    if (!nickname || currentScore <= 0) return;

    setLb((prev) => {
      const without = prev.filter((e) => e.name !== nickname);
      const merged = [...without, { name: nickname, score: currentScore }];
      merged.sort((a, b) => b.score - a.score);
      const top100 = merged.slice(0, 100);
      saveLB(top100);
      return top100;
    });
  }, [nickname, currentScore, usingCloud, cloudState]);

  /* ===== computed ===== */
  const rows = useMemo(() => {
    return [...lb]
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
      .map((e, i) => ({ rank: i + 1, ...e }));
  }, [lb]);

  const myRank = useMemo(
    () => rows.find((r) => r.name === nickname)?.rank ?? null,
    [rows, nickname]
  );

  const subtitle = useMemo(() => {
    if (cloudState === "pending") return "Завантаження рейтингу…";
    if (cloudState === "active") return "Онлайн рейтинг (хмара)";
    if (cloudState === "entries") return "Рейтинг (передані дані)";
    return "Демо / локальний режим";
  }, [cloudState]);

  /* ===== render ===== */
  return (
    <section className="leaders" aria-labelledby="leaders-title">
      <h2
        id="leaders-title"
        style={{ textAlign: "center", margin: "12px 0 8px" }}
      >
        Список лідерів
      </h2>

      <div style={{ textAlign: "center", opacity: 0.85, marginBottom: 10 }}>
        Топ-100 за загальними монетами (MTP).{" "}
        {nickname ? <b>{nickname}</b> : "Ви"} зараз маєте{" "}
        <b>{fmt(currentScore)}</b>.
        {myRank && (
          <>
            {" "}
            Місце: <b>#{myRank}</b>.
          </>
        )}
        <div style={{ fontSize: 12, opacity: 0.7 }}>{subtitle}</div>
      </div>

      <div style={tableWrap}>
        {cloudState === "pending" && rows.length === 0 ? (
          <div style={loadingBox}>Завантаження…</div>
        ) : rows.length === 0 ? (
          <div style={loadingBox}>Поки що немає записів</div>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={{ width: 56, textAlign: "right", paddingRight: 8 }}>
                  #
                </th>
                <th style={{ textAlign: "left" }}>Гравець</th>
                <th style={{ textAlign: "right" }}>Монети</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rank, name, score }) => {
                const isMe = nickname && name === nickname;
                const isTop1 = rank === 1;
                return (
                  <tr
                    key={`${name}-${rank}`}
                    style={{
                      background: isMe
                        ? "rgba(40,231,168,.12)"
                        : isTop1
                        ? "rgba(255,215,64,.10)"
                        : "transparent",
                    }}
                  >
                    <td
                      style={{
                        textAlign: "right",
                        paddingRight: 8,
                        fontWeight: isTop1 ? 900 : 600,
                      }}
                    >
                      {rank}
                    </td>
                    <td style={{ fontWeight: isMe ? 800 : 600 }}>
                      {name} {isTop1 ? " 👑" : isMe ? " (ви)" : ""}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {fmt(score)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ===== styles ===== */

const tableWrap: React.CSSProperties = {
  margin: "8px 12px 16px",
  background: "rgba(25,30,40,.95)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 14,
  overflow: "hidden",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
};

const loadingBox: React.CSSProperties = {
  padding: "18px 12px",
  textAlign: "center",
  opacity: 0.8,
};
