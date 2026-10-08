"use client";
import { useEffect, useRef, useState } from "react";
import type { ExProps } from "@/lib/types";

export default function TypeExercise({ disabled, result, onChange }: ExProps) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const cls = result ? (result.correct ? "type-input right" : "type-input wrong") : "type-input";

  return (
    <div>
      <div className="wb-source"><span className="mascot-sm">🦉</span></div>
      <input
        ref={ref}
        className={cls}
        value={text}
        disabled={disabled}
        placeholder="Type in English"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.trim() ? e.target.value : null);
        }}
      />
    </div>
  );
}