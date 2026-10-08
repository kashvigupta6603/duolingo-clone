"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { playCorrect, playWrong } from "@/lib/sound";
import type { AnswerResult, CompleteResult, Exercise, User } from "@/lib/types";
import { useUser } from "../UserProvider";
import ChoiceExercise from "./ChoiceExercise";
import WordBankExercise from "./WordBankExercise";
import MatchExercise from "./MatchExercise";
import TypeExercise from "./TypeExercise";
import FeedbackBar from "./FeedbackBar";
import CompleteScreen from "./CompleteScreen";
import OutOfHearts from "./OutOfHearts";

type LoadState = "loading" | "ready" | "empty" | "error" | "no_hearts";
const GOOD = ["Great job!", "Awesome!", "Nicely done!", "Excellent!", "Perfect!"];

function formatAnswer(a: unknown): string {
  if (Array.isArray(a)) return a.map((p) => (Array.isArray(p) ? p.join(" = ") : String(p))).join("   ·   ");
  return String(a);
}

export default function LessonPlayer({ mode, lessonId }: { mode: "lesson" | "practice"; lessonId?: number }) {
  const router = useRouter();
  const { user, setUser, refresh } = useUser();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [queue, setQueue] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState<CompleteResult | null>(null);
  const [showQuit, setShowQuit] = useState(false);
  const [noHearts, setNoHearts] = useState(false);
  const [refilling, setRefilling] = useState(false);
  const [refillError, setRefillError] = useState("");
  const busy = useRef(false);

  const url = mode === "lesson" ? `/api/lessons/${lessonId}` : "/api/practice/mistakes";

  // load the exercises (answers are NOT included, the server checks them)
  useEffect(() => {
    let alive = true;
    api<{ exercises: Exercise[] }>(url)
      .then((d) => {
        if (!alive) return;
        if (!d.exercises.length) return setLoadState("empty");
        setQueue(d.exercises);
        setTotal(d.exercises.length);
        setLoadState("ready");
      })
      .catch((e: Error) => alive && setLoadState(e.message === "no_hearts" ? "no_hearts" : "error"));
    return () => {
      alive = false;
    };
  }, [url, reloadKey]);

  const check = async () => {
    if (answer === null || result || busy.current) return;
    busy.current = true;
    setChecking(true);
    try {
      const res = await api<AnswerResult>("/api/answer", {
        method: "POST",
        body: JSON.stringify({ exercise_id: queue[idx].id, answer, mode }),
      });
      setResult(res);
      if (res.correct) {
        setMessage(GOOD[Math.floor(Math.random() * GOOD.length)]);
        setCorrectCount((c) => c + 1);
        playCorrect();
      } else {
        setMistakes((m) => m + 1);
        playWrong();
      }
      if (user) setUser({ ...user, hearts: res.hearts });
      if (!res.correct && mode === "lesson" && res.hearts === 0) refresh(); // get next_heart_in
    } catch (e) {
      if ((e as Error).message === "no_hearts") setLoadState("no_hearts");
    } finally {
      busy.current = false;
      setChecking(false);
    }
  };

  const finish = async () => {
    setLoadState("loading");
    try {
      const out =
        mode === "lesson"
          ? await api<CompleteResult>(`/api/lessons/${lessonId}/complete`, {
              method: "POST",
              body: JSON.stringify({ mistakes }),
            })
          : await api<CompleteResult>("/api/practice/complete", { method: "POST" });
      setUser(out.user);
      setFinished(out);
    } catch {
      setLoadState("error");
    }
  };

  // wrong answers go to the back of the queue, like the real app
  const advance = () => {
    if (!result) return;
    let q = queue;
    if (!result.correct) {
      q = [...queue, queue[idx]];
      setQueue(q);
    }
    setAnswer(null);
    setResult(null);
    if (idx + 1 >= q.length) finish();
    else setIdx(idx + 1);
  };

  const onContinue = () => {
    if (!result) return;
    if (!result.correct && mode === "lesson" && result.hearts === 0) return setNoHearts(true);
    advance();
  };

  const refill = async (after: () => void) => {
    setRefilling(true);
    setRefillError("");
    try {
      setUser(await api<User>("/api/hearts/refill", { method: "POST" }));
      after();
    } catch (e) {
      setRefillError((e as Error).message);
    } finally {
      setRefilling(false);
    }
  };

  // Enter = Check / Continue
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || loadState !== "ready" || showQuit || noHearts || finished) return;
      e.preventDefault();
      if (result) onContinue();
      else check();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const goBack = () => router.push("/learn");

  // ---------- screens ----------
  if (finished) {
    const accuracy = total ? Math.max(0, Math.round(((total - mistakes) / total) * 100)) : 100;
    return <CompleteScreen result={finished} accuracy={accuracy} mode={mode} onContinue={goBack} />;
  }
  if (loadState === "loading") return <div className="center-msg">Loading…</div>;
  if (loadState === "error")
    return (
      <div className="center-msg">
        Something went wrong.<br /><br />
        <button className="btn btn-blue" style={{ maxWidth: 220, margin: "0 auto" }} onClick={goBack}>Back to path</button>
      </div>
    );
  if (loadState === "empty")
    return (
      <div className="center-msg">
        <div style={{ fontSize: 80 }}>🎉</div>
        Nothing to review right now!<br />Mistakes come back here for practice.<br /><br />
        <button className="btn" style={{ maxWidth: 220, margin: "0 auto" }} onClick={goBack}>Back to path</button>
      </div>
    );
  if (loadState === "no_hearts")
    return (
      <OutOfHearts
        user={user}
        busy={refilling}
        error={refillError}
        onQuit={goBack}
        onRefill={() => refill(() => { setLoadState("loading"); setReloadKey((k) => k + 1); })}
      />
    );

  const ex = queue[idx];
  const common = { exercise: ex, disabled: !!result, result, onChange: setAnswer };

  return (
    <div className="lesson">
      <header className="lesson-top">
        <button className="x-btn" onClick={() => setShowQuit(true)} aria-label="Quit">✕</button>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${total ? (correctCount / total) * 100 : 0}%` }} />
        </div>
        <div className="lesson-hearts">{mode === "lesson" ? `❤️ ${user?.hearts ?? ""}` : "🧠"}</div>
      </header>

      <main className="lesson-main">
        <div className={`lesson-inner ${result && !result.correct ? "shake" : ""}`}>
          <h1 className="lesson-prompt">{ex.prompt}</h1>
          {ex.type === "multiple_choice" || ex.type === "fill_blank" ? (
            <ChoiceExercise key={idx} {...common} />
          ) : ex.type === "translate" ? (
            <WordBankExercise key={idx} {...common} />
          ) : ex.type === "match_pairs" ? (
            <MatchExercise key={idx} {...common} />
          ) : (
            <TypeExercise key={idx} {...common} />
          )}
        </div>
      </main>

      <FeedbackBar
        result={result}
        canCheck={answer !== null}
        checking={checking}
        message={message}
        answerText={result ? formatAnswer(result.correct_answer) : ""}
        onCheck={check}
        onContinue={onContinue}
      />

      {showQuit && (
        <div className="overlay">
          <div className="modal">
            <div style={{ fontSize: 72 }}>🦉</div>
            <h2>Wait, don&apos;t go!</h2>
            <p>You&apos;ll lose your progress in this lesson if you quit now.</p>
            <button className="btn" onClick={() => setShowQuit(false)}>Keep learning</button>
            <button className="link-btn danger" onClick={goBack}>End session</button>
          </div>
        </div>
      )}

      {noHearts && (
        <OutOfHearts
          user={user}
          busy={refilling}
          error={refillError}
          onQuit={goBack}
          onRefill={() => refill(() => { setNoHearts(false); advance(); })}
        />
      )}
    </div>
  );
}