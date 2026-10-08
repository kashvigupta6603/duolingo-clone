"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import type { Vault } from "@/lib/types";
import { useUser } from "./UserProvider";
import StatsBar from "./StatsBar";

export default function RightPanel() {
  const { user } = useUser();
  const pathname = usePathname();
  const [vault, setVault] = useState<Vault | null>(null);

  useEffect(() => {
    api<{ vault: Vault }>("/api/profile")
      .then((p) => setVault(p.vault))
      .catch(() => {});
  }, [pathname, user?.xp]);

  const pct = user ? Math.min(100, Math.round((user.xp_today / user.daily_goal) * 100)) : 0;
  const open = vault ? vault.total - vault.mastered : 0;

  return (
    <>
      <StatsBar />
      {user && (
        <div className="card">
          <h3>Daily Quest</h3>
          <div className="quest">
            <span className="quest-icon">⚡</span>
            <div style={{ flex: 1 }}>
              <div className="quest-title">Earn {user.daily_goal} XP</div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${pct}%` }} />
                <span className="bar-label">{Math.min(user.xp_today, user.daily_goal)} / {user.daily_goal}</span>
              </div>
            </div>
            <span style={{ fontSize: 28 }}>{pct >= 100 ? "🎁" : "🔒"}</span>
          </div>
        </div>
      )}
      <div className="card">
        <h3>🧠 Mistakes Vault</h3>
        <p className="card-text">
          {open > 0
            ? `${open} mistake${open > 1 ? "s" : ""} waiting to be mastered. Practice is free, no hearts lost!`
            : "No mistakes to review yet. Wrong answers will show up here."}
        </p>
        <Link href="/practice" className="btn btn-blue">Practice mistakes</Link>
      </div>
    </>
  );
}