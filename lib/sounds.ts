/**
 * Simple sound effects using Web Audio API (no external files, no copyright issues).
 * Plays on user gesture so autoplay policy is satisfied.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

export function speakEnglish(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(
    (v) => v.lang.startsWith("en") && v.name.includes("Samantha"),
  ) ?? voices.find((v) => v.lang.startsWith("en-"));
  if (enVoice) utterance.voice = enVoice;
  window.speechSynthesis.speak(utterance);
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3
) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // ignore
  }
}

/** Pleasant two-tone "correct" chime */
export function playCorrectSound() {
  if (typeof window === "undefined") return;
  playTone(523.25, 0.12, "sine", 0.25);
  setTimeout(() => {
    playTone(659.25, 0.2, "sine", 0.2);
  }, 80);
}

/** Soft "wrong" tone (not harsh) — for Cloze etc. */
export function playWrongSound() {
  if (typeof window === "undefined") return;
  playTone(220, 0.15, "sine", 0.2);
  setTimeout(() => {
    playTone(196, 0.2, "sine", 0.15);
  }, 60);
}

/** Gentle "saved for later" tone — positive, not negative (あとで練習) */
export function playLaterSound() {
  if (typeof window === "undefined") return;
  playTone(440, 0.1, "sine", 0.2);
  setTimeout(() => {
    playTone(554.37, 0.15, "sine", 0.18);
  }, 70);
}

/** Short "flip" sound — シャッっとめくる感じ */
export function playFlipSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // ignore
  }
}

/** Ascending triumphant tones for leveling up */
export function playLevelUpSound() {
  if (typeof window === "undefined") return;
  playTone(523.25, 0.15, "sine", 0.25);
  setTimeout(() => playTone(659.25, 0.15, "sine", 0.25), 100);
  setTimeout(() => playTone(783.99, 0.15, "sine", 0.25), 200);
  setTimeout(() => playTone(1046.5, 0.25, "sine", 0.3), 300);
}

/** Special chime for milestone streaks (5, 10, 20) */
export function playStreakBonusSound() {
  if (typeof window === "undefined") return;
  playTone(880, 0.1, "sine", 0.2);
  setTimeout(() => playTone(1108.73, 0.1, "sine", 0.2), 80);
  setTimeout(() => playTone(1318.51, 0.15, "sine", 0.25), 160);
  setTimeout(() => playTone(1760, 0.2, "sine", 0.2), 250);
}

/** Subtle positive tick for XP gain */
export function playXpGainSound() {
  if (typeof window === "undefined") return;
  playTone(1200, 0.05, "sine", 0.15);
  setTimeout(() => playTone(1500, 0.08, "sine", 0.12), 40);
}
