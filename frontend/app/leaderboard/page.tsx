"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { LeaderRow } from "@/lib/types";
import Avatar from "@/components/Avatar";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);

  useEffect(() => {
    api<LeaderRow[]>("/api/leaderboard").then(setRows).catch(() => setRows([]));
  }, []);

  if (!rows) return <div className="center-msg">Loading…</div>;

  return (
    <div className="page">
      <div className="league-head">
        <div className="league-badge">🏆</div>
        <h1>Gold League</h1>
        <p>Top 3 advance to the next league</p>
      </div>
      <div className="lb">
        {rows.map((r) => (
          <div key={r.rank} className={`lb-row ${r.is_me ? "me" : ""} ${r.rank <= 3 ? "promo" : ""}`}>
            <span className="lb-rank">{r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}</span>
            <Avatar name={r.display_name} />
            <span className="lb-name">{r.display_name}</span>
            <span className="lb-xp">{r.weekly_xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}