"use client";
import type { CompleteResult } from "@/lib/types";

const CONFETTI = ["#ffc800", "#58cc02", "#1cb0f6", "#ff4b4b", "#ce82ff"];

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="stat-card" style={{ borderColor: color }}>
      <div className="sc-head" style={{ background: color }}>{label}</div>
      <div className="sc-body" style={{ color }}>{value}</div>
    </div>
  );
}

interface Props {
  result: CompleteResult;
  accuracy: number;
  mode: "lesson" | "practice";
  onContinue: () => void;
}

export default function CompleteScreen({ result, accuracy, mode, onContinue }: Props) {
  return (
    <div className="complete">
      <div className="confetti">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              background: CONFETTI[i % 5],
              animationDelay: `${(i % 7) * 0.25}s`,
              animationDuration: `${2.4 + (i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>
      <div className="big">🏆</div>
      <h1>{mode === "practice" ? "Practice complete!" : "Lesson Complete!"}</h1>
      <div className="stat-cards">
        <StatCard label="Total XP" value={`⚡ ${result.xp_gained}`} color="#ffc800" />
        <StatCard label="Accuracy" value={`🎯 ${accuracy}%`} color="#58cc02" />
        <StatCard label="Streak" value={`🔥 ${result.user.streak}`} color="#ff9600" />
      </div>
      {result.skill_completed && <div className="banner">👑 Skill completed!</div>}
      {mode === "practice" && <div className="banner">❤️ +1 heart earned</div>}
      {result.new_achievements.map((a) => (
        <div className="banner" key={a.code}>{a.icon} Achievement unlocked: {a.title}</div>
      ))}
      <footer className="fbar">
        <div className="fbar-in">
          <span />
          <button className="fbtn green" onClick={onContinue}>Continue</button>
        </div>
      </footer>
    </div>
  );
}