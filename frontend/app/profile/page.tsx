"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ProfileData } from "@/lib/types";
import Avatar from "@/components/Avatar";

export default function ProfilePage() {
  const [p, setP] = useState<ProfileData | null>(null);

  useEffect(() => {
    api<ProfileData>("/api/profile").then(setP).catch(() => {});
  }, []);

  if (!p) return <div className="center-msg">Loading…</div>;
  const u = p.user;
  const stats = [
    { icon: "🔥", value: u.streak, label: "Day streak" },
    { icon: "⚡", value: u.xp, label: "Total XP" },
    { icon: "📘", value: p.lessons_completed, label: "Lessons done" },
    { icon: "🧠", value: `${p.vault.mastered}/${p.vault.total}`, label: "Mistakes mastered" },
  ];

  return (
    <div className="page">
      <div className="profile-head">
        <Avatar name={u.display_name} size={96} />
        <div>
          <h1>{u.display_name}</h1>
          <p>@{u.username} · Learning Spanish 🇪🇸</p>
        </div>
      </div>

      <h2 className="section-title">Statistics</h2>
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat-tile" key={s.label}>
            <span className="st-icon">{s.icon}</span>
            <div>
              <div className="st-val">{s.value}</div>
              <div className="st-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Achievements</h2>
      <div className="ach-list">
        {p.achievements.map((a) => (
          <div key={a.code} className={`ach ${a.unlocked ? "" : "locked"}`}>
            <span className="ach-icon">{a.icon}</span>
            <div>
              <div className="ach-title">{a.title}</div>
              <div className="ach-desc">{a.description}</div>
            </div>
            {a.unlocked && <span className="ach-check">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}