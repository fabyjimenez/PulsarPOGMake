import { motion } from "motion/react";
import { Zap, Timer, Clock, TimerReset, Wind, ChevronRight, Flame, Calendar, Activity, Dumbbell, Repeat } from "lucide-react";
import { Theme, SessionRecord } from "../theme";
import { Preset, Settings } from "./HiitTab";

type WorkoutMode = "hiit" | "tabata" | "timer" | "stopwatch" | "sprint";

const WORKOUT_CARDS: { id: WorkoutMode; name: string; icon: React.ElementType; desc: string; protocol?: string }[] = [
  { id: "hiit",      name: "HIIT",       icon: Zap,        desc: "Effort & recovery intervals",  protocol: "Fully customisable" },
  { id: "tabata",    name: "Tabata",      icon: Timer,      desc: "Classic interval protocol",     protocol: "20s / 10s · 8 rounds" },
  { id: "timer",     name: "Timer",       icon: Clock,      desc: "Simple countdown",              protocol: undefined },
  { id: "stopwatch", name: "Stopwatch",   icon: TimerReset, desc: "Count up · capture laps",      protocol: undefined },
  { id: "sprint",    name: "Sprint",      icon: Wind,       desc: "Running intervals by distance", protocol: "Distance-based" },
];

const TEMPLATES: { name: string; icon: React.ElementType; desc: string; settings: Settings }[] = [
  { name: "Classic HIIT",  icon: Zap,      desc: "40s / 20s × 8",  settings: { effort:40,  recover:20,  rounds:8,  sets:1, getReady:10, setBreak:60, exerciseNames:[] } },
  { name: "Boxing",        icon: Dumbbell, desc: "3min / 1min × 6", settings: { effort:180, recover:60,  rounds:6,  sets:1, getReady:10, setBreak:60, exerciseNames:[] } },
  { name: "Tabata Style",  icon: Repeat,   desc: "20s / 10s × 8",  settings: { effort:20,  recover:10,  rounds:8,  sets:1, getReady:5,  setBreak:60, exerciseNames:[] } },
  { name: "Pomodoro",      icon: Clock,    desc: "25min / 5min × 4",settings: { effort:1500,recover:300, rounds:4,  sets:1, getReady:5,  setBreak:60, exerciseNames:[] } },
  { name: "Quick Burst",   icon: Flame,    desc: "10s / 5s × 10",  settings: { effort:10,  recover:5,   rounds:10, sets:3, getReady:10, setBreak:30, exerciseNames:[] } },
];

function streakDays(sessions: SessionRecord[]) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s => new Date(s.completedAt).toDateString()));
  let streak = 0;
  const today = new Date();
  while (days.has(new Date(today.getTime() - streak * 86400000).toDateString())) streak++;
  return streak;
}

function thisWeekKcal(sessions: SessionRecord[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return sessions.filter(s => s.completedAt > weekAgo).reduce((a, s) => a + (s.calories ?? 0), 0);
}

interface Props {
  t: Theme;
  dark: boolean;
  presets: Preset[];
  sessions: SessionRecord[];
  onSelectWorkout: (mode: WorkoutMode) => void;
  onSelectPreset: (preset: Preset) => void;
  onSelectTemplate: (settings: Settings) => void;
}

export default function HomeScreen({ t, dark: _dark, presets, sessions, onSelectWorkout, onSelectPreset, onSelectTemplate }: Props) {
  const streak = streakDays(sessions);
  const kcal   = thisWeekKcal(sessions);
  const count  = sessions.length;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 8, padding: "4px 24px 20px", borderBottom: `1px solid ${t.hairline}` }}>
        {[
          { label: "Streak",    value: streak, unit: "d",    icon: Flame    },
          { label: "This week", value: kcal,   unit: "kcal", icon: Activity },
          { label: "Sessions",  value: count,  unit: "",     icon: Calendar  },
        ].map(({ label, value, unit, icon: Icon }) => (
          <div key={label} style={{ flex: 1, background: t.card, borderRadius: 14, padding: "10px 12px", border: `1px solid ${t.hairline}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Icon size={10} color={t.muted} strokeWidth={2} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", color: t.muted, textTransform: "uppercase" }}>{label}</span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: value > 0 ? t.accent : t.muted, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {value}<span style={{ fontSize: 11, fontWeight: 500, marginLeft: 2, color: t.muted }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Start a workout */}
      <div style={{ padding: "20px 24px 12px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>Start a workout</span>
      </div>

      {/* Workout grid: 2×2 + wide sprint card */}
      <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {WORKOUT_CARDS.filter(c => c.id !== "sprint").map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button key={card.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.28 }}
                onClick={() => onSelectWorkout(card.id)}
                whileTap={{ scale: 0.96 }}
                style={{ background: t.card, borderRadius: 20, border: `1px solid ${t.hairline}`, padding: "18px 16px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 72, height: 72, borderRadius: "50%", background: `${t.accent}08`, filter: "blur(18px)", pointerEvents: "none" }} />
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${t.accent}14`, border: `1px solid ${t.accent}24`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={t.accent} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: t.text, letterSpacing: "-0.02em", marginBottom: 3 }}>{card.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: t.muted, lineHeight: 1.4 }}>{card.desc}</div>
                </div>
                {card.protocol && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: t.accent, opacity: 0.75 }}>{card.protocol}</div>
                )}
              </motion.button>
            );
          })}
        </div>
        {/* Sprint — full-width card */}
        {(() => {
          const sprint = WORKOUT_CARDS.find(c => c.id === "sprint")!;
          const Icon = sprint.icon;
          return (
            <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.28 }}
              onClick={() => onSelectWorkout("sprint")}
              whileTap={{ scale: 0.98 }}
              style={{ background: t.card, borderRadius: 20, border: `1px solid ${t.hairline}`, padding: "16px 20px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)", width: 100, height: 100, borderRadius: "50%", background: `${t.accent}06`, filter: "blur(22px)", pointerEvents: "none" }} />
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${t.accent}14`, border: `1px solid ${t.accent}24`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={22} color={t.accent} strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: t.text, letterSpacing: "-0.02em", marginBottom: 2 }}>{sprint.name}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: t.muted }}>{sprint.desc}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: t.accent, opacity: 0.75 }}>{sprint.protocol}</span>
                <ChevronRight size={16} color={t.muted} />
              </div>
            </motion.button>
          );
        })()}
      </div>

      {/* Quick-start templates */}
      <div style={{ marginTop: 24 }}>
        <div style={{ padding: "0 24px", marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>Quick start</span>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 24px", overflowX: "auto", paddingBottom: 4 }}>
          {TEMPLATES.map(tmpl => {
            const Icon = tmpl.icon;
            return (
              <motion.button key={tmpl.name} whileTap={{ scale: 0.95 }}
                onClick={() => onSelectTemplate(tmpl.settings)}
                style={{ flexShrink: 0, background: t.card, border: `1px solid ${t.hairline}`, borderRadius: 16, padding: "12px 14px", cursor: "pointer", textAlign: "left", minWidth: 128 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Icon size={14} color={t.accent} strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{tmpl.name}</span>
                </div>
                <div style={{ fontSize: 10, color: t.muted, fontWeight: 500 }}>{tmpl.desc}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Your workouts (saved presets) */}
      {presets.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ padding: "0 24px", marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>Your workouts</span>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "0 24px", overflowX: "auto", paddingBottom: 4 }}>
            {presets.map(p => (
              <motion.button key={p.id} onClick={() => onSelectPreset(p)} whileTap={{ scale: 0.95 }}
                style={{ flexShrink: 0, background: t.card, border: `1px solid ${t.hairline}`, borderRadius: 16, padding: "12px 14px", cursor: "pointer", textAlign: "left", minWidth: 140 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{p.settings.effort}s · {p.settings.rounds}r</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.accent }}>Start</span>
                  <ChevronRight size={11} color={t.accent} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
