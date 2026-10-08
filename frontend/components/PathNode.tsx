"use client";
import type { CSSProperties } from "react";
import type { SkillNode } from "@/lib/types";
import { shade } from "@/lib/color";

interface Props {
  skill: SkillNode;
  color: string;
  offset: number;
  isCurrent: boolean;
  open: boolean;
  onToggle: () => void;
  onStart: () => void;
}

const R = 46;
const CIRC = 2 * Math.PI * R;
const GOLD = "#ffc800";

export default function PathNode({ skill, color, offset, isCurrent, open, onToggle, onStart }: Props) {
  const locked = skill.state === "locked";
  const done = skill.state === "completed";
  const face = locked ? "#e5e5e5" : done ? GOLD : color;
  const edge = locked ? "#b7b7b7" : shade(face, -45);
  const pct = skill.total_lessons ? skill.lessons_completed / skill.total_lessons : 0;

  const popStyle = {
    background: face,
    color: locked ? "#777" : "#fff",
    "--pop-bg": face,
  } as CSSProperties;

  return (
    <div className={`node-row ${open ? "open" : ""}`} style={{ transform: `translateX(${offset}px)` }}>
      <div className="node-wrap">
        {isCurrent && !open && (
          <div className="start-bubble" style={{ color }}>START<span /></div>
        )}
        <svg className="ring" width="104" height="104" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r={R} fill="none" stroke="#e5e5e5" strokeWidth="6" />
          {!locked && pct > 0 && (
            <circle
              cx="52" cy="52" r={R} fill="none"
              stroke={done ? GOLD : color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)}
              transform="rotate(-90 52 52)"
              style={{ transition: "stroke-dashoffset .6s" }}
            />
          )}
        </svg>
        <button
          className="node-btn"
          style={{ background: face, boxShadow: `0 8px 0 ${edge}` }}
          aria-label={skill.title}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          <span className="node-icon" style={{ filter: locked ? "grayscale(1) opacity(.5)" : "none" }}>
            {locked ? "🔒" : skill.icon}
          </span>
        </button>
        {done && <span className="crown">👑</span>}
      </div>

      <div className={`node-label ${locked ? "muted" : ""}`}>{skill.title}</div>
      <div className="dots">
        {Array.from({ length: skill.total_lessons }).map((_, i) => (
          <span key={i} className={i < skill.lessons_completed ? "dot on" : "dot"} />
        ))}
      </div>

      {open && (
        <div className="popover" style={popStyle} onClick={(e) => e.stopPropagation()}>
          <div className="pop-title">{skill.title}</div>
          <div className="pop-sub">
            {locked
              ? "Complete all levels above to unlock this!"
              : done
              ? `Completed: ${skill.total_lessons} of ${skill.total_lessons} lessons`
              : `Lesson ${skill.lessons_completed + 1} of ${skill.total_lessons}`}
          </div>
          {!locked && (
            <button className="pop-btn" style={{ color: done ? "#b58900" : color }} onClick={onStart}>
              {done ? "PRACTICE +10 XP" : "START +10 XP"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}