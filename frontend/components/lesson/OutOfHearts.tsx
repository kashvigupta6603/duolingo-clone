"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@/lib/types";

interface Props {
  user: User | null;
  busy: boolean;
  error: string;
  onRefill: () => void;
  onQuit: () => void;
}

export default function OutOfHearts({ user, busy, error, onRefill, onQuit }: Props) {
  const base = user?.next_heart_in ?? 0;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, base - elapsed);
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="overlay">
      <div className="modal">
        <div style={{ fontSize: 80 }}>💔</div>
        <h2>You ran out of hearts!</h2>
        <p>{base > 0 ? `Next heart in ${mm}. ` : ""}Practice your mistakes to earn one back, or refill with gems.</p>
        <Link href="/practice" className="btn">Practice to earn a heart</Link>
        <button className="btn btn-blue" disabled={busy} onClick={onRefill}>
          {busy ? "Refilling…" : "Refill hearts · 💎 100"}
        </button>
        {error && <p style={{ color: "#ea2b2b", margin: "0 0 8px" }}>{error}</p>}
        <button className="link-btn" onClick={onQuit}>No thanks</button>
      </div>
    </div>
  );
}