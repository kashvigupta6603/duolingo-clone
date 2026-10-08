let ctx: AudioContext | null = null;

function beep(notes: [number, number][], type: OscillatorType) {
  try {
    ctx = ctx ?? new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of notes) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
      t += dur;
    }
  } catch {
    /* audio not available */
  }
}

export const playCorrect = () => beep([[660, 0.09], [880, 0.14]], "sine");
export const playWrong = () => beep([[220, 0.18]], "sawtooth");

/** Text-to-speech (bonus feature) using the browser's built-in voices */
export function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}