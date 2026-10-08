"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useUser } from "@/components/UserProvider";

const GOALS = [
  { xp: 10, label: "Casual" },
  { xp: 20, label: "Regular" },
  { xp: 30, label: "Serious" },
  { xp: 50, label: "Intense" },
];

const PLACEHOLDERS = [
  "Notifications", "Sound effects", "Course & language", "Super Duolingo",
  "Friends & social", "Dark mode", "Privacy",
];

export default function SettingsPage() {
  const { user, setUser } = useUser();
  const [toast, setToast] = useState("");

  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2000);
  };

  const setGoal = async (xp: number) => {
    try {
      setUser(await api<User>("/api/settings", { method: "POST", body: JSON.stringify({ daily_goal: xp }) }));
      say(`Daily goal set to ${xp} XP`);
    } catch (e) {
      say((e as Error).message);
    }
  };

  const nextDay = async () => {
    setUser(await api<User>("/api/dev/next-day", { method: "POST" }));
    say("Simulated: it is now the next day");
  };

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      <h2 className="section-title">Daily goal</h2>
      <div className="goal-list">
        {GOALS.map((g) => (
          <button
            key={g.xp}
            className={`goal ${user?.daily_goal === g.xp ? "on" : ""}`}
            onClick={() => setGoal(g.xp)}
          >
            <span>{g.label}</span>
            <span>{g.xp} XP / day</span>
          </button>
        ))}
      </div>

      <h2 className="section-title">Preferences</h2>
      <div className="set-list">
        {PLACEHOLDERS.map((p) => (
          <button key={p} className="set-row" onClick={() => say(`${p}: coming soon!`)}>
            <span>{p}</span>
            <span className="chev">›</span>
          </button>
        ))}
      </div>

      <h2 className="section-title">Developer tools</h2>
      <div className="card">
        <p className="card-text">Simulate the next day to test streaks without waiting 24 hours.</p>
        <button className="btn btn-blue" onClick={nextDay}>Simulate next day</button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}