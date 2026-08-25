import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Play, Pause, Flag } from "lucide-react";
import CircleTimer from "./CircleTimer";
import type { Theme, SessionRecord } from "../theme";

const ACCENT = "#A0A0A8";   // stopwatch uses readyColor

function fmtMain(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function fmtCs(ms: number) {
  return String(Math.floor((ms % 1000) / 10)).padStart(2, "0");
}
function fmtLap(ms: number) {
  const s = Math.floor(ms / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

interface Props {
  dark: boolean;
  t: Theme;
  onSessionComplete?: (d: Omit<SessionRecord, "id" | "completedAt" | "type" | "label">) => void;
}

export default function WatchTab({ dark: _dark, t, onSessionComplete }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [lapStart, setLapStart] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsed(e => e + 10), 10);
    return () => clearInterval(id);
  }, [isRunning]);

  function toggleRun() { setIsRunning(r => !r); }
  function reset() {
    if (isRunning) onSessionComplete?.({ durationSecs: Math.floor(elapsed / 1000) });
    setIsRunning(false); setElapsed(0); setLaps([]); setLapStart(0);
  }
  function recordLap() {
    if (!isRunning) return;
    setLaps(prev => [...prev, elapsed - lapStart]);
    setLapStart(elapsed);
  }

  const progress = (elapsed % 60000) / 60000;
  const currentLapElapsed = elapsed - lapStart;
  const fastestSplit = laps.length > 1 ? Math.min(...laps) : null;
  const slowestSplit = laps.length > 1 ? Math.max(...laps) : null;

  const ringAccent = isRunning ? t.effortColor : t.readyColor;

  const timeNode = (
    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
      <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: t.text }}>{fmtMain(elapsed)}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color: t.muted, letterSpacing: "-0.01em" }}>.{fmtCs(elapsed)}</span>
    </div>
  );

  return (
    <>
      <CircleTimer progress={progress} accent={ringAccent} label="STOPWATCH" timeNode={timeNode}
        subLabel={isRunning || elapsed > 0 ? `lap ${laps.length + 1}  ·  ${fmtLap(currentLapElapsed)}` : "tap start to begin"} t={t} glow={isRunning} />

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 20, padding: "0 24px", width: "100%", boxSizing: "border-box" }}>
        <button onClick={reset} aria-label="Reset stopwatch" style={{ width: 52, height: 52, borderRadius: 16, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RotateCcw size={19} color={t.muted} aria-hidden="true" />
        </button>
        <motion.button onClick={toggleRun}
          aria-label={isRunning ? "Pause stopwatch" : elapsed === 0 ? "Start stopwatch" : "Resume stopwatch"}
          animate={{ background: isRunning ? t.effortColor : t.accent, boxShadow: `0 8px 24px ${t.accent}33` }}
          transition={{ duration: 0.35 }}
          style={{ flex: 1, height: 52, borderRadius: 16, border: "none", cursor: "pointer", color: t.accentFg, fontSize: 15, fontWeight: 700, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {isRunning ? <><Pause size={18} strokeWidth={2.5} aria-hidden="true" />Pause</> : <><Play size={18} strokeWidth={2.5} aria-hidden="true" />{elapsed === 0 ? "Start" : "Resume"}</>}
        </motion.button>
        <button
          onClick={isRunning ? recordLap : undefined}
          aria-label="Record lap"
          disabled={!isRunning}
          aria-disabled={!isRunning}
          style={{ width: 52, height: 52, borderRadius: 16, background: isRunning ? t.card : t.btn, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: isRunning ? "pointer" : "default", opacity: isRunning ? 1 : 0.3, transition: "opacity 0.3s, background 0.2s" }}>
          <Flag size={18} color={t.muted} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {laps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ width: "100%", padding: "18px 24px 16px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted }}>LAP</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted }}>SPLIT</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...laps].reverse().map((split, ri) => {
                const i = laps.length - 1 - ri;
                const isFastest = split === fastestSplit;
                const isSlowest = split === slowestSplit;
                // aurora = blue-ish bright, plasma = dim/muted for "slowest"
                const labelColor = isFastest ? t.effortColor : isSlowest ? t.restColor : t.text;
                const bg = isFastest ? `${t.effortColor}12` : isSlowest ? `${t.restColor}12` : t.card;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: bg, borderRadius: 12, padding: "10px 14px", border: `1px solid ${t.hairline}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: labelColor }}>Lap {i + 1}</span>
                      {isFastest && <span style={{ fontSize: 10, fontWeight: 700, color: t.effortColor, background: `${t.effortColor}18`, borderRadius: 6, padding: "2px 6px" }}>fastest</span>}
                      {isSlowest && <span style={{ fontSize: 10, fontWeight: 700, color: t.restColor, background: `${t.restColor}18`, borderRadius: 6, padding: "2px 6px" }}>slowest</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: labelColor, letterSpacing: "-0.01em" }}>{fmtLap(split)}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
