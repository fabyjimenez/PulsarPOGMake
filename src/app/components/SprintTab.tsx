import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, SkipForward, Pause, Play, Wind, Minus, Plus, Heart, Flame, Maximize2, Zap, Clock } from "lucide-react";
import CircleTimer from "./CircleTimer";
import type { Theme, CompletionInfo, SoundMode } from "../theme";
import { useVoiceCues } from "../hooks/useVoiceCues";

type Phase = "empty" | "getReady" | "sprint" | "walk";

const PHASE_ICONS: Record<Phase, React.ReactNode> = {
  empty:    <Clock size={9} aria-hidden="true" />,
  getReady: <Clock size={9} aria-hidden="true" />,
  sprint:   <Zap  size={9} aria-hidden="true" />,
  walk:     <Wind size={9} aria-hidden="true" />,
};

const DISTANCES = [50, 100, 200, 400, 800];

const DEFAULT_SPRINT_SECS: Record<number, number> = {
  50: 10, 100: 18, 200: 40, 400: 90, 800: 210,
};
const DEFAULT_WALK_SECS: Record<number, number> = {
  50: 20, 100: 45, 200: 90, 400: 180, 800: 300,
};

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface Props {
  dark: boolean;
  t: Theme;
  soundMode: SoundMode;
  bigDisplay: boolean;
  onToggleBigDisplay: () => void;
  onSessionComplete?: (info: Omit<CompletionInfo, "type" | "label">) => void;
}

export default function SprintTab({ dark: _dark, t, soundMode, bigDisplay, onToggleBigDisplay, onSessionComplete }: Props) {
  const [distanceM, setDistanceM] = useState(200);
  const [sprintSecs, setSprintSecs] = useState(DEFAULT_SPRINT_SECS[200]);
  const [walkSecs, setWalkSecs] = useState(DEFAULT_WALK_SECS[200]);
  const [reps, setReps] = useState(6);
  const [getReadySecs, setGetReadySecs] = useState(10);
  const [phase, setPhase] = useState<Phase>("empty");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [calories, setCalories] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [announcement, setAnnouncement] = useState("");
  const prevPhase = useRef<Phase>("empty");
  const cue = useVoiceCues(soundMode);

  useEffect(() => {
    if (prevPhase.current === phase) return;
    prevPhase.current = phase;
    if (!isRunning) return;
    if (phase === "getReady") {
      cue("Get ready", 660);
      setAnnouncement("Get ready");
    } else if (phase === "sprint") {
      const isLast = currentRep === reps;
      cue(isLast ? "Last sprint" : "Sprint", 1046);
      setAnnouncement(`Sprint — rep ${currentRep} of ${reps}`);
    } else if (phase === "walk") {
      cue("Walk", 523);
      setAnnouncement("Walk");
    }
  }, [phase]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setTimeout(() => {
      if (timeLeft > 1) { setTimeLeft(t => t - 1); return; }
      if (phase === "getReady") {
        setPhase("sprint"); setCurrentRep(1); setTimeLeft(sprintSecs);
      } else if (phase === "sprint") {
        setPhase("walk"); setTimeLeft(walkSecs);
      } else if (phase === "walk") {
        const nr = currentRep + 1;
        if (nr <= reps) {
          setCurrentRep(nr); setPhase("sprint"); setTimeLeft(sprintSecs);
        } else {
          setIsRunning(false); setPhase("empty"); setTimeLeft(0); setCurrentRep(0);
          const totalSecs = getReadySecs + reps * sprintSecs + (reps - 1) * walkSecs;
          onSessionComplete?.({ totalSecs, calories, rounds: reps, effortSecs: reps * sprintSecs, restSecs: (reps - 1) * walkSecs });
          cue("Workout complete", 880);
          setAnnouncement("Workout complete");
          setCalories(0);
        }
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [isRunning, timeLeft, phase, currentRep, reps, sprintSecs, walkSecs, getReadySecs]);

  useEffect(() => {
    if (!isRunning) { setHeartRate(72); return; }
    const target = phase === "getReady" ? 100 : phase === "sprint" ? 178 : 125;
    const id = setInterval(() => {
      setHeartRate(h => Math.min(200, Math.max(60, Math.round(h + (target - h) * 0.18 + (Math.random() - 0.5) * 10))));
    }, 700);
    return () => clearInterval(id);
  }, [isRunning, phase]);

  useEffect(() => {
    if (!isRunning || phase === "getReady") return;
    const rate = phase === "sprint" ? 1500 : 3000;
    const id = setInterval(() => setCalories(c => c + 1), rate);
    return () => clearInterval(id);
  }, [isRunning, phase]);

  function selectDistance(d: number) {
    setDistanceM(d);
    setSprintSecs(DEFAULT_SPRINT_SECS[d]);
    setWalkSecs(DEFAULT_WALK_SECS[d]);
  }

  function start() {
    setPhase("getReady"); setCurrentRep(0); setCalories(0);
    setTimeLeft(getReadySecs > 0 ? getReadySecs : sprintSecs);
    if (getReadySecs === 0) { setPhase("sprint"); setCurrentRep(1); }
    setIsRunning(true);
  }

  function reset() {
    setIsRunning(false); setPhase("empty"); setTimeLeft(0); setCurrentRep(0); setCalories(0); setHeartRate(72); setAnnouncement("");
  }

  function skip() {
    if (phase === "getReady") { setPhase("sprint"); setCurrentRep(1); setTimeLeft(sprintSecs); }
    else if (phase === "sprint") { setPhase("walk"); setTimeLeft(walkSecs); }
    else if (phase === "walk") {
      const nr = currentRep + 1;
      if (nr <= reps) { setCurrentRep(nr); setPhase("sprint"); setTimeLeft(sprintSecs); }
      else reset();
    }
  }

  const isWorkout = phase !== "empty";
  const accent = phase === "sprint" ? t.effortColor : phase === "getReady" ? t.readyColor : t.restColor;
  const maxTime = phase === "getReady" ? getReadySecs : phase === "sprint" ? sprintSecs : walkSecs;
  const progress = phase === "empty" ? 1 : timeLeft / maxTime;
  const displayTime = phase === "empty" ? sprintSecs : timeLeft;
  const phaseLabel = phase === "empty" ? "READY" : phase === "getReady" ? "GET READY" : phase === "sprint" ? "SPRINT" : "WALK";
  const subLabel = phase === "empty"
    ? `${reps} × ${distanceM}m · ${fmt(reps * sprintSecs + (reps - 1) * walkSecs)}`
    : `Rep ${phase === "getReady" ? 0 : currentRep} / ${reps} · ${distanceM}m`;
  const nextPreview = phase === "sprint"
    ? `Walk · ${fmt(walkSecs)}`
    : phase === "walk"
      ? (currentRep + 1 <= reps ? `Rep ${currentRep + 1} · ${distanceM}m sprint` : "Done")
      : phase === "getReady" ? `Sprint · ${distanceM}m` : "";

  const timeNode = (
    <motion.span
      animate={{ color: phase === "sprint" ? t.effortColor : t.text }}
      transition={{ duration: 0.4 }}
      style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: t.text }}
    >
      {fmt(displayTime)}
    </motion.span>
  );

  const liveRegion = (
    <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );

  if (bigDisplay && isWorkout) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 580, padding: "24px", gap: 0 }}>
        {liveRegion}
        <AnimatePresence mode="wait">
          <motion.span key={phaseLabel} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: accent, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
            {PHASE_ICONS[phase]}
            {phaseLabel}
          </motion.span>
        </AnimatePresence>
        <motion.span animate={{ color: phase === "sprint" ? t.effortColor : t.text }} transition={{ duration: 0.4 }}
          style={{ fontSize: 92, fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color: t.text }}>
          {fmt(displayTime)}
        </motion.span>
        <div style={{ marginTop: 16, fontSize: 22, fontWeight: 700, color: accent }}>{distanceM}m</div>
        <div style={{ marginTop: 8, fontSize: 15, color: t.muted, fontWeight: 500 }}>{subLabel}</div>
        {nextPreview && <div style={{ marginTop: 8, fontSize: 13, color: t.muted, opacity: 0.55 }}>Next: {nextPreview}</div>}
        <div style={{ marginTop: 40 }}>
          <motion.button
            onClick={() => setIsRunning(r => !r)}
            aria-label={isRunning ? "Pause workout" : "Resume workout"}
            animate={{ background: isRunning ? t.btn : t.accent }} transition={{ duration: 0.2 }}
            style={{ width: 64, height: 64, borderRadius: 20, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isRunning ? t.muted : t.accentFg }}>
            {isRunning ? <Pause size={26} strokeWidth={2} aria-hidden="true" /> : <Play size={26} strokeWidth={2} aria-hidden="true" />}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <>
      {liveRegion}
      <CircleTimer progress={progress} accent={accent} label={phaseLabel} labelIcon={PHASE_ICONS[phase]} timeNode={timeNode} subLabel={subLabel} t={t} glow={phase === "sprint"} />

      {isWorkout && nextPreview && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: t.muted, fontWeight: 500 }}>
          Next: {nextPreview}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, padding: "0 24px", width: "100%", boxSizing: "border-box" }}>
        <button
          onClick={reset}
          aria-label="Reset workout"
          style={{ width: 52, height: 52, borderRadius: 16, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RotateCcw size={19} color={t.muted} aria-hidden="true" />
        </button>
        <motion.button
          onClick={isWorkout ? () => setIsRunning(r => !r) : start}
          aria-label={isWorkout ? (isRunning ? "Pause workout" : "Resume workout") : "Start workout"}
          animate={{ background: isWorkout ? (isRunning ? t.effortColor : t.btn) : t.accent, boxShadow: isWorkout && isRunning ? `0 8px 24px ${t.effortColor}44` : "none" }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, height: 52, borderRadius: 16, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: isWorkout && !isRunning ? t.muted : t.accentFg }}>
          {isWorkout
            ? (isRunning ? <><Pause size={18} strokeWidth={2.5} aria-hidden="true" />Pause</> : <><Play size={18} strokeWidth={2.5} aria-hidden="true" />Resume</>)
            : <><Wind size={18} strokeWidth={2.5} aria-hidden="true" />Start</>}
        </motion.button>
        {isWorkout ? (
          <button
            onClick={skip}
            aria-label="Skip to next phase"
            style={{ width: 52, height: 52, borderRadius: 16, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <SkipForward size={19} color={t.muted} aria-hidden="true" />
          </button>
        ) : (
          <button
            onClick={onToggleBigDisplay}
            aria-label="Toggle big display mode"
            style={{ width: 52, height: 52, borderRadius: 16, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.4 }}>
            <Maximize2 size={17} color={t.muted} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Biometrics strip */}
      {isWorkout && (
        <div style={{ display: "flex", gap: 8, padding: "14px 24px 0", width: "100%", boxSizing: "border-box" }}>
          {[
            { icon: Heart, value: `${heartRate}`, unit: "bpm", color: "#FF6B6B", label: "Heart rate" },
            { icon: Flame, value: `${calories}`, unit: "kcal", color: t.accent, label: "Calories" },
          ].map(({ icon: Icon, value, unit, color, label }) => (
            <div key={unit} style={{ flex: 1, background: t.card, borderRadius: 14, padding: "10px 14px", border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon size={15} color={color} strokeWidth={2} aria-hidden="true" />
              <span style={{ fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>
                <span className="sr-only">{label}: </span>
                {value}
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: t.muted }}>{unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Config */}
      <AnimatePresence mode="wait">
        {!isWorkout && (
          <motion.div key="config" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
            style={{ width: "100%", padding: "18px 24px 16px", boxSizing: "border-box" }}>

            {/* Distance selector */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 8 }}>DISTANCE</div>
              <div style={{ display: "flex", gap: 6 }} role="group" aria-label="Sprint distance">
                {DISTANCES.map(d => (
                  <button key={d} onClick={() => selectDistance(d)}
                    aria-pressed={distanceM === d}
                    style={{ flex: 1, height: 44, borderRadius: 10, border: `1.5px solid ${distanceM === d ? t.accent : t.hairline}`, cursor: "pointer", background: distanceM === d ? `${t.accent}15` : t.card, color: distanceM === d ? t.accent : t.muted, fontSize: 11, fontWeight: distanceM === d ? 700 : 500, fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}>
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Sprint / Walk / Reps */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { label: "SPRINT", value: sprintSecs, unit: "s", onDec: () => setSprintSecs(s => Math.max(5, s - 5)), onInc: () => setSprintSecs(s => s + 5) },
                { label: "WALK REST", value: walkSecs, unit: "s", onDec: () => setWalkSecs(s => Math.max(5, s - 5)), onInc: () => setWalkSecs(s => s + 5) },
              ].map(p => (
                <div key={p.label} style={{ background: t.card, borderRadius: 16, padding: "12px 14px", border: `1px solid ${t.hairline}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 8 }}>{p.label}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button onClick={p.onDec} aria-label={`Decrease ${p.label}`} style={{ minWidth: 36, minHeight: 36, borderRadius: 10, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Minus size={13} color={t.muted} aria-hidden="true" />
                    </button>
                    <span aria-live="polite" aria-atomic="true" style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>
                      {p.value}<span style={{ fontSize: 12, fontWeight: 500, color: t.muted, marginLeft: 2 }}>{p.unit}</span>
                    </span>
                    <button onClick={p.onInc} aria-label={`Increase ${p.label}`} style={{ minWidth: 36, minHeight: 36, borderRadius: 10, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Plus size={13} color={t.muted} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "REPS", value: reps, unit: "×", onDec: () => setReps(r => Math.max(1, r - 1)), onInc: () => setReps(r => r + 1) },
                { label: "GET READY", value: getReadySecs, unit: "s", onDec: () => setGetReadySecs(s => Math.max(0, s - 5)), onInc: () => setGetReadySecs(s => s + 5) },
              ].map(p => (
                <div key={p.label} style={{ background: t.card, borderRadius: 16, padding: "12px 14px", border: `1px solid ${t.hairline}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 8 }}>{p.label}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button onClick={p.onDec} aria-label={`Decrease ${p.label}`} style={{ minWidth: 36, minHeight: 36, borderRadius: 10, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Minus size={13} color={t.muted} aria-hidden="true" />
                    </button>
                    <span aria-live="polite" aria-atomic="true" style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>
                      {p.value === 0 && p.label === "GET READY"
                        ? <span style={{ color: t.muted, fontSize: 14, fontWeight: 600 }}>Off</span>
                        : <>{p.value}<span style={{ fontSize: 12, fontWeight: 500, color: t.muted, marginLeft: 2 }}>{p.unit}</span></>}
                    </span>
                    <button onClick={p.onInc} aria-label={`Increase ${p.label}`} style={{ minWidth: 36, minHeight: 36, borderRadius: 10, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Plus size={13} color={t.muted} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
