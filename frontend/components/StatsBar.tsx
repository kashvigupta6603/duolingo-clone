"use client";
import { useUser } from "./UserProvider";

function formatWait(sec: number) {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}

export default function StatsBar() {
  const { user } = useUser();
  return (
    <div className="stats">
      {/* single seeded course: Spanish. Drawn in CSS because Windows can't render flag emoji */}
      <span className="flag-es" title="Spanish" />
      {user && (
        <>
          <span className="stat" style={{ color: user.streak_done_today ? "#ff9600" : "#afafaf" }}>
            <span style={{ filter: user.streak_done_today ? "none" : "grayscale(1)" }}>🔥</span>
            {user.streak}
          </span>
          <span className="stat" style={{ color: "#1cb0f6" }}>💎 {user.gems}</span>
          <span
            className="stat"
            style={{ color: "#ff4b4b" }}
            title={user.hearts < user.max_hearts ? `Next heart in ${formatWait(user.next_heart_in)}` : "Hearts full"}
          >
            ❤️ {user.hearts}
          </span>
        </>
      )}
    </div>
  );
}