import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, SkipForward, Pause, Play, Activity, Minus, Plus, Heart, Flame, Zap, Maximize2, Clock, Wind } from "lucide-react";
import CircleTimer from "./CircleTimer";
import type { Theme, CompletionInfo, SoundMode } from "../theme";
import { useVoiceCues } from "../hooks/useVoiceCues";

const EFFORT = 20;
const RECOVER = 10;
const GET_READY = 5;
type Phase = "empty" | "getReady" | "effort" | "recover";

const PHASE_ICONS: Record<Phase, React.ReactNode> = {
  empty:    <Clock  size={9} aria-hidden="true" />,
  getReady: <Clock  size={9} aria-hidden="true" />,
  effort:   <Zap   size={9} aria-hidden="true" />,
  recover:  <Wind  size={9} aria-hidden="true" />,
};

function fmt(s: number) { return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

interface Props {
  dark: boolean; t: Theme; soundMode: SoundMode;
  bigDisplay: boolean; onToggleBigDisplay: () => void;
  onSessionComplete?: (info: Omit<CompletionInfo, "type" | "label">) => void;
}

export default function TabataTab({ dark: _dark, t, soundMode, bigDisplay, onToggleBigDisplay, onSessionComplete }: Props) {
  const ZONE_COLORS = ["#4A4A55", "#5A5A63", "#7A7A85", "#A0A0A8", t.effortColor];
  const [rounds, setRounds] = useState(8);
  const [phase, setPhase] = useState<Phase>("empty");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
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
    } else if (phase === "effort") {
      cue(currentRound === rounds ? "Last round" : "Work", 1046);
      setAnnouncement(`Work — round ${currentRound} of ${rounds}`);
    } else if (phase === "recover") {
      cue("Rest", 523);
      setAnnouncement("Rest");
    }
  }, [phase]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setTimeout(() => {
      if (timeLeft > 1) { setTimeLeft(t => t - 1); return; }
      if (phase === "getReady") { setPhase("effort"); setCurrentRound(1); setTimeLeft(EFFORT); }
      else if (phase === "effort") { setPhase("recover"); setTimeLeft(RECOVER); }
      else if (phase === "recover") {
        const nr = currentRound + 1;
        if (nr <= rounds) { setCurrentRound(nr); setPhase("effort"); setTimeLeft(EFFORT); }
        else {
          setIsRunning(false); setPhase("empty"); setTimeLeft(0); setCurrentRound(0);
          onSessionComplete?.({ totalSecs: rounds*(EFFORT+RECOVER), calories, rounds, effortSecs: rounds*EFFORT, restSecs: rounds*RECOVER });
          cue("Workout complete", 880);
          setAnnouncement("Workout complete");
          setCalories(0);
        }
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [isRunning, timeLeft, phase, currentRound, rounds]);

  useEffect(() => {
    if (!isRunning) { setHeartRate(72); return; }
    const target = phase === "getReady" ? 95 : phase === "effort" ? 165 : 120;
    const id = setInterval(() => { setHeartRate(h => Math.min(200, Math.max(60, Math.round(h + (target-h)*0.15 + (Math.random()-0.5)*8)))); }, 800);
    return () => clearInterval(id);
  }, [isRunning, phase]);

  useEffect(() => {
    if (!isRunning || phase === "getReady") return;
    const id = setInterval(() => setCalories(c => c + 1), 3000);
    return () => clearInterval(id);
  }, [isRunning, phase]);

  function start() { setPhase("getReady"); setTimeLeft(GET_READY); setCurrentRound(0); setCalories(0); setIsRunning(true); }
  function reset() { setIsRunning(false); setPhase("empty"); setTimeLeft(0); setCurrentRound(0); setCalories(0); setHeartRate(72); setAnnouncement(""); }
  function skip() {
    if (phase === "getReady") { setPhase("effort"); setCurrentRound(1); setTimeLeft(EFFORT); }
    else if (phase === "effort") { setPhase("recover"); setTimeLeft(RECOVER); }
    else if (phase === "recover") { const nr = currentRound+1; if (nr<=rounds){setCurrentRound(nr);setPhase("effort");setTimeLeft(EFFORT);}else reset(); }
  }

  const isWorkout = phase !== "empty";
  const accent    = phase==="effort" ? t.effortColor : phase==="getReady" ? t.readyColor : phase==="recover" ? t.restColor : t.readyColor;
  const maxTime   = phase==="getReady" ? GET_READY : phase==="effort" ? EFFORT : RECOVER;
  const progress  = phase==="empty" ? 1 : timeLeft/maxTime;
  const displayTime = phase==="empty" ? EFFORT : timeLeft;
  const phaseLabel  = phase==="empty"?"READY":phase==="getReady"?"GET READY":phase==="effort"?"EFFORT":"RECOVER";
  const subLabel    = phase==="empty" ? `${rounds} rounds · ${fmt(rounds*(EFFORT+RECOVER))}` : `Round ${phase==="getReady"?0:currentRound} / ${rounds}`;
  const nextPreview = phase==="effort" ? `Rest · ${RECOVER}s` : phase==="recover" ? (currentRound+1<=rounds ? `Round ${currentRound+1} · ${EFFORT}s` : "Done") : phase==="getReady" ? `Work · ${EFFORT}s` : "";
  const effortZone  = heartRate<100?1:heartRate<120?2:heartRate<140?3:heartRate<160?4:5;

  const timeNode = (
    <motion.span animate={{ color: phase==="effort" ? t.effortColor : t.text }} transition={{ duration: 0.45 }}
      style={{ fontSize: bigDisplay ? 88 : 52, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: t.text }}>
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
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, minHeight:580, padding:"24px", gap:0 }}>
        {liveRegion}
        <AnimatePresence mode="wait">
          <motion.span key={phaseLabel} initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.2}}
            style={{ fontSize:11, fontWeight:700, letterSpacing:"0.2em", color:accent, textTransform:"uppercase", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
            {PHASE_ICONS[phase]}
            {phaseLabel}
          </motion.span>
        </AnimatePresence>
        <motion.span animate={{ color: phase==="effort" ? t.effortColor : t.text }} transition={{ duration: 0.4 }}
          style={{ fontSize:92, fontWeight:900, letterSpacing:"-0.06em", lineHeight:1, color:t.text }}>
          {fmt(displayTime)}
        </motion.span>
        <div style={{ marginTop:20, fontSize:15, color:t.muted, fontWeight:500 }}>{subLabel}</div>
        {nextPreview && <div style={{ marginTop:8, fontSize:13, color:t.muted, opacity:0.55 }}>Next: {nextPreview}</div>}
        <div style={{ marginTop:40 }}>
          <motion.button
            onClick={() => setIsRunning(r => !r)}
            aria-label={isRunning ? "Pause workout" : "Resume workout"}
            animate={{ background: isRunning ? t.btn : t.accent }} transition={{ duration:0.2 }}
            style={{ width:64, height:64, borderRadius:20, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color: isRunning ? t.muted : t.accentFg }}>
            {isRunning ? <Pause size={26} strokeWidth={2} aria-hidden="true" /> : <Play size={26} strokeWidth={2} aria-hidden="true" />}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <>
      {liveRegion}
      <CircleTimer progress={progress} accent={accent} label={phaseLabel} labelIcon={PHASE_ICONS[phase]} timeNode={timeNode} subLabel={subLabel} t={t} glow={phase==="effort"} />

      {isWorkout && nextPreview && (
        <div style={{ textAlign:"center", marginTop:8, fontSize:12, color:t.muted, fontWeight:500 }}>
          Next: {nextPreview}
        </div>
      )}

      <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:16, padding:"0 24px", width:"100%", boxSizing:"border-box" }}>
        <button
          onClick={reset}
          aria-label="Reset workout"
          style={{ width:52, height:52, borderRadius:16, background:t.card, border:`1px solid ${t.hairline}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <RotateCcw size={19} color={t.muted} aria-hidden="true" />
        </button>
        <motion.button
          onClick={isWorkout ? () => setIsRunning(r=>!r) : start}
          aria-label={isWorkout ? (isRunning ? "Pause workout" : "Resume workout") : "Start workout"}
          animate={{ background: isWorkout?(phase==="effort"?t.effortColor:t.btn):t.accent, boxShadow:`0 8px 24px ${t.accent}33` }}
          transition={{ duration:0.35 }}
          style={{ flex:1, height:52, borderRadius:16, border:"none", cursor:"pointer", color:isWorkout&&phase!=="effort"?t.text:t.accentFg, fontSize:15, fontWeight:700, fontFamily:"Inter, sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {isWorkout
            ? (isRunning ? <><Pause size={18} strokeWidth={2.5} aria-hidden="true" />Pause</> : <><Play size={18} strokeWidth={2.5} aria-hidden="true" />Resume</>)
            : <><Activity size={18} strokeWidth={2.5} aria-hidden="true" />Start</>}
        </motion.button>
        <button
          onClick={isWorkout ? skip : undefined}
          aria-label="Skip to next phase"
          disabled={!isWorkout}
          aria-disabled={!isWorkout}
          style={{ width:52, height:52, borderRadius:16, background:t.card, border:`1px solid ${t.hairline}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:isWorkout?"pointer":"default", opacity:isWorkout?1:0.3, transition:"opacity 0.3s" }}>
          <SkipForward size={19} color={t.muted} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isWorkout ? (
          <motion.div key="config" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:0.25}}
            style={{ width:"100%", padding:"14px 24px 16px", boxSizing:"border-box" }}>
            <div style={{ background:t.card, borderRadius:14, padding:"12px 16px", marginBottom:12, border:`1px solid ${t.hairline}`, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:t.muted, marginBottom:4 }}>PROTOCOL</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:14, fontWeight:800, color:t.effortColor }}>{EFFORT}s</span>
                  <span style={{ fontSize:11, color:t.muted, fontWeight:600 }}>effort</span>
                  <span style={{ fontSize:12, color:t.muted, opacity:0.3 }}>/</span>
                  <span style={{ fontSize:14, fontWeight:800, color:t.restColor }}>{RECOVER}s</span>
                  <span style={{ fontSize:11, color:t.muted, fontWeight:600 }}>recover</span>
                </div>
              </div>
              <div style={{ fontSize:9, fontWeight:700, color:t.muted, background:t.btn, borderRadius:7, padding:"4px 9px", border:`1px solid ${t.hairline}` }}>Fixed protocol</div>
            </div>
            <div style={{ background:t.card, borderRadius:16, padding:"14px 16px", border:`1px solid ${t.hairline}` }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:t.muted, marginBottom:10 }}>ROUNDS</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <button
                  onClick={() => setRounds(r => Math.max(1,r-1))}
                  aria-label="Decrease rounds"
                  style={{ minWidth:44, minHeight:44, borderRadius:12, background:t.btn, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Minus size={16} color={t.muted} aria-hidden="true" />
                </button>
                <div style={{ textAlign:"center" }}>
                  <span aria-live="polite" aria-atomic="true" style={{ fontSize:36, fontWeight:800, color:t.text, letterSpacing:"-0.03em" }}>{rounds}</span>
                  <span style={{ fontSize:14, fontWeight:500, color:t.muted, marginLeft:4 }}>rounds</span>
                </div>
                <button
                  onClick={() => setRounds(r => r+1)}
                  aria-label="Increase rounds"
                  style={{ minWidth:44, minHeight:44, borderRadius:12, background:t.btn, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Plus size={16} color={t.muted} aria-hidden="true" />
                </button>
              </div>
              <div style={{ textAlign:"center", marginTop:8, fontSize:12, color:t.muted, fontWeight:500 }}>Total {fmt(rounds*(EFFORT+RECOVER))}</div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="hud" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:0.25}}
            style={{ width:"100%", padding:"14px 24px 16px", boxSizing:"border-box" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div style={{ background:t.card, borderRadius:16, padding:"13px 14px", border:`1px solid ${t.hairline}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:7 }}>
                  <Heart size={11} color={t.muted} aria-hidden="true" />
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:t.muted }}>HEART RATE</span>
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <motion.span animate={{ color: phase==="effort" ? t.effortColor : t.muted }} style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", color:t.text }}>{heartRate}</motion.span>
                  <span style={{ fontSize:11, color:t.muted, fontWeight:500 }}>bpm</span>
                </div>
              </div>
              <div style={{ background:t.card, borderRadius:16, padding:"13px 14px", border:`1px solid ${t.hairline}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:7 }}>
                  <Flame size={11} color={t.muted} aria-hidden="true" />
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:t.muted }}>CALORIES</span>
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", color:calories>0?t.effortColor:t.muted }}>{calories}</span>
                  <span style={{ fontSize:11, color:t.muted, fontWeight:500 }}>kcal</span>
                </div>
              </div>
            </div>
            <div style={{ background:t.card, borderRadius:16, padding:"13px 14px", marginTop:10, border:`1px solid ${t.hairline}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:10 }}>
                <Zap size={11} color={t.muted} aria-hidden="true" />
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:t.muted }}>EFFORT ZONE</span>
                <motion.span animate={{ color: ZONE_COLORS[effortZone-1] }} style={{ marginLeft:"auto", fontSize:10, fontWeight:700 }}>Zone {effortZone}</motion.span>
                <button
                  onClick={onToggleBigDisplay}
                  aria-label="Toggle big display mode"
                  style={{ width:36, height:36, borderRadius:10, background:t.btn, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginLeft:4 }}>
                  <Maximize2 size={13} color={t.muted} aria-hidden="true" />
                </button>
              </div>
              <div style={{ display:"flex", gap:5 }} role="img" aria-label={`Effort zone ${effortZone} of 5`}>
                {ZONE_COLORS.map((color,i) => (
                  <motion.div key={i} animate={{ opacity: i<effortZone?1:0.14 }} transition={{ duration:0.4 }}
                    style={{ flex:1, height:5, borderRadius:999, background:color }} />
                ))}
              </div>
            </div>
            <p style={{ fontSize:10, color:t.muted, opacity:0.5, textAlign:"center", marginTop:10, fontWeight:500 }}>
              Heart rate and calories are simulated
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
