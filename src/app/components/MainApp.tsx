import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Bookmark, BarChart2, Map, AlignJustify, Music, X, Sun, Moon, Trash2, ChevronRight, ChevronLeft, Star, Minimize2 } from "lucide-react";
import { makeTheme, SessionRecord, CompletionInfo, SoundMode, Plan, WorkoutDay } from "../theme";
import { Preset, Settings } from "./HiitTab";
import HomeScreen from "./HomeScreen";
import WorkoutsScreen from "./WorkoutsScreen";
import HistoryScreen from "./HistoryScreen";
import PlansScreen from "./PlansScreen";
import HiitTab from "./HiitTab";
import TabataTab from "./TabataTab";
import TimerTab from "./TimerTab";
import WatchTab from "./WatchTab";
import SprintTab from "./SprintTab";
import CompletionSummary from "./CompletionSummary";
import ShareModal from "./ShareModal";
import PhoneFrame from "./PhoneFrame";
import { loadStore, saveStorePartial } from "../storage";
import { useFocusTrap } from "../hooks/useFocusTrap";

type NavScreen   = "home" | "workouts" | "history" | "plans";
type WorkoutMode = "hiit" | "tabata" | "timer" | "stopwatch" | "sprint";

const MODE_LABELS: Record<WorkoutMode, string> = {
  hiit: "HIIT", tabata: "Tabata", timer: "Timer", stopwatch: "Stopwatch", sprint: "Sprint",
};

const SOUND_OPTIONS: { id: SoundMode; label: string }[] = [
  { id: "beep",   label: "Beep" },
  { id: "voice",  label: "Voice" },
  { id: "both",   label: "Both" },
  { id: "silent", label: "Silent" },
];

const NAV_ITEMS = [
  { id: "home"     as NavScreen, label: "Home",     icon: Home      },
  { id: "workouts" as NavScreen, label: "Workouts", icon: Bookmark  },
  { id: "history"  as NavScreen, label: "History",  icon: BarChart2 },
  { id: "plans"    as NavScreen, label: "Plans",    icon: Map       },
];

interface MainAppProps {
  initialDark?: boolean;
  onReplayOnboarding?: () => void;
}

export default function MainApp({ initialDark = true, onReplayOnboarding }: MainAppProps) {
  const [dark, setDark]               = useState(initialDark);
  const [navScreen, setNavScreen]     = useState<NavScreen>("home");
  const [activeMode, setActiveMode]   = useState<WorkoutMode | null>(null);
  const [presets, setPresets]         = useState<Preset[]>(() => loadStore().presets);
  const [plans, setPlans]             = useState<Plan[]>(() => loadStore().plans);
  const [history, setHistory]         = useState<SessionRecord[]>(() => loadStore().history);
  const [favorites, setFavorites]     = useState<string[]>(() => loadStore().favorites);
  const [pendingPreset, setPendingPreset] = useState<Preset | null>(null);
  const [showMenu, setShowMenu]       = useState(false);
  const [showSound, setShowSound]     = useState(false);
  const [haptics, setHaptics]         = useState(() => loadStore().haptics);
  const [soundMode, setSoundMode]     = useState<SoundMode>(() => loadStore().soundMode);
  const [completionData, setCompletionData] = useState<CompletionInfo | null>(null);
  const [showShare, setShowShare]     = useState(false);
  const [bigDisplay, setBigDisplay]   = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setShowMenu(false), []);
  const closeSound = useCallback(() => setShowSound(false), []);

  useFocusTrap(showMenu, menuRef, closeMenu);
  useFocusTrap(showSound, soundRef, closeSound);

  useEffect(() => { saveStorePartial({ dark }); }, [dark]);
  useEffect(() => { saveStorePartial({ presets }); }, [presets]);
  useEffect(() => { saveStorePartial({ plans }); }, [plans]);
  useEffect(() => { saveStorePartial({ history }); }, [history]);
  useEffect(() => { saveStorePartial({ favorites }); }, [favorites]);
  useEffect(() => { saveStorePartial({ haptics }); }, [haptics]);
  useEffect(() => { saveStorePartial({ soundMode }); }, [soundMode]);

  const t = makeTheme(dark);

  function savePreset(name: string, settings: Settings) {
    setPresets(p => [...p, { id: Date.now().toString(), name, settings }]);
  }
  function deletePreset(id: string) { setPresets(p => p.filter(x => x.id !== id)); }
  function toggleFavorite(id: string) {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  }
  function recordSession(partial: Omit<SessionRecord, "id" | "completedAt">) {
    setHistory(h => [...h, { ...partial, id: Date.now().toString(), completedAt: Date.now() }]);
  }

  function openWorkout(mode: WorkoutMode, preset?: Preset) {
    setPendingPreset(preset ?? null);
    setActiveMode(mode);
    setBigDisplay(false);
    setCompletionData(null);
    setShowShare(false);
  }

  function openFromPlanDay(day: WorkoutDay) {
    if (day.type === "rest") return;
    const mode = day.type as WorkoutMode;
    const cfg = day.config;
    if (cfg && (mode === "hiit" || mode === "sprint")) {
      const pseudoPreset: Preset = {
        id: "__plan__",
        name: day.label || mode.toUpperCase(),
        settings: { ...cfg, exerciseNames: cfg.exerciseNames ?? [] },
      };
      openWorkout(mode, pseudoPreset);
    } else {
      openWorkout(mode);
    }
  }

  function closeMode() {
    setActiveMode(null);
    setPendingPreset(null);
    setBigDisplay(false);
    setCompletionData(null);
    setShowShare(false);
  }

  function handleSessionComplete(type: WorkoutMode, label: string, info: Omit<CompletionInfo, "type" | "label">) {
    recordSession({ type, label, durationSecs: info.totalSecs, calories: info.calories, rounds: info.rounds });
    setCompletionData({ type, label, ...info });
    setBigDisplay(false);
  }

  function savePlan(plan: Plan) { setPlans(p => [...p, plan]); }
  function deletePlan(id: string) { setPlans(p => p.filter(x => x.id !== id)); }

  return (
    <PhoneFrame bg={t.bg} surface={t.surface} shadow={t.shadow}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(28px, env(safe-area-inset-top, 28px)) 24px 16px", flexShrink: 0, borderBottom: `1px solid ${activeMode ? t.hairline : "transparent"}` }}>
          {activeMode ? (
            bigDisplay ? (
              <>
                <button onClick={() => setBigDisplay(false)} aria-label="Exit big display" style={{ width: 44, height: 44, borderRadius: 12, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Minimize2 size={16} color={t.muted} aria-hidden="true" />
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Big display</span>
                <div style={{ width: 44 }} />
              </>
            ) : (
              <>
                <button onClick={closeMode} aria-label={`Close ${MODE_LABELS[activeMode]}`} style={{ width: 44, height: 44, borderRadius: 12, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <ChevronLeft size={18} color={t.muted} aria-hidden="true" />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: "-0.01em" }}>{MODE_LABELS[activeMode]}</span>
                <div style={{ width: 44 }} />
              </>
            )
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <motion.div animate={{ background: t.accent, boxShadow: `0 0 10px ${t.accent}88` }} transition={{ duration: 0.4 }} style={{ width: 9, height: 9, borderRadius: "50%" }} aria-hidden="true" />
                <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: t.text }}>PULSAR</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowSound(true); setShowMenu(false); }} aria-label="Sound and haptics settings" style={{ width: 44, height: 44, borderRadius: 10, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Music size={15} color={t.muted} aria-hidden="true" />
                </button>
                <button onClick={() => { setShowMenu(true); setShowSound(false); }} aria-label="Open settings menu" style={{ width: 44, height: 44, borderRadius: 10, background: t.card, border: `1px solid ${t.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <AlignJustify size={15} color={t.muted} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <AnimatePresence mode="wait">
            {activeMode ? (
              <motion.div key={`mode-${activeMode}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, flex: 1 }}>
                {activeMode === "hiit" && (
                  <HiitTab dark={dark} t={t} presets={presets} onSavePreset={savePreset}
                    initialSettings={pendingPreset?.settings}
                    soundMode={soundMode} bigDisplay={bigDisplay}
                    onToggleBigDisplay={() => setBigDisplay(b => !b)}
                    onSessionComplete={info => handleSessionComplete("hiit", pendingPreset?.name ?? "HIIT", info)}
                  />
                )}
                {activeMode === "tabata" && (
                  <TabataTab dark={dark} t={t} soundMode={soundMode} bigDisplay={bigDisplay}
                    onToggleBigDisplay={() => setBigDisplay(b => !b)}
                    onSessionComplete={info => handleSessionComplete("tabata", "Tabata", info)}
                  />
                )}
                {activeMode === "timer" && (
                  <TimerTab dark={dark} t={t}
                    onSessionComplete={d => handleSessionComplete("timer", "Timer", { totalSecs: d.durationSecs, calories: d.calories ?? 0 })}
                  />
                )}
                {activeMode === "stopwatch" && (
                  <WatchTab dark={dark} t={t}
                    onSessionComplete={d => handleSessionComplete("stopwatch", "Stopwatch", { totalSecs: d.durationSecs, calories: d.calories ?? 0 })}
                  />
                )}
                {activeMode === "sprint" && (
                  <SprintTab dark={dark} t={t} soundMode={soundMode} bigDisplay={bigDisplay}
                    onToggleBigDisplay={() => setBigDisplay(b => !b)}
                    onSessionComplete={info => handleSessionComplete("sprint", pendingPreset?.name ?? "Sprint", info)}
                  />
                )}
              </motion.div>
            ) : navScreen === "home" ? (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <HomeScreen t={t} dark={dark} presets={presets} sessions={history}
                  onSelectWorkout={mode => openWorkout(mode)}
                  onSelectPreset={p => openWorkout("hiit", p)}
                  onSelectTemplate={settings => openWorkout("hiit", { id: "__template__", name: "HIIT", settings })}
                />
              </motion.div>
            ) : navScreen === "workouts" ? (
              <motion.div key="workouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <WorkoutsScreen t={t} presets={presets} favorites={favorites}
                  onStartPreset={p => openWorkout("hiit", p)}
                  onDeletePreset={deletePreset}
                  onToggleFavorite={toggleFavorite}
                />
              </motion.div>
            ) : navScreen === "history" ? (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <HistoryScreen t={t} history={history} />
              </motion.div>
            ) : (
              <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <PlansScreen t={t} plans={plans}
                  onSavePlan={savePlan}
                  onDeletePlan={deletePlan}
                  onStartDay={openFromPlanDay}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom nav (hidden in mode) ── */}
        <AnimatePresence>
          {!activeMode && (
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ flexShrink: 0, padding: "8px 16px max(20px, env(safe-area-inset-bottom, 20px))", borderTop: `1px solid ${t.hairline}`, background: t.surface }}>
              <div style={{ display: "flex", background: t.card, borderRadius: 18, padding: 5, gap: 2 }} role="tablist" aria-label="Navigation">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isActive = navScreen === item.id;
                  return (
                    <button key={item.id} onClick={() => setNavScreen(item.id)}
                      role="tab"
                      aria-selected={isActive}
                      aria-label={item.label}
                      style={{ flex: 1, height: 46, borderRadius: 13, border: "none", cursor: "pointer", background: isActive ? t.btn : "transparent", fontSize: 10, fontWeight: isActive ? 700 : 500, fontFamily: "Inter, sans-serif", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: isActive ? t.text : t.muted }}>
                      <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? t.accent : t.muted} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Completion summary overlay ── */}
        <AnimatePresence>
          {completionData && !showShare && (
            <CompletionSummary info={completionData} t={t}
              onTryAgain={() => setCompletionData(null)}
              onShare={() => setShowShare(true)}
              onDone={() => { setCompletionData(null); closeMode(); }}
            />
          )}
        </AnimatePresence>

        {/* ── Share modal ── */}
        <AnimatePresence>
          {showShare && completionData && (
            <ShareModal info={completionData} t={t} onClose={() => setShowShare(false)} />
          )}
        </AnimatePresence>

        {/* ── MENU DRAWER ── */}
        <AnimatePresence>
          {showMenu && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMenu}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 30, borderRadius: "var(--frame-radius)" }} />
              <motion.div
                ref={menuRef}
                initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
                role="dialog" aria-modal="true" aria-label="Settings"
                style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(300px, 100%)", background: t.panel, borderLeft: `1px solid ${t.hairline}`, borderRadius: "0 var(--frame-radius) var(--frame-radius) 0", zIndex: 40, padding: "max(28px, env(safe-area-inset-top, 28px)) 20px max(24px, env(safe-area-inset-bottom, 24px))", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>Settings</span>
                  <button onClick={closeMenu} aria-label="Close settings" style={{ width: 36, height: 36, borderRadius: 9, background: t.card, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={14} color={t.muted} aria-hidden="true" />
                  </button>
                </div>

                {/* Appearance */}
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>Appearance</span>
                  <div style={{ marginTop: 10, background: t.card, borderRadius: 13, padding: 4, display: "flex", gap: 4, border: `1px solid ${t.hairline}` }} role="group" aria-label="Theme">
                    {([{ label: "Dark", icon: Moon, value: true }, { label: "Light", icon: Sun, value: false }] as const).map(({ label, icon: Icon, value }) => (
                      <button key={label} onClick={() => setDark(value)}
                        aria-pressed={dark === value}
                        aria-label={`${label} mode`}
                        style={{ flex: 1, height: 36, borderRadius: 9, border: "none", cursor: "pointer", background: dark === value ? t.btn : "transparent", color: dark === value ? t.text : t.muted, fontSize: 11, fontWeight: dark === value ? 700 : 500, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.2s" }}>
                        <Icon size={13} aria-hidden="true" />{label}
                      </button>
                    ))}
                  </div>
                </div>

                {onReplayOnboarding && (
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>Demo</span>
                    <button
                      onClick={() => { setShowMenu(false); onReplayOnboarding(); }}
                      aria-label="Replay onboarding"
                      style={{ marginTop: 10, width: "100%", height: 40, borderRadius: 13, border: `1px solid ${t.hairline}`, cursor: "pointer", background: t.card, color: t.text, fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                    >
                      Replay onboarding
                    </button>
                  </div>
                )}

                {/* Presets */}
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>HIIT Presets</span>
                  <div style={{ marginTop: 10, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {presets.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: t.muted, fontSize: 12 }}>No presets saved yet.</div>
                    ) : presets.map(p => (
                      <div key={p.id} style={{ background: t.card, borderRadius: 13, padding: "11px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${t.hairline}` }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: t.muted }}>{p.settings.effort}s · {p.settings.rounds}r · {p.settings.sets}s</div>
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => toggleFavorite(p.id)}
                            aria-label={favorites.includes(p.id) ? `Remove ${p.name} from favourites` : `Add ${p.name} to favourites`}
                            aria-pressed={favorites.includes(p.id)}
                            style={{ width: 36, height: 36, borderRadius: 8, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Star size={12} fill={favorites.includes(p.id) ? t.accent : "none"} color={favorites.includes(p.id) ? t.accent : t.muted} aria-hidden="true" />
                          </button>
                          <button onClick={() => { openWorkout("hiit", p); setShowMenu(false); }}
                            aria-label={`Start ${p.name}`}
                            style={{ width: 36, height: 36, borderRadius: 8, background: `${t.accent}18`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ChevronRight size={14} color={t.accent} aria-hidden="true" />
                          </button>
                          <button onClick={() => deletePreset(p.id)}
                            aria-label={`Delete ${p.name}`}
                            style={{ width: 36, height: 36, borderRadius: 8, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trash2 size={12} color={t.muted} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── SOUND SHEET ── */}
        <AnimatePresence>
          {showSound && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSound}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 30, borderRadius: "var(--frame-radius)" }} />
              <motion.div
                ref={soundRef}
                initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
                role="dialog" aria-modal="true" aria-label="Sound and haptics settings"
                style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: t.panel, borderTop: `1px solid ${t.hairline}`, borderRadius: "0 0 var(--frame-radius) var(--frame-radius)", zIndex: 40, padding: "20px 24px max(36px, env(safe-area-inset-bottom, 36px))", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>Sound & Feel</span>
                  <button onClick={closeSound} aria-label="Close sound settings" style={{ width: 36, height: 36, borderRadius: 9, background: t.card, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={14} color={t.muted} aria-hidden="true" />
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Haptics</div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Vibration on phase changes</div>
                  </div>
                  <button
                    onClick={() => setHaptics(h => !h)}
                    role="switch"
                    aria-checked={haptics}
                    aria-label="Toggle haptics"
                    style={{ width: 48, height: 28, borderRadius: 999, border: "none", cursor: "pointer", background: haptics ? t.accent : t.btn, position: "relative", transition: "background 0.25s", padding: 0 }}>
                    <motion.div animate={{ x: haptics ? 22 : 2 }} transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      style={{ position: "absolute", top: 3, width: 22, height: 22, borderRadius: "50%", background: haptics ? "#0A0A0B" : "#F5F5F7", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase", marginBottom: 10 }}>Audio cues</div>
                  <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Audio cue mode">
                    {SOUND_OPTIONS.map(opt => {
                      const active = soundMode === opt.id;
                      return (
                        <button key={opt.id} onClick={() => setSoundMode(opt.id)}
                          aria-pressed={active}
                          style={{ flex: 1, height: 42, borderRadius: 11, border: `1.5px solid ${active ? t.accent : t.hairline}`, cursor: "pointer", background: active ? `${t.accent}14` : t.card, color: active ? t.accent : t.muted, fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: "Inter, sans-serif", transition: "all 0.2s" }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

    </PhoneFrame>
  );
}
