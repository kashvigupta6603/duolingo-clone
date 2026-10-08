"use client";
import type { AnswerResult } from "@/lib/types";

interface Props {
  result: AnswerResult | null;
  canCheck: boolean;
  checking: boolean;
  message: string;
  answerText: string;
  onCheck: () => void;
  onContinue: () => void;
}

export default function FeedbackBar({ result, canCheck, checking, message, answerText, onCheck, onContinue }: Props) {
  if (!result) {
    return (
      <footer className="fbar">
        <div className="fbar-in">
          <span />
          <button className={`fbtn check ${canCheck ? "on" : ""}`} disabled={!canCheck || checking} onClick={onCheck}>
            Check
          </button>
        </div>
      </footer>
    );
  }
  const ok = result.correct;
  return (
    <footer className={`fbar ${ok ? "correct" : "wrong"}`}>
      <div className="fbar-in">
        <div className="fb-msg">
          <span className="fb-icon">{ok ? "✓" : "✕"}</span>
          <div>
            <div className="fb-title">{ok ? message : "Correct solution:"}</div>
            {!ok && <div className="fb-answer">{answerText}</div>}
          </div>
        </div>
        <button className={`fbtn ${ok ? "green" : "red"}`} onClick={onContinue}>Continue</button>
      </div>
    </footer>
  );
}