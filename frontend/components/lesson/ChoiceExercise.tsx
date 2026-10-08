"use client";
import { useEffect, useState } from "react";
import type { ExProps } from "@/lib/types";

export default function ChoiceExercise({ exercise, disabled, result, onChange }: ExProps) {
  const [sel, setSel] = useState<string | null>(null);
  const options = exercise.data.options as string[];
  const isBlank = exercise.type === "fill_blank";
  const parts = isBlank ? (exercise.data.sentence as string).split("___") : [];

  const pick = (o: string) => {
    if (disabled) return;
    setSel(o);
    onChange(o);
  };

  // keyboard shortcuts 1-4, like the real app
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) pick(options[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cls = (o: string) => {
    if (result && !result.correct && o === result.correct_answer) return "choice right";
    if (sel !== o) return "choice";
    if (!result) return "choice sel";
    return result.correct ? "choice right" : "choice wrong";
  };

  return (
    <div>
      {isBlank && (
        <div className="blank-sentence">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && <span className="blank-slot">{sel ?? ""}</span>}
            </span>
          ))}
          <div className="blank-hint">{exercise.data.hint as string}</div>
        </div>
      )}
      <div className={isBlank ? "choices row" : "choices"}>
        {options.map((o, i) => (
          <button key={o} className={cls(o)} disabled={disabled} onClick={() => pick(o)}>
            <span className="choice-key">{i + 1}</span>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}