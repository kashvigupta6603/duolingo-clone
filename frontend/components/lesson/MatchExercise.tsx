"use client";
import { useState, type CSSProperties } from "react";
import type { ExProps } from "@/lib/types";

const COLORS = ["#1cb0f6", "#ce82ff", "#ff9600", "#ff86d0"];

export default function MatchExercise({ exercise, disabled, result, onChange }: ExProps) {
  const left = exercise.data.left as string[];
  const right = exercise.data.right as string[];
  const [pairs, setPairs] = useState<[number, number][]>([]); // [leftIdx, rightIdx]
  const [selL, setSelL] = useState<number | null>(null);
  const [selR, setSelR] = useState<number | null>(null);

  const emit = (p: [number, number][]) =>
    onChange(p.length === left.length ? p.map(([l, r]) => [left[l], right[r]]) : null);

  const commit = (l: number, r: number) => {
    const next: [number, number][] = [...pairs, [l, r]];
    setPairs(next);
    setSelL(null);
    setSelR(null);
    emit(next);
  };

  const unpair = (side: 0 | 1, i: number) => {
    const next = pairs.filter((p) => p[side] !== i);
    setPairs(next);
    emit(next);
  };

  const tap = (side: 0 | 1, i: number) => {
    if (disabled) return;
    if (pairs.some((p) => p[side] === i)) return unpair(side, i);
    if (side === 0) {
      if (selR !== null) return commit(i, selR);
      setSelL(selL === i ? null : i);
    } else {
      if (selL !== null) return commit(selL, i);
      setSelR(selR === i ? null : i);
    }
  };

  const styleFor = (side: 0 | 1, i: number): CSSProperties => {
    const k = pairs.findIndex((p) => p[side] === i);
    if (k >= 0) {
      let c = COLORS[k % COLORS.length];
      if (result) {
        const truth = result.correct_answer as string[][];
        const ok = truth.some(([a, b]) => a === left[pairs[k][0]] && b === right[pairs[k][1]]);
        c = ok ? "#58cc02" : "#ff4b4b";
      }
      return { borderColor: c, background: c + "22", color: c };
    }
    if ((side === 0 ? selL : selR) === i) return { borderColor: "#84d8ff", background: "#ddf4ff", color: "#1899d6" };
    return {};
  };

  return (
    <div className="match">
      {[left, right].map((col, side) => (
        <div className="match-col" key={side}>
          {col.map((w, i) => (
            <button
              key={w}
              className="choice match-item"
              disabled={disabled}
              style={styleFor(side as 0 | 1, i)}
              onClick={() => tap(side as 0 | 1, i)}
            >
              {w}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}