import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, ChevronRight, ChevronLeft, Trash2, Zap, Timer, Wind, Moon, Calendar, Edit2, X, Check } from "lucide-react";
import type { Theme, Plan, WorkoutDay, WorkoutConfig } from "../theme";

type View = "list" | "detail" | "create";
type DayType = "hiit" | "tabata" | "sprint" | "rest";

const DAY_TYPE_META: Record<DayType, { label: string; icon: React.ElementType; color: string }> = {
  hiit:    { label: "HIIT",    icon: Zap,    color: "#C6F24E" },
  tabata:  { label: "Tabata",  icon: Timer,  color: "#A0A0A8" },
  sprint:  { label: "Sprint",  icon: Wind,   color: "#6BBBFF" },
  rest:    { label: "Rest",    icon: Moon,   color: "#5A5A63" },
};

function defaultConfig(type: DayType): WorkoutConfig | undefined {
  if (type === "hiit")   return { effort: 40, recover: 20, rounds: 8, sets: 1, getReady: 10, setBreak: 60, exerciseNames: [] };
  if (type === "tabata") return { effort: 20, recover: 10, rounds: 8, sets: 1, getReady: 5,  setBreak: 60, exerciseNames: [] };
  if (type === "sprint") return { effort: 40, recover: 90, rounds: 6, sets: 1, getReady: 10, setBreak: 60, exerciseNames: [] };
  return undefined;
}

function totalMins(day: WorkoutDay): number {
  const c = day.config;
  if (!c) return 0;
  const secs = c.getReady + c.sets * (c.rounds * c.effort + Math.max(0, c.rounds - 1) * c.recover) + (c.sets - 1) * c.setBreak;
  return Math.round(secs / 60);
}

interface Props {
  t: Theme;
  plans: Plan[];
  onSavePlan: (plan: Plan) => void;
  onDeletePlan: (id: string) => void;
  onStartDay: (day: WorkoutDay) => void;
}

export default function PlansScreen({ t, plans, onSavePlan, onDeletePlan, onStartDay }: Props) {
  const dayColor = (type: DayType) => type === "hiit" ? t.effortColor : DAY_TYPE_META[type].color;

  const [view, setView] = useState<View>("list");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editingPlan, setEditingPlan] = useState<Omit<Plan, "id"> | null>(null);
  const [editDayIdx, setEditDayIdx] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function startCreate() {
    setEditingPlan({ name: "", description: "", days: [] });
    setView("create");
    setTimeout(() => nameRef.current?.focus(), 80);
  }

  function openDetail(plan: Plan) {
    setSelectedPlan(plan);
    setView("detail");
  }

  function addDay() {
    if (!editingPlan) return;
    const newDay: WorkoutDay = { day: editingPlan.days.length + 1, type: "hiit", config: defaultConfig("hiit"), label: "" };
    setEditingPlan({ ...editingPlan, days: [...editingPlan.days, newDay] });
  }

  function updateDay(idx: number, patch: Partial<WorkoutDay>) {
    if (!editingPlan) return;
    const days = editingPlan.days.map((d, i) => {
      if (i !== idx) return d;
      const updated = { ...d, ...patch };
      if (patch.type && patch.type !== d.type) updated.config = defaultConfig(patch.type as DayType);
      return updated;
    });
    setEditingPlan({ ...editingPlan, days });
  }

  function removeDay(idx: number) {
    if (!editingPlan) return;
    const days = editingPlan.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }));
    setEditingPlan({ ...editingPlan, days });
    if (editDayIdx === idx) setEditDayIdx(null);
  }

  function savePlan() {
    if (!editingPlan || !editingPlan.name.trim()) return;
    onSavePlan({ id: Date.now().toString(), ...editingPlan });
    setEditingPlan(null);
    setView("list");
  }

  function shareLink(plan: Plan) {
    const payload = btoa(JSON.stringify(plan));
    const url = `${window.location.origin}${window.location.pathname}?plan=${payload}`;
    if (navigator.share) {
      navigator.share({ title: plan.name, text: `Follow my "${plan.name}" plan on Pulsar`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  }

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div style={{ width: "100%", padding: "8px 24px 24px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>Your plans</span>
          <button onClick={startCreate}
            style={{ height: 32, paddingInline: 14, borderRadius: 10, background: t.accent, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: t.accentFg, fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            <Plus size={13} />New plan
          </button>
        </div>

        <AnimatePresence mode="wait">
          {plans.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "52px 0", gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 17, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={22} color={t.muted} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>No plans yet</div>
                <div style={{ fontSize: 12, color: t.muted }}>Create a structured workout program to follow.</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {plans.map((plan, pi) => {
                const workDays = plan.days.filter(d => d.type !== "rest").length;
                const restDays = plan.days.filter(d => d.type === "rest").length;
                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.04 }}
                    style={{ background: t.card, borderRadius: 18, padding: "15px", border: `1px solid ${t.hairline}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>{plan.name}</div>
                        {plan.description && (
                          <div style={{ fontSize: 11, color: t.muted, marginBottom: 8 }}>{plan.description}</div>
                        )}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: t.muted }}>{plan.days.length} days</span>
                          {workDays > 0 && <span style={{ fontSize: 11, color: t.muted }}>{workDays} workouts</span>}
                          {restDays > 0 && <span style={{ fontSize: 11, color: t.muted }}>{restDays} rest</span>}
                        </div>
                        {/* Day type pills */}
                        <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                          {plan.days.map((d, di) => {
                            const meta = DAY_TYPE_META[d.type];
                            const Icon = meta.icon;
                            return (
                              <div key={di} style={{ width: 28, height: 28, borderRadius: 8, background: `${dayColor(d.type)}18`, border: `1px solid ${dayColor(d.type)}30`, display: "flex", alignItems: "center", justifyContent: "center" }} title={`Day ${d.day}: ${meta.label}${d.label ? ` — ${d.label}` : ""}`}>
                                <Icon size={13} color={dayColor(d.type)} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
                        <button onClick={() => shareLink(plan)}
                          style={{ width: 30, height: 30, borderRadius: 9, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ChevronRight size={14} color={t.muted} />
                        </button>
                        <button onClick={() => onDeletePlan(plan.id)}
                          style={{ width: 30, height: 30, borderRadius: 9, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={13} color={t.muted} />
                        </button>
                        <button onClick={() => openDetail(plan)}
                          style={{ height: 30, paddingInline: 10, borderRadius: 9, background: `${t.accent}20`, border: `1px solid ${t.accent}30`, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: t.accent, fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                          View
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

  // ── Detail view ────────────────────────────────────────────────────────────
  if (view === "detail" && selectedPlan) {
    return (
      <div style={{ width: "100%", padding: "8px 24px 24px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button onClick={() => setView("list")} aria-label="Back to plans"
            style={{ width: 32, height: 32, borderRadius: 10, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={16} color={t.muted} aria-hidden="true" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{selectedPlan.name}</div>
            {selectedPlan.description && <div style={{ fontSize: 11, color: t.muted }}>{selectedPlan.description}</div>}
          </div>
          <button onClick={() => shareLink(selectedPlan)}
            style={{ height: 32, paddingInline: 12, borderRadius: 10, background: `${t.accent}18`, border: `1px solid ${t.accent}28`, cursor: "pointer", color: t.accent, fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            Share link
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selectedPlan.days.map((day, i) => {
            const meta = DAY_TYPE_META[day.type];
            const Icon = meta.icon;
            const mins = totalMins(day);
            const isRest = day.type === "rest";
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                style={{ display: "flex", alignItems: "center", gap: 12, background: t.card, borderRadius: 16, padding: "13px 15px", border: `1px solid ${t.hairline}` }}>
                {/* Day number */}
                <div style={{ width: 34, height: 34, borderRadius: 10, background: isRest ? t.btn : `${dayColor(day.type)}18`, border: `1px solid ${isRest ? t.hairline : dayColor(day.type) + "30"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isRest ? t.muted : dayColor(day.type) }}>{day.day}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={13} color={dayColor(day.type)} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: isRest ? t.muted : t.text }}>{meta.label}</span>
                    {day.label && <span style={{ fontSize: 11, color: t.muted }}>— {day.label}</span>}
                  </div>
                  {!isRest && day.config && (
                    <div style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>
                      {day.config.effort}s effort · {day.config.rounds} rounds{mins > 0 ? ` · ~${mins}m` : ""}
                    </div>
                  )}
                </div>

                {/* Start button */}
                {!isRest && (
                  <button onClick={() => onStartDay(day)} aria-label={`Start day ${day.day}: ${meta.label}${day.label ? ` — ${day.label}` : ""}`}
                    style={{ width: 32, height: 32, borderRadius: 10, background: `${dayColor(day.type)}20`, border: `1px solid ${dayColor(day.type)}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronRight size={15} color={dayColor(day.type)} aria-hidden="true" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Create view ────────────────────────────────────────────────────────────
  if (view === "create" && editingPlan) {
    return (
      <div style={{ width: "100%", padding: "8px 24px 24px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <button onClick={() => { setView("list"); setEditingPlan(null); }} aria-label="Cancel and close"
            style={{ width: 32, height: 32, borderRadius: 10, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={15} color={t.muted} aria-hidden="true" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: t.text, flex: 1 }}>New plan</span>
          <button onClick={savePlan} disabled={!editingPlan.name.trim() || editingPlan.days.length === 0}
            style={{ height: 32, paddingInline: 14, borderRadius: 10, background: editingPlan.name.trim() && editingPlan.days.length > 0 ? t.accent : t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: editingPlan.name.trim() && editingPlan.days.length > 0 ? t.accentFg : t.muted, fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif", transition: "all 0.2s" }}>
            <Check size={13} />Save
          </button>
        </div>

        {/* Name + description */}
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="plan-name" className="sr-only">Plan name</label>
          <input
            id="plan-name"
            ref={nameRef}
            value={editingPlan.name}
            onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
            placeholder="Plan name…"
            style={{ width: "100%", boxSizing: "border-box", height: 44, borderRadius: 13, border: `1.5px solid ${t.hairline}`, background: t.card, color: t.text, fontSize: 14, fontWeight: 600, padding: "0 14px", fontFamily: "Inter, sans-serif", outline: "none" }}
          />
          <label htmlFor="plan-desc" className="sr-only">Description</label>
          <input
            id="plan-desc"
            value={editingPlan.description ?? ""}
            onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
            placeholder="Description (optional)…"
            style={{ width: "100%", boxSizing: "border-box", height: 38, borderRadius: 11, border: `1px solid ${t.hairline}`, background: t.card, color: t.muted, fontSize: 12, padding: "0 14px", fontFamily: "Inter, sans-serif", outline: "none", marginTop: 8 }}
          />
        </div>

        {/* Day list */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 8 }}>DAYS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <AnimatePresence>
            {editingPlan.days.map((day, idx) => {
              const meta = DAY_TYPE_META[day.type];
              const isExpanded = editDayIdx === idx;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ background: t.card, borderRadius: 14, border: `1px solid ${t.hairline}`, overflow: "hidden" }}>
                  {/* Row header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${dayColor(day.type)}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: dayColor(day.type) }}>{day.day}</span>
                    </div>

                    {/* Type selector */}
                    <div style={{ display: "flex", gap: 4, flex: 1 }}>
                      {(["hiit","tabata","sprint","rest"] as DayType[]).map(type => {
                        const m = DAY_TYPE_META[type];
                        const active = day.type === type;
                        return (
                          <button key={type} onClick={() => updateDay(idx, { type })}
                            style={{ flex: 1, height: 26, borderRadius: 7, border: `1px solid ${active ? dayColor(type) + "50" : t.hairline}`, cursor: "pointer", background: active ? `${dayColor(type)}18` : "transparent", color: active ? dayColor(type) : t.muted, fontSize: 10, fontWeight: active ? 700 : 500, fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}>
                            {m.label}
                          </button>
                        );
                      })}
                    </div>

                    <button onClick={() => setEditDayIdx(isExpanded ? null : idx)}
                      aria-label={isExpanded ? `Collapse day ${day.day} settings` : `Edit day ${day.day} settings`}
                      aria-expanded={isExpanded}
                      style={{ width: 26, height: 26, borderRadius: 7, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Edit2 size={11} color={t.muted} aria-hidden="true" />
                    </button>
                    <button onClick={() => removeDay(idx)} aria-label={`Remove day ${day.day}`}
                      style={{ width: 26, height: 26, borderRadius: 7, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={11} color={t.muted} aria-hidden="true" />
                    </button>
                  </div>

                  {/* Expanded config */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden", borderTop: `1px solid ${t.hairline}`, padding: "12px 13px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <label htmlFor={`day-label-${idx}`} className="sr-only">Day {day.day} label</label>
                        <input
                          id={`day-label-${idx}`}
                          value={day.label ?? ""}
                          onChange={e => updateDay(idx, { label: e.target.value })}
                          placeholder={`Label (e.g. "Upper body")…`}
                          style={{ width: "100%", boxSizing: "border-box", height: 36, borderRadius: 9, border: `1px solid ${t.hairline}`, background: t.btn, color: t.text, fontSize: 12, padding: "0 11px", fontFamily: "Inter, sans-serif", outline: "none" }}
                        />
                        {day.type !== "rest" && day.config && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                            {[
                              { label: "Effort", field: "effort" as keyof WorkoutConfig, step: 5 },
                              { label: "Recover", field: "recover" as keyof WorkoutConfig, step: 5 },
                              { label: "Rounds", field: "rounds" as keyof WorkoutConfig, step: 1 },
                            ].map(({ label, field, step }) => (
                              <div key={field} style={{ background: t.btn, borderRadius: 9, padding: "8px 8px" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: t.muted, letterSpacing: "0.08em", marginBottom: 4 }}>{label.toUpperCase()}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <button onClick={() => updateDay(idx, { config: { ...day.config!, [field]: Math.max(1, (day.config![field] as number) - step) } })}
                                    style={{ width: 20, height: 20, borderRadius: 5, background: t.card, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={10} color={t.muted} /></button>
                                  <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontWeight: 800, color: t.text }}>{day.config![field] as number}</span>
                                  <button onClick={() => updateDay(idx, { config: { ...day.config!, [field]: (day.config![field] as number) + step } })}
                                    style={{ width: 20, height: 20, borderRadius: 5, background: t.card, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={10} color={t.muted} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button onClick={addDay}
          style={{ width: "100%", height: 44, borderRadius: 14, border: `1.5px dashed ${t.hairline}`, cursor: "pointer", background: "transparent", color: t.muted, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Inter, sans-serif" }}>
          <Plus size={15} />Add day
        </button>
      </div>
    );
  }

  return null;
}
