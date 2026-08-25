import { useCallback } from "react";
import type { SoundMode } from "../theme";

function playBeep(frequency: number = 880, duration: number = 0.18) {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch { /* AudioContext not available */ }
}

export function useVoiceCues(mode: SoundMode) {
  const cue = useCallback(
    (text: string, beepFreq: number = 880) => {
      if (mode === "silent") return;
      if (mode === "beep" || mode === "both") playBeep(beepFreq);
      if (mode === "voice" || mode === "both") {
        try {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 1.05;
          u.pitch = 1;
          u.volume = 1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch { /* Speech API not available */ }
      }
    },
    [mode]
  );
  return cue;
}
