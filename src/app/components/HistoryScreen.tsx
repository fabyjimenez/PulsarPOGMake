import { motion, AnimatePresence } from "motion/react";
import { Zap, Timer, Clock, TimerReset, BarChart2, Wind } from "lucide-react";
import { Theme, SessionRecord } from "../theme";

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - ts) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TYPE_META: Record<SessionRecord["type"], { label: string; icon: React.ElementType; color: string }> = {
  hiit:      { label: "HIIT",      icon: Zap,        color: "#C6F24E" },
  tabata:    { label: "Tabata",    icon: Timer,      color: "#A0A0A8" },
  timer:     { label: "Timer",     icon: Clock,      color: "#A0A0A8" },
  stopwatch: { label: "Stopwatch", icon: TimerReset, color: "#5A5A63" },
  sprint:    { label: "Sprint",    icon: Wind,       color: "#6BBBFF" },
};

interface Props {
  t: Theme;
  history: SessionRecord[];
}

export default function HistoryScreen({ t, history }: Props) {
  const typeColor = (type: SessionRecord["type"]) => type === "hiit" ? t.effortColor : TYPE_META[type].color;
  const sorted = [...history].sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div style={{ width: "100%", padding: "8px 24px 24px", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 20, paddingTop: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>
          Completed sessions
        </span>
      </div>

      <AnimatePresence>
        {sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={24} color={t.muted} strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>No sessions yet</div>
              <div style={{ fontSize: 13, color: t.muted }}>Complete a workout to see your history here.</div>
            </div>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((s, i) => {
              const meta = TYPE_META[s.type];
              const Icon = meta.icon;
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ background: t.card, borderRadius: 18, padding: "14px 16px", border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: `${typeColor(s.type)}15`, border: `1px solid ${typeColor(s.type)}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={typeColor(s.type)} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                      {fmtDuration(s.durationSecs)}
                      {s.calories ? ` · ${s.calories} kcal` : ""}
                      {s.rounds ? ` · ${s.rounds} rounds` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: t.muted }}>{fmtDate(s.completedAt)}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: typeColor(s.type), marginTop: 3, letterSpacing: "0.06em" }}>{meta.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
