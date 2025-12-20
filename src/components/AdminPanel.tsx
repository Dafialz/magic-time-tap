// src/components/AdminPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { UserProfile } from "../services/leaderboard";
import {
  getRecentUsers,
  getTopUsers,
  setUserBan,
  adminSetBalance,
} from "../services/leaderboard";

type Props = {
  adminId: string; // твій leaderUserId (наприклад tg_794618820)
};

type Row = { id: string; data: UserProfile };

function fmt(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return Math.floor(v).toLocaleString("uk-UA");
}

function tsToText(x: any): string {
  // Firestore Timestamp має toDate(), а може бути null/undefined
  try {
    const d: Date =
      typeof x?.toDate === "function"
        ? x.toDate()
        : x instanceof Date
        ? x
        : (null as any);

    if (!d) return "—";
    return d.toLocaleString("uk-UA");
  } catch {
    return "—";
  }
}

function parseIntSafe(s: any): number | null {
  const raw = String(s ?? "").trim().replace(/\s+/g, "");
  if (!raw) return null;
  // дозволимо 1_000_000 або 1,000,000 або 1 000 000
  const normalized = raw.replace(/[,_]/g, "");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

export default function AdminPanel({ adminId }: Props) {
  const [mode, setMode] = useState<"recent" | "top">("recent");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string>("");

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const name = String(r.data?.name || "").toLowerCase();
      return r.id.toLowerCase().includes(s) || name.includes(s);
    });
  }, [rows, q]);

  const refresh = async () => {
    setErr("");
    setLoading(true);
    try {
      const list =
        mode === "recent" ? await getRecentUsers(100) : await getTopUsers(100);
      setRows(list as any);
    } catch (e: any) {
      setErr("Не вдалось завантажити список. Перевір Firebase/Rules/Indexes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    /* eslint-disable-next-line */
  }, [mode]);

  const doBan = async (uid: string, ban: boolean) => {
    const reason = ban ? prompt("Причина бану (можна пусто):") || "" : "";
    setLoading(true);
    try {
      await setUserBan(uid, ban, reason, adminId);
      // локально оновимо, щоб одразу видно
      setRows((prev) =>
        prev.map((r) =>
          r.id === uid
            ? {
                ...r,
                data: {
                  ...r.data,
                  banned: ban,
                  banReason: ban ? reason : "",
                },
              }
            : r
        )
      );
    } catch {
      alert("Не вдалось змінити бан. Перевір доступи Firestore rules.");
    } finally {
      setLoading(false);
    }
  };

  const doSetBalance = async (uid: string) => {
    // підкажемо поточне значення
    const cur = rows.find((r) => r.id === uid)?.data as any;
    const currentBalance = cur?.balance;

    const raw = prompt(
      `Новий BALANCE для ${uid} (ціле число, >= 0)\nПоточний: ${fmt(
        currentBalance
      )}\n\nВведи число:`,
      currentBalance != null
        ? String(Math.floor(Number(currentBalance)))
        : ""
    );

    if (raw == null) return; // cancel

    const newBal = parseIntSafe(raw);
    if (newBal == null || newBal < 0) {
      alert("Некоректне число. Введи ціле число >= 0.");
      return;
    }

    const reason = prompt("Причина/нотатка (можна пусто):") || "";

    setLoading(true);
    try {
      await adminSetBalance(uid, newBal, reason, adminId);

      // локально оновимо, щоб одразу видно
      const now = new Date();
      setRows((prev) =>
        prev.map((r) =>
          r.id === uid
            ? {
                ...r,
                data: {
                  ...r.data,
                  balance: newBal as any,
                  balanceReason: reason as any,
                  balanceUpdatedAt: now as any,
                } as any,
              }
            : r
        )
      );
    } catch (e: any) {
      alert(
        "Не вдалось змінити баланс. Перевір доступи Firestore rules та adminSetBalance() у services/leaderboard.ts"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={topRow}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Адмін панель</div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button style={btn(mode === "recent")} onClick={() => setMode("recent")}>
            Останні
          </button>
          <button style={btn(mode === "top")} onClick={() => setMode("top")}>
            Топ
          </button>
          <button style={btn(false)} onClick={refresh} disabled={loading}>
            {loading ? "..." : "Оновити"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "10px 0 12px", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Пошук: tg_..., anon_..., імʼя"
          style={search}
        />
        <div style={{ opacity: 0.75, fontSize: 12 }}>
          Показано: <b>{filtered.length}</b> / {rows.length}
        </div>
      </div>

      {err ? <div style={errBox}>{err}</div> : null}

      {/* ✅ fix mobile: горизонтальний скрол, щоб правий край (кнопки) не обрізався */}
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>UserId</th>
              <th style={th}>Імʼя</th>
              <th style={{ ...th, textAlign: "right" }}>Balance</th>
              <th style={{ ...th, textAlign: "right" }}>Score</th>
              <th style={th}>Last seen</th>
              <th style={th}>Ban</th>
              <th style={{ ...th, width: 240, textAlign: "right" }}>Дії</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const banned = !!(r.data as any)?.banned;
              const balance = (r.data as any)?.balance;

              return (
                <tr
                  key={r.id}
                  style={{
                    background: banned ? "rgba(255,80,80,.08)" : "transparent",
                  }}
                >
                  <td style={tdMono}>{r.id}</td>
                  <td style={td}>{String(r.data?.name || "—")}</td>

                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmt(balance)}
                  </td>

                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmt((r.data as any)?.score)}
                  </td>

                  <td style={td}>{tsToText((r.data as any)?.lastSeenAt)}</td>

                  <td style={td}>
                    {banned ? (
                      <span
                        title={String((r.data as any)?.banReason || "")}
                        style={{ color: "#ff6b6b", fontWeight: 900 }}
                      >
                        BANNED
                      </span>
                    ) : (
                      <span style={{ opacity: 0.8 }}>OK</span>
                    )}
                  </td>

                  <td
                    style={{
                      ...td,
                      textAlign: "right",
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                      flexWrap: "nowrap",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button style={ghostBtn} onClick={() => doSetBalance(r.id)} disabled={loading}>
                      Змінити баланс
                    </button>

                    {!banned ? (
                      <button style={dangerBtn} onClick={() => doBan(r.id, true)} disabled={loading}>
                        Бан
                      </button>
                    ) : (
                      <button style={okBtn} onClick={() => doBan(r.id, false)} disabled={loading}>
                        Розбан
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {!filtered.length ? (
              <tr>
                <td style={{ ...td, opacity: 0.7 }} colSpan={7}>
                  Нічого не знайдено.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12, lineHeight: 1.35 }}>
        <b>Важливо:</b> гра підтягує “адмінський баланс” з поля <code>users_v1.balance</code>.
        Тому для ручного апу використовуй кнопку <b>Змінити баланс</b>.
        <br />
        Також, щоб “Останні”/“Топ” працювали, у Firestore можуть знадобитись індекси по{" "}
        <code>users_v1.lastSeenAt</code> і <code>users_v1.score</code>. Якщо список пустий —
        спочатку хай гравці відкриють гру (heartbeat пише їх у users_v1).
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const topRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const search: React.CSSProperties = {
  flex: "1 1 260px",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.06)",
  color: "#fff",
  outline: "none",
};

const tableWrap: React.CSSProperties = {
  borderRadius: 14,
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(0,0,0,.20)",
};

const table: React.CSSProperties = {
  width: "100%",
  minWidth: 860, // ✅ важливо для мобілки: не стискати до "2 колонок"
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 13,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 10px",
  background: "rgba(255,255,255,.06)",
  borderBottom: "1px solid rgba(255,255,255,.10)",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "10px 10px",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const tdMono: React.CSSProperties = {
  ...td,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: 12,
  opacity: 0.95,
};

const btn = (active: boolean): React.CSSProperties => ({
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.12)",
  background: active ? "rgba(40,231,168,.18)" : "rgba(255,255,255,.06)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const ghostBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const dangerBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,120,120,.30)",
  background: "rgba(255,80,80,.18)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const okBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(80,255,170,.30)",
  background: "rgba(40,231,168,.18)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const errBox: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,80,80,.12)",
  border: "1px solid rgba(255,80,80,.22)",
  color: "#fff",
  fontWeight: 700,
};
