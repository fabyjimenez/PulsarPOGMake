import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Play, Pause, Minus, Plus, Clock } from "lucide-react";
import CircleTimer from "./CircleTimer";
import type { Theme, SessionRecord } from "../theme";

type Phase = "idle" | "getReady" | "running" | "done";

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface Props {
  dark: boolean;
  t: Theme;
  onSessionComplete?: (d: Omit<SessionRecord, "id" | "completedAt" | "type" | "label">) => void;
}

export default function TimerTab({ dark: _dark, t, onSessionComplete }: Props) {
  const [mins, setMins] = useState(5);
  const [secs, setSecs] = useState(0);
  const [getReadySecs, setGetReadySecs] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const totalDuration = mins * 60 + secs;

  useEffect(() => {
    if (!isRunning) return;
    const id = setTimeout(() => {
      if (timeLeft > 1) { setTimeLeft(t => t - 1); return; }
      if (phase === "getReady") { setPhase("running"); setTimeLeft(totalDuration); }
      else if (phase === "running") {
        setIsRunning(false); setPhase("done"); setTimeLeft(0);
        onSessionComplete?.({ durationSecs: totalDuration });
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [isRunning, timeLeft, phase, totalDuration]);

  function start() {
    if (totalDuration === 0) return;
    if (getReadySecs > 0) { setPhase("getReady"); setTimeLeft(getReadySecs); }
    else { setPhase("running"); setTimeLeft(totalDuration); }
    setIsRunning(true);
  }
  function reset() { setIsRunning(false); setPhase("idle"); setTimeLeft(0); }

  const isActive = phase !== "idle";
  const isDone = phase === "done";
  const ringAccent = isDone ? t.restColor : phase === "running" ? t.effortColor : t.readyColor;
  const progress = phase === "idle" ? 1 : phase === "done" ? 0 : phase === "getReady" ? timeLeft / getReadySecs : timeLeft / totalDuration;
  const displayTime = phase === "idle" ? totalDuration : phase === "done" ? 0 : timeLeft;
  const label = phase === "idle" ? "READY" : phase === "getReady" ? "GET READY" : phase === "done" ? "DONE" : "TIMER";

  const timeNode = (
    <motion.span animate={{ color: phase === "running" ? t.effortColor : isDone ? t.restColor : t.text }} transition={{ duration: 0.4 }}
      style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: t.text }}>
      {fmt(displayTime)}
    </motion.span>
  );

  return (
    <>
      <CircleTimer progress={progress} accent={ringAccent} label={label} timeNode={timeNode}
        subLabel={phase === "idle" ? "single countdown" : phase === "done" ? "complete" : ""} t={t} glow={phase === "running"} />

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 20, padding: "0 24px", width: "100%", boxSizing: "border-box" }}>
        <button onClick={reset} aria-label="Reset timer" style={{ width: 52, height: 52, borderRadius: 16, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RotateCcw size={19} color={t.muted} aria-hidden="true" />
        </button>
        <motion.button
          onClick={isDone ? reset : isActive ? () => setIsRunning(r => !r) : start}
          aria-label={isDone ? "Reset timer" : isActive ? (isRunning ? "Pause timer" : "Resume timer") : "Start timer"}
          animate={{ background: isDone ? t.btn : isActive && phase === "running" ? t.effortColor : t.accent, boxShadow: isDone ? "none" : `0 8px 24px ${t.accent}33` }}
          transition={{ duration: 0.35 }}
          style={{ flex: 1, height: 52, borderRadius: 16, border: "none", cursor: "pointer", color: isDone ? t.muted : t.accentFg, fontSize: 15, fontWeight: 700, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {isDone ? <><RotateCcw size={18} strokeWidth={2.5} aria-hidden="true" />Reset</>
            : isActive ? (isRunning ? <><Pause size={18} strokeWidth={2.5} aria-hidden="true" />Pause</> : <><Play size={18} strokeWidth={2.5} aria-hidden="true" />Resume</>)
            : <><Clock size={18} strokeWidth={2.5} aria-hidden="true" />Start</>}
        </motion.button>
        <div style={{ width: 52 }} />
      </div>

      <AnimatePresence mode="wait">
        {!isActive && (
          <motion.div key="config" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
            style={{ width: "100%", padding: "18px 24px 16px", boxSizing: "border-box" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 10 }}>DURATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "MINUTES", value: String(mins).padStart(2,"0"), unit: "m", onDec: () => setMins(m => Math.max(0, m - 1)), onInc: () => setMins(m => Math.min(99, m + 1)) },
                  { label: "SECONDS", value: String(secs).padStart(2,"0"), unit: "s", onDec: () => setSecs(s => s === 0 ? 45 : s - 15), onInc: () => setSecs(s => s === 45 ? 0 : s + 15) },
                ].map(p => (
                  <div key={p.label} style={{ background: t.card, borderRadius: 16, padding: "12px 14px", border: `1px solid ${t.hairline}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 8 }}>{p.label}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button onClick={p.onDec} aria-label={`Decrease ${p.label.toLowerCase()}`} style={{ minWidth: 36, minHeight: 36, borderRadius: 8, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={13} color={t.muted} aria-hidden="true" /></button>
                      <span aria-live="polite" aria-atomic="true" style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>{p.value}<span style={{ fontSize: 12, fontWeight: 500, color: t.muted, marginLeft: 2 }}>{p.unit}</span></span>
                      <button onClick={p.onInc} aria-label={`Increase ${p.label.toLowerCase()}`} style={{ minWidth: 36, minHeight: 36, borderRadius: 8, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={13} color={t.muted} aria-hidden="true" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: t.card, borderRadius: 16, padding: "12px 14px", border: `1px solid ${t.hairline}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 8 }}>GET READY</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={() => setGetReadySecs(s => Math.max(0, s - 5))} aria-label="Decrease get ready seconds" style={{ minWidth: 36, minHeight: 36, borderRadius: 8, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={13} color={t.muted} aria-hidden="true" /></button>
                <span aria-live="polite" aria-atomic="true" style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>
                  {getReadySecs === 0 ? <span style={{ color: t.muted, fontSize: 14, fontWeight: 600 }}>Off</span> : <>{getReadySecs}<span style={{ fontSize: 12, fontWeight: 500, color: t.muted, marginLeft: 2 }}>s</span></>}
                </span>
                <button onClick={() => setGetReadySecs(s => s + 5)} aria-label="Increase get ready seconds" style={{ minWidth: 36, minHeight: 36, borderRadius: 8, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={13} color={t.muted} aria-hidden="true" /></button>
              </div>
            </div>
            {totalDuration === 0 && (
              <p style={{ fontSize: 12, color: t.muted, opacity: 0.5, textAlign: "center", marginTop: 12 }}>Set a duration to start</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
