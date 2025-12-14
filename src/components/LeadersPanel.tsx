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
        x => x && typeof x.name === "string" && Number.isFinite(x.score)
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

export default function LeadersPanel({
  nickname,
  currentScore = 0,
  entries,
}: Props) {
  const [lb, setLb] = useState<LeaderEntry[]>(() => {
    if (entries?.length) return entries;
    const local = loadLB();
    return local.length ? local : seedDemo();
  });

  const [usingCloud, setUsingCloud] = useState(false);

  /* ===== init ===== */
  useEffect(() => {
    if (entries?.length) {
      setLb(entries);
      setUsingCloud(false);
      return;
    }

    // спочатку локал / демо — щоб UI не був пустий
    const local = loadLB();
    if (local.length) setLb(local);
    else {
      const demo = seedDemo();
      setLb(demo);
      saveLB(demo);
    }

    // пробуємо cloud
    const unsub = subscribeTopN(100, (rows) => {
      if (rows && rows.length > 0) {
        setLb(rows);
        setUsingCloud(true);
      }
    });

    return () => unsub();
  }, [entries]);

  /* ===== local update (коли без cloud) ===== */
  useEffect(() => {
    if (usingCloud || !nickname || currentScore <= 0) return;

    setLb(prev => {
      const without = prev.filter(e => e.name !== nickname);
      const merged = [...without, { name: nickname, score: currentScore }];
      merged.sort((a, b) => b.score - a.score);
      const top100 = merged.slice(0, 100);
      saveLB(top100);
      return top100;
    });
  }, [nickname, currentScore, usingCloud]);

  /* ===== computed ===== */
  const rows = useMemo(() => {
    return [...lb]
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
      .map((e, i) => ({ rank: i + 1, ...e }));
  }, [lb]);

  const myRank = useMemo(
    () => rows.find(r => r.name === nickname)?.rank ?? null,
    [rows, nickname]
  );

  /* ===== render ===== */
  return (
    <section className="leaders" aria-labelledby="leaders-title">
      <h2 id="leaders-title" style={{ textAlign: "center", margin: "12px 0 8px" }}>
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
        {!usingCloud && (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Демо / локальний режим
          </div>
        )}
      </div>

      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={{ width: 56, textAlign: "right", paddingRight: 8 }}>#</th>
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
                  key={name}
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
