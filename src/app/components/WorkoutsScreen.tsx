import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, ChevronRight, Zap, BookOpen, Star } from "lucide-react";
import { Theme } from "../theme";
import { Preset } from "./HiitTab";

function fmt(s: number) { return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

interface Props {
  t: Theme;
  presets: Preset[];
  favorites: string[];
  onStartPreset: (preset: Preset) => void;
  onDeletePreset: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function WorkoutsScreen({ t, presets, favorites, onStartPreset, onDeletePreset, onToggleFavorite }: Props) {
  const [tab, setTab] = useState<"all" | "favorites">("all");

  const shown = tab === "favorites"
    ? presets.filter(p => favorites.includes(p.id))
    : presets;

  return (
    <div style={{ width: "100%", padding: "8px 24px 24px", boxSizing: "border-box" }}>
      {/* Tabs */}
      <div style={{ display: "flex", background: t.card, borderRadius: 13, padding: 4, gap: 4, marginBottom: 18, border: `1px solid ${t.hairline}` }}>
        {(["all", "favorites"] as const).map(id => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, height: 36, borderRadius: 9, border: "none", cursor: "pointer", background: tab === id ? t.btn : "transparent", color: tab === id ? t.text : t.muted, fontSize: 12, fontWeight: tab === id ? 700 : 500, fontFamily: "Inter, sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {id === "favorites" && <Star size={12} fill={tab === id ? t.accent : "none"} color={tab === id ? t.accent : t.muted} />}
            {id === "all" ? "All presets" : "Favourites"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {shown.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 0", gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 17, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {tab === "favorites" ? <Star size={22} color={t.muted} strokeWidth={1.5} /> : <BookOpen size={22} color={t.muted} strokeWidth={1.5} />}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>
                {tab === "favorites" ? "No favourites yet" : "No presets yet"}
              </div>
              <div style={{ fontSize: 12, color: t.muted }}>
                {tab === "favorites" ? "Star a preset to save it here." : "Save a HIIT configuration from the workout screen."}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map((p, i) => {
              const totalSecs = p.settings.getReady + p.settings.sets * (p.settings.rounds * p.settings.effort + (p.settings.rounds - 1) * p.settings.recover) + (p.settings.sets - 1) * p.settings.setBreak;
              const isFav = favorites.includes(p.id);
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }}
                  style={{ background: t.card, borderRadius: 18, padding: "15px", border: `1px solid ${t.hairline}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, background: `${t.accent}14`, border: `1px solid ${t.accent}24`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Zap size={16} color={t.accent} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 8px" }}>
                          {[`${p.settings.effort}s effort`, `${p.settings.recover}s recover`, `${p.settings.rounds} rounds`, p.settings.sets > 1 ? `${p.settings.sets} sets` : null].filter(Boolean).map(lbl => (
                            <span key={lbl} style={{ fontSize: 11, color: t.muted, fontWeight: 500 }}>{lbl}</span>
                          ))}
                        </div>
                        <div style={{ marginTop: 5, fontSize: 10, color: t.muted }}>Total {fmt(totalSecs)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => onToggleFavorite(p.id)}
                        aria-label={isFav ? `Remove "${p.name}" from favourites` : `Add "${p.name}" to favourites`}
                        aria-pressed={isFav}
                        style={{ width: 30, height: 30, borderRadius: 9, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Star size={14} fill={isFav ? t.accent : "none"} color={isFav ? t.accent : t.muted} aria-hidden="true" />
                      </button>
                      <button onClick={() => onDeletePreset(p.id)}
                        aria-label={`Delete preset "${p.name}"`}
                        style={{ width: 30, height: 30, borderRadius: 9, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={13} color={t.muted} aria-hidden="true" />
                      </button>
                      <button onClick={() => onStartPreset(p)}
                        aria-label={`Start preset "${p.name}"`}
                        style={{ width: 30, height: 30, borderRadius: 9, background: `${t.accent}20`, border: `1px solid ${t.accent}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChevronRight size={15} color={t.accent} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
