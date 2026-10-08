"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { shade } from "@/lib/color";
import type { PathData } from "@/lib/types";
import PathNode from "@/components/PathNode";

const OFFSETS = [0, 55, 0, -55]; // zig-zag of the path

export default function LearnPage() {
  const router = useRouter();
  const [path, setPath] = useState<PathData | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<PathData>("/api/path").then(setPath).catch((e) => setError(e.message));
  }, []);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  if (error)
    return (
      <div className="center-msg">
        Could not reach the server. Is the backend running?<br /><small>{error}</small>
      </div>
    );
  if (!path) return <div className="center-msg">Loading…</div>;

  const all = path.units.flatMap((u) => u.skills);
  const currentId = all.find((s) => s.state === "available" || s.state === "in_progress")?.id;

  return (
    <div className="path" onClick={() => setOpenId(null)}>
      {path.units.map((unit, ui) => (
        <section className="unit" key={unit.id}>
          <div
            className="unit-banner"
            style={{ background: unit.color, boxShadow: `0 5px 0 ${shade(unit.color, -45)}` }}
          >
            <div>
              <div className="unit-sub">Section 1, {unit.title}</div>
              <div className="unit-title">{unit.description}</div>
            </div>
            <button className="guide-btn" onClick={() => showToast("Guidebook: coming soon!")}>
              📖 Guidebook
            </button>
          </div>

          <div className="unit-nodes">
            {unit.skills.map((skill) => {
              const gi = all.findIndex((s) => s.id === skill.id);
              return (
                <PathNode
                  key={skill.id}
                  skill={skill}
                  color={unit.color}
                  offset={OFFSETS[gi % OFFSETS.length]}
                  isCurrent={skill.id === currentId}
                  open={openId === skill.id}
                  onToggle={() => setOpenId(openId === skill.id ? null : skill.id)}
                  onStart={() => router.push(`/lesson/${skill.next_lesson_id}`)}
                />
              );
            })}
          </div>
          <div className="mascot" style={{ top: `${30 + (ui % 2) * 10}%` }}>🦉</div>
        </section>
      ))}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}