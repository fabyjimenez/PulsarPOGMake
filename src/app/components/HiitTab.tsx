import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  RotateCcw, SkipForward, Pause, Play, Activity, Minus, Plus,
  Heart, Flame, Zap, Check, X, ChevronDown, ChevronUp,
  ListPlus, Maximize2, Clock, Wind,
} from "lucide-react";
import CircleTimer from "./CircleTimer";
import type { Theme, CompletionInfo, SoundMode } from "../theme";
import { useVoiceCues } from "../hooks/useVoiceCues";
import { useFocusTrap } from "../hooks/useFocusTrap";

export interface Settings {
  effort: number; recover: number; rounds: number;
  sets: number; getReady: number; setBreak: number;
  exerciseNames: string[];
}
export interface Preset { id: string; name: string; settings: Settings; }

type Phase = "empty" | "getReady" | "effort" | "recover";

const PHASE_ICONS: Record<Phase, React.ReactNode> = {
  empty:    <Clock   size={9} aria-hidden="true" />,
  getReady: <Clock   size={9} aria-hidden="true" />,
  effort:   <Zap     size={9} aria-hidden="true" />,
  recover:  <Wind    size={9} aria-hidden="true" />,
};

const SIMPLE_PARAMS = [
  { label: "EFFORT",  field: "effort"  as keyof Settings, unit: "s", step: 5 },
  { label: "RECOVER", field: "recover" as keyof Settings, unit: "s", step: 5 },
  { label: "ROUNDS",  field: "rounds"  as keyof Settings, unit: "×", step: 1 },
] as const;

const ADV_PARAMS = [
  { label: "SETS",      field: "sets"     as keyof Settings, unit: "×", step: 1  },
  { label: "GET READY", field: "getReady" as keyof Settings, unit: "s", step: 5  },
  { label: "SET BREAK", field: "setBreak" as keyof Settings, unit: "s", step: 10 },
] as const;

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function getNextPreview(phase: Phase, round: number, set: number, s: Settings): string {
  const names = s.exerciseNames ?? [];
  if (phase === "empty") return "";
  if (phase === "getReady") {
    const n = names[0] || "";
    return `Work · ${s.effort}s${n ? ` — ${n}` : ""}`;
  }
  if (phase === "effort") return `Rest · ${s.recover}s`;
  if (phase === "recover") {
    const nr = round + 1;
    if (nr <= s.rounds) {
      const n = names[nr - 1] || "";
      return `Round ${nr}${n ? ` — ${n}` : ""} · ${s.effort}s`;
    }
    const ns = set + 1;
    if (ns <= s.sets) return `Set ${ns} · break ${s.setBreak}s`;
    return "Done";
  }
  return "";
}

function StepperCard({
  label, value, unit, onDec, onInc, t,
}: {
  label: string; value: number; unit: string; onDec: () => void; onInc: () => void; t: Theme;
}) {
  return (
    <div style={{ background: t.card, borderRadius: 16, padding: "12px 14px", border: `1px solid ${t.hairline}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={onDec}
          aria-label={`Decrease ${label}`}
          style={{ minWidth: 36, minHeight: 36, borderRadius: 10, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Minus size={13} color={t.muted} aria-hidden="true" />
        </button>
        <span aria-live="polite" aria-atomic="true" style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>
          {value}<span style={{ fontSize: 12, fontWeight: 500, color: t.muted, marginLeft: 2 }}>{unit}</span>
        </span>
        <button
          onClick={onInc}
          aria-label={`Increase ${label}`}
          style={{ minWidth: 36, minHeight: 36, borderRadius: 10, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Plus size={13} color={t.muted} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  dark: boolean;
  t: Theme;
  presets: Preset[];
  onSavePreset: (name: string, settings: Settings) => void;
  initialSettings?: Settings;
  soundMode: SoundMode;
  bigDisplay: boolean;
  onToggleBigDisplay: () => void;
  onSessionComplete?: (info: Omit<CompletionInfo, "type" | "label">) => void;
}

const DEFAULT_SETTINGS: Settings = {
  effort: 40, recover: 20, rounds: 8, sets: 1, getReady: 10, setBreak: 60, exerciseNames: [],
};

export default function HiitTab({
  dark, t, presets, onSavePreset, initialSettings,
  soundMode, bigDisplay, onToggleBigDisplay, onSessionComplete,
}: Props) {
  const ZONE_COLORS = ["#4A4A55", "#5A5A63", "#7A7A85", "#A0A0A8", t.effortColor];
  const [phase, setPhase]         = useState<Phase>("empty");
  const [timeLeft, setTimeLeft]   = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSet, setCurrentSet]     = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [calories, setCalories]   = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [settings, setSettings]   = useState<Settings>(initialSettings ?? DEFAULT_SETTINGS);
  const [advanced, setAdvanced]   = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName]       = useState("");
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [announcement, setAnnouncement]   = useState("");
  const inputRef   = useRef<HTMLInputElement>(null);
  const saveDialogRef = useRef<HTMLDivElement>(null);
  const prevPhase  = useRef<Phase>("empty");
  const cue        = useVoiceCues(soundMode);
  const closeSaveModal = useCallback(() => setShowSaveModal(false), []);
  useFocusTrap(showSaveModal, saveDialogRef, closeSaveModal);

  useEffect(() => {
    if (showSaveModal) setTimeout(() => inputRef.current?.focus(), 80);
  }, [showSaveModal]);

  // Voice cues + screen-reader announcement on phase transition
  useEffect(() => {
    if (prevPhase.current === phase) return;
    prevPhase.current = phase;
    if (!isRunning) return;
    const names = settings.exerciseNames ?? [];
    if (phase === "getReady") {
      cue("Get ready", 660);
      setAnnouncement("Get ready");
    } else if (phase === "effort") {
      const ex = names[currentRound - 1] || "";
      const isLast = currentRound === settings.rounds && currentSet === settings.sets;
      cue(isLast ? `Last round${ex ? `. ${ex}` : ""}` : `Work${ex ? `. ${ex}` : ""}`, 1046);
      setAnnouncement(`Work — round ${currentRound} of ${settings.rounds}${ex ? `. ${ex}` : ""}`);
    } else if (phase === "recover") {
      cue("Rest", 523);
      setAnnouncement("Rest");
    }
  }, [phase]);

  // Countdown
  useEffect(() => {
    if (!isRunning) return;
    const id = setTimeout(() => {
      if (timeLeft > 1) { setTimeLeft(t => t - 1); return; }
      if (phase === "getReady") {
        setPhase("effort"); setCurrentRound(1); setCurrentSet(1); setTimeLeft(settings.effort);
      } else if (phase === "effort") {
        setPhase("recover"); setTimeLeft(settings.recover);
      } else if (phase === "recover") {
        const nr = currentRound + 1;
        if (nr <= settings.rounds) { setCurrentRound(nr); setPhase("effort"); setTimeLeft(settings.effort); }
        else {
          const ns = currentSet + 1;
          if (ns <= settings.sets) { setCurrentSet(ns); setCurrentRound(1); setPhase("recover"); setTimeLeft(settings.setBreak); }
          else {
            const totalSecs = settings.getReady + settings.sets * (settings.rounds * settings.effort + (settings.rounds - 1) * settings.recover) + (settings.sets - 1) * settings.setBreak;
            const effortSecs = settings.sets * settings.rounds * settings.effort;
            const restSecs   = settings.sets * (settings.rounds - 1) * settings.recover + (settings.sets - 1) * settings.setBreak;
            setIsRunning(false); setPhase("empty"); setTimeLeft(0); setCurrentRound(0); setCurrentSet(0);
            onSessionComplete?.({ totalSecs, calories, rounds: settings.rounds * settings.sets, sets: settings.sets, effortSecs, restSecs });
            cue("Workout complete", 880);
            setAnnouncement("Workout complete");
            setCalories(0);
          }
        }
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [isRunning, timeLeft, phase, currentRound, currentSet, settings]);

  // Heart rate simulation
  useEffect(() => {
    if (!isRunning) { setHeartRate(72); return; }
    const target = phase === "getReady" ? 95 : phase === "effort" ? 168 : 120;
    const id = setInterval(() => { setHeartRate(h => Math.min(200, Math.max(60, Math.round(h + (target - h) * 0.15 + (Math.random() - 0.5) * 8)))); }, 800);
    return () => clearInterval(id);
  }, [isRunning, phase]);

  useEffect(() => {
    if (!isRunning || phase === "getReady") return;
    const id = setInterval(() => setCalories(c => c + 1), 2500);
    return () => clearInterval(id);
  }, [isRunning, phase]);

  function start() { setPhase("getReady"); setTimeLeft(settings.getReady); setCurrentRound(0); setCurrentSet(0); setCalories(0); setIsRunning(true); }
  function reset() { setIsRunning(false); setPhase("empty"); setTimeLeft(0); setCurrentRound(0); setCurrentSet(0); setCalories(0); setHeartRate(72); setAnnouncement(""); }
  function skip() {
    if (phase === "getReady") { setPhase("effort"); setCurrentRound(1); setCurrentSet(1); setTimeLeft(settings.effort); }
    else if (phase === "effort") { setPhase("recover"); setTimeLeft(settings.recover); }
    else if (phase === "recover") {
      const nr = currentRound + 1;
      if (nr <= settings.rounds) { setCurrentRound(nr); setPhase("effort"); setTimeLeft(settings.effort); }
      else { const ns = currentSet + 1; if (ns <= settings.sets) { setCurrentSet(ns); setCurrentRound(1); setPhase("effort"); setTimeLeft(settings.effort); } else reset(); }
    }
  }
  function adjust(field: keyof Settings, delta: number) { setSettings(s => ({ ...s, [field]: Math.max(1, (s[field] as number) + delta) })); }
  function savePreset() {
    if (!presetName.trim()) return;
    onSavePreset(presetName.trim(), { ...settings });
    setPresetName(""); setShowSaveModal(false);
    setSavedFeedback(true); setTimeout(() => setSavedFeedback(false), 2000);
  }
  function setExerciseName(i: number, val: string) {
    setSettings(s => {
      const names = [...(s.exerciseNames ?? [])];
      while (names.length <= i) names.push("");
      names[i] = val;
      return { ...s, exerciseNames: names };
    });
  }

  const isWorkout = phase !== "empty";
  const accent      = phase === "effort" ? t.effortColor : phase === "getReady" ? t.readyColor : phase === "recover" ? t.restColor : t.readyColor;
  const maxTime     = phase === "getReady" ? settings.getReady : phase === "effort" ? settings.effort : phase === "recover" ? settings.recover : settings.effort;
  const progress    = phase === "empty" ? 1 : timeLeft / maxTime;
  const displayTime = phase === "empty" ? settings.effort : timeLeft;
  const phaseLabel  = phase === "empty" ? "READY" : phase === "getReady" ? "GET READY" : phase === "effort" ? "EFFORT" : "RECOVER";
  const subLabel    = phase === "empty"
    ? `${settings.rounds} rounds · ${settings.sets > 1 ? `${settings.sets} sets` : "1 set"}`
    : `Round ${phase === "getReady" ? 0 : currentRound}/${settings.rounds}  ·  Set ${phase === "getReady" ? 0 : currentSet}/${settings.sets}`;
  const totalSecs   = settings.getReady + settings.sets * (settings.rounds * settings.effort + (settings.rounds - 1) * settings.recover) + (settings.sets - 1) * settings.setBreak;
  const effortZone  = heartRate < 100 ? 1 : heartRate < 120 ? 2 : heartRate < 140 ? 3 : heartRate < 160 ? 4 : 5;
  const currentExerciseName = phase === "effort" && currentRound > 0 ? ((settings.exerciseNames ?? [])[currentRound - 1] || "") : "";
  const nextPreview = isWorkout ? getNextPreview(phase, currentRound, currentSet, settings) : "";

  const timeNode = (
    <motion.span animate={{ color: phase === "effort" ? t.effortColor : t.text }} transition={{ duration: 0.45 }}
      style={{ fontSize: bigDisplay ? 88 : 52, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: t.text }}>
      {fmt(displayTime)}
    </motion.span>
  );

  // ── Screen-reader live region ─────────────────────────────────────────────
  const liveRegion = (
    <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );

  // ── Big display layout ────────────────────────────────────────────────────
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

        <motion.span animate={{ color: phase === "effort" ? t.effortColor : t.text }} transition={{ duration: 0.4 }}
          style={{ fontSize: 92, fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color: t.text }}>
          {fmt(displayTime)}
        </motion.span>

        <AnimatePresence mode="wait">
          {currentExerciseName && (
            <motion.span key={currentExerciseName} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ fontSize: 28, fontWeight: 700, color: t.text, marginTop: 20, textAlign: "center", letterSpacing: "-0.01em" }}>
              {currentExerciseName}
            </motion.span>
          )}
        </AnimatePresence>

        <div style={{ marginTop: currentExerciseName ? 12 : 20, fontSize: 15, color: t.muted, fontWeight: 500 }}>{subLabel}</div>

        {nextPreview && (
          <div style={{ marginTop: 8, fontSize: 13, color: t.muted, opacity: 0.55, fontWeight: 500 }}>Next: {nextPreview}</div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
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

  // ── Normal layout ─────────────────────────────────────────────────────────
  return (
    <>
      {liveRegion}
      <CircleTimer progress={progress} accent={accent} label={phaseLabel} labelIcon={PHASE_ICONS[phase]} timeNode={timeNode} subLabel={subLabel} t={t} glow={phase === "effort"} />

      {/* Exercise name + next preview during workout */}
      <AnimatePresence>
        {isWorkout && (currentExerciseName || nextPreview) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ width: "100%", textAlign: "center", padding: "0 24px", overflow: "hidden", marginTop: 8 }}>
            <AnimatePresence mode="wait">
              {currentExerciseName && (
                <motion.div key={currentExerciseName} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  style={{ fontSize: 20, fontWeight: 700, color: t.text, letterSpacing: "-0.01em", marginBottom: 4 }}>
                  {currentExerciseName}
                </motion.div>
              )}
            </AnimatePresence>
            {nextPreview && (
              <div style={{ fontSize: 12, color: t.muted, fontWeight: 500 }}>Next: {nextPreview}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action row */}
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
          animate={{ background: isWorkout ? (phase === "effort" ? t.effortColor : t.btn) : t.accent, boxShadow: `0 8px 24px ${t.accent}33` }}
          transition={{ duration: 0.35 }}
          style={{ flex: 1, height: 52, borderRadius: 16, border: "none", cursor: "pointer", color: isWorkout && phase !== "effort" ? t.text : t.accentFg, fontSize: 15, fontWeight: 700, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {isWorkout
            ? (isRunning ? <><Pause size={18} strokeWidth={2.5} aria-hidden="true" />Pause</> : <><Play size={18} strokeWidth={2.5} aria-hidden="true" />Resume</>)
            : <><Activity size={18} strokeWidth={2.5} aria-hidden="true" />Start</>}
        </motion.button>
        <button
          onClick={isWorkout ? skip : undefined}
          aria-label="Skip to next phase"
          disabled={!isWorkout}
          aria-disabled={!isWorkout}
          style={{ width: 52, height: 52, borderRadius: 16, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: isWorkout ? "pointer" : "default", opacity: isWorkout ? 1 : 0.3, transition: "opacity 0.3s" }}>
          <SkipForward size={19} color={t.muted} aria-hidden="true" />
        </button>
      </div>

      {/* State content */}
      <AnimatePresence mode="wait">
        {!isWorkout ? (

          /* ── Setup / config ── */
          <motion.div key="config" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
            style={{ width: "100%", padding: "14px 24px 16px", boxSizing: "border-box" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.muted }}>Simple</span>
              <button
                onClick={() => setAdvanced(a => !a)}
                aria-label={advanced ? "Show simple settings" : "Show advanced settings"}
                aria-expanded={advanced}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", color: t.accent, fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                {advanced ? <><ChevronUp size={13} aria-hidden="true" />Less</> : <><ChevronDown size={13} aria-hidden="true" />Advanced</>}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {SIMPLE_PARAMS.slice(0, 2).map(p => (
                <StepperCard key={p.field} label={p.label} value={settings[p.field] as number} unit={p.unit} t={t}
                  onDec={() => adjust(p.field, -p.step)} onInc={() => adjust(p.field, p.step)} />
              ))}
            </div>

            <div style={{ marginTop: 10 }}>
              <StepperCard label="ROUNDS" value={settings.rounds} unit="×" t={t}
                onDec={() => adjust("rounds", -1)} onInc={() => adjust("rounds", 1)} />
            </div>

            <AnimatePresence>
              {advanced && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                  style={{ overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                    {ADV_PARAMS.map(p => (
                      <StepperCard key={p.field} label={p.label} value={settings[p.field] as number} unit={p.unit} t={t}
                        onDec={() => adjust(p.field, -p.step)} onInc={() => adjust(p.field, p.step)} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => setShowExercises(e => !e)}
                aria-label={showExercises ? "Hide exercise names" : "Add exercise names"}
                aria-expanded={showExercises}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: t.muted, fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", padding: 0 }}>
                <ListPlus size={14} aria-hidden="true" />
                {showExercises ? "Hide exercise names" : "Add exercise names"}
              </button>
              <AnimatePresence>
                {showExercises && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden", marginTop: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {Array.from({ length: settings.rounds }, (_, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <label htmlFor={`exercise-${i}`} style={{ fontSize: 10, fontWeight: 700, color: t.muted, width: 28, flexShrink: 0, textAlign: "right" }}>
                            R{i + 1}
                          </label>
                          <input
                            id={`exercise-${i}`}
                            value={(settings.exerciseNames ?? [])[i] ?? ""}
                            onChange={e => setExerciseName(i, e.target.value)}
                            placeholder={i === 0 ? "e.g. Squats" : "Exercise name"}
                            style={{ flex: 1, height: 34, borderRadius: 9, border: `1px solid ${t.hairline}`, background: t.btn, color: t.text, fontSize: 13, fontFamily: "Inter, sans-serif", padding: "0 11px", outline: "none" }}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
              <span style={{ fontSize: 12, color: t.muted, fontWeight: 500 }}>Total {fmt(totalSecs)}</span>
              <button
                onClick={() => { setPresetName(""); setShowSaveModal(true); }}
                style={{ background: "transparent", border: `1px solid ${t.accent}44`, borderRadius: 10, padding: "6px 14px", color: t.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                {savedFeedback ? <><Check size={13} aria-hidden="true" />Saved!</> : <>+ Save preset</>}
              </button>
            </div>
          </motion.div>

        ) : (

          /* ── Workout HUD ── */
          <motion.div key="hud" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
            style={{ width: "100%", padding: "14px 24px 16px", boxSizing: "border-box" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: t.card, borderRadius: 16, padding: "13px 14px", border: `1px solid ${t.hairline}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <Heart size={11} color={t.muted} aria-hidden="true" />
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.muted }}>HEART RATE</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <motion.span animate={{ color: phase === "effort" ? t.effortColor : t.muted }} style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: t.text }}>
                    {heartRate}
                  </motion.span>
                  <span style={{ fontSize: 11, color: t.muted, fontWeight: 500 }}>bpm</span>
                </div>
              </div>
              <div style={{ background: t.card, borderRadius: 16, padding: "13px 14px", border: `1px solid ${t.hairline}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <Flame size={11} color={t.muted} aria-hidden="true" />
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.muted }}>CALORIES</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: calories > 0 ? t.effortColor : t.muted }}>{calories}</span>
                  <span style={{ fontSize: 11, color: t.muted, fontWeight: 500 }}>kcal</span>
                </div>
              </div>
            </div>

            <div style={{ background: t.card, borderRadius: 16, padding: "13px 14px", marginTop: 10, border: `1px solid ${t.hairline}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Zap size={11} color={t.muted} aria-hidden="true" />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.muted }}>EFFORT ZONE</span>
                <motion.span animate={{ color: ZONE_COLORS[effortZone - 1] }} style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700 }}>
                  Zone {effortZone}
                </motion.span>
                <button
                  onClick={onToggleBigDisplay}
                  aria-label="Toggle big display mode"
                  style={{ width: 36, height: 36, borderRadius: 10, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4 }}>
                  <Maximize2 size={13} color={t.muted} aria-hidden="true" />
                </button>
              </div>
              <div style={{ display: "flex", gap: 5 }} role="img" aria-label={`Effort zone ${effortZone} of 5`}>
                {ZONE_COLORS.map((color, i) => (
                  <motion.div key={i} animate={{ opacity: i < effortZone ? 1 : 0.14 }} transition={{ duration: 0.4 }}
                    style={{ flex: 1, height: 5, borderRadius: 999, background: color }} />
                ))}
              </div>
            </div>
            <p style={{ fontSize: 10, color: t.muted, opacity: 0.5, textAlign: "center", marginTop: 10, fontWeight: 500 }}>
              Heart rate and calories are simulated
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save preset modal */}
      <AnimatePresence>
        {showSaveModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaveModal(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, borderRadius: "var(--frame-radius)", backdropFilter: "blur(4px)" }} />
            <motion.div
              ref={saveDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="preset-dialog-title"
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              style={{ position: "absolute", left: 24, right: 24, top: "50%", marginTop: -100, background: dark ? "#1C1C1F" : "#fff", borderRadius: 24, padding: "24px", zIndex: 60, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", border: `1px solid ${t.hairline}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <span id="preset-dialog-title" style={{ fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>Name this preset</span>
                  <p style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>{settings.effort}s work · {settings.recover}s rest · {settings.rounds} rounds · {settings.sets} set{settings.sets > 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => setShowSaveModal(false)}
                  aria-label="Close save preset dialog"
                  style={{ minWidth: 36, minHeight: 36, borderRadius: 10, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} color={t.muted} aria-hidden="true" />
                </button>
              </div>
              <label htmlFor="preset-name" className="sr-only">Preset name</label>
              <input
                id="preset-name"
                ref={inputRef}
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && savePreset()}
                placeholder="e.g. Morning Blast"
                style={{ width: "100%", marginTop: 10, height: 46, borderRadius: 13, border: `1.5px solid ${presetName ? t.accent + "88" : t.hairline}`, background: t.btn, color: t.text, fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif", padding: "0 14px", boxSizing: "border-box", outline: "none" }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => setShowSaveModal(false)} style={{ flex: 1, height: 44, borderRadius: 13, border: `1px solid ${t.hairline}`, background: "transparent", color: t.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
                <button onClick={savePreset} style={{ flex: 2, height: 44, borderRadius: 13, border: "none", background: presetName.trim() ? t.accent : t.btn, color: presetName.trim() ? t.accentFg : t.muted, fontSize: 14, fontWeight: 700, cursor: presetName.trim() ? "pointer" : "default", fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>Save preset</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
