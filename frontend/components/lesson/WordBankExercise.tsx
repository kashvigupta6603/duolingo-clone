"use client";
import { useState } from "react";
import { speak } from "@/lib/sound";
import type { ExProps } from "@/lib/types";

export default function WordBankExercise({ exercise, disabled, onChange }: ExProps) {
  const bank = exercise.data.bank as string[];
  const source = exercise.data.source as string;
  const lang = exercise.prompt.includes("in English") ? "es-ES" : "en-US";
  const [picked, setPicked] = useState<number[]>([]); // indices into bank

  const update = (next: number[]) => {
    setPicked(next);
    onChange(next.length ? next.map((i) => bank[i]).join(" ") : null);
  };
  const add = (i: number) => !disabled && !picked.includes(i) && update([...picked, i]);
  const remove = (i: number) => !disabled && update(picked.filter((p) => p !== i));

  return (
    <div>
      <div className="wb-source">
        <span className="mascot-sm">🦉</span>
        <div className="speech">
          <button className="speak-btn" onClick={() => speak(source, lang)} aria-label="Listen">🔊</button>
          {source}
        </div>
      </div>
      <div className="wb-line">
        {picked.map((i) => (
          <button key={i} className="chip" disabled={disabled} onClick={() => remove(i)}>{bank[i]}</button>
        ))}
      </div>
      <div className="wb-bank">
        {bank.map((w, i) =>
          picked.includes(i) ? (
            <span key={i} className="chip ghost">{w}</span>
          ) : (
            <button key={i} className="chip" disabled={disabled} onClick={() => add(i)}>{w}</button>
          )
        )}
      </div>
    </div>
  );
}