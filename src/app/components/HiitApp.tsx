import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlignJustify, Music2, X, Sun, Moon, Trash2, ChevronRight, Dumbbell, Timer, Clock, Watch } from "lucide-react";
import { Theme } from "./CircleTimer";
import HiitTab, { Preset, Settings } from "./HiitTab";
import TabataTab from "./TabataTab";
import TimerTab from "./TimerTab";
import WatchTab from "./WatchTab";

const SOUND_PACKS = ["Pulse", "Soft", "Arcade"] as const;
type SoundPack = typeof SOUND_PACKS[number];

const TABS = [
  { id: "hiit",   label: "HIIT",   icon: Dumbbell, accent: "#EF4444" },
  { id: "tabata", label: "Tabata", icon: Timer,    accent: "#EF4444" },
  { id: "timer",  label: "Timer",  icon: Clock,    accent: "#3B82F6" },
  { id: "watch",  label: "Watch",  icon: Watch,    accent: "#A855F7" },
] as const;

type TabId = typeof TABS[number]["id"];

function makeTheme(dark: boolean): Theme {
  return {
    bg:      dark ? "#0b0b12" : "#f0f0f5",
    surface: dark ? "#0b0b12" : "#ffffff",
    panel:   dark ? "#13131f" : "#f7f7fb",
    card:    dark ? "#1e1e2c" : "#ebebf2",
    btn:     dark ? "#2e2e42" : "#dddde8",
    text:    dark ? "#f4f4fa" : "#0b0b12",
    muted:   dark ? "#8c8ca3" : "#717182",
    border:  dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)",
    shadow:  dark ? "0 32px 80px rgba(0,0,0,0.7)" : "0 32px 80px rgba(0,0,0,0.13)",
  };
}

export default function HiitApp() {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("hiit");
  const [showMenu, setShowMenu] = useState(false);
  const [showSound, setShowSound] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [haptics, setHaptics] = useState(true);
  const [soundPack, setSoundPack] = useState<SoundPack>("Pulse");

  const t = makeTheme(dark);
  const currentTab = TABS.find(tab => tab.id === activeTab)!;
  const headerAccent = currentTab.accent;

  function savePreset(name: string, settings: Settings) {
    setPresets(p => [...p, { id: Date.now().toString(), name, settings }]);
  }
  function deletePreset(id: string) {
    setPresets(p => p.filter(x => x.id !== id));
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, fontFamily: "Inter, sans-serif", transition: "background 0.35s" }}>
      <div style={{ width: 412, height: 860, borderRadius: 40, background: t.surface, boxShadow: t.shadow, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", transition: "background 0.35s, box-shadow 0.35s" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 24px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.div animate={{ background: headerAccent, boxShadow: `0 0 10px ${headerAccent}` }} transition={{ duration: 0.4 }} style={{ width: 10, height: 10, borderRadius: "50%" }} />
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: t.text }}>PULSAR</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setShowSound(true); setShowMenu(false); }} style={{ width: 36, height: 36, borderRadius: 10, background: t.card, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Music2 size={16} color={t.muted} />
            </button>
            <button onClick={() => { setShowMenu(true); setShowSound(false); }} style={{ width: 36, height: 36, borderRadius: 10, background: t.card, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <AlignJustify size={16} color={t.muted} />
            </button>
          </div>
        </div>

        {/* ── Scrollable tab content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {activeTab === "hiit"   && <HiitTab   dark={dark} t={t} presets={presets} onSavePreset={savePreset} />}
              {activeTab === "tabata" && <TabataTab  dark={dark} t={t} />}
              {activeTab === "timer"  && <TimerTab   dark={dark} t={t} />}
              {activeTab === "watch"  && <WatchTab   dark={dark} t={t} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom tab bar ── */}
        <div style={{ flexShrink: 0, padding: "8px 16px 20px", borderTop: `1px solid ${t.border}`, background: t.surface, transition: "background 0.35s" }}>
          <div style={{ display: "flex", background: t.card, borderRadius: 18, padding: 5, gap: 2 }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, height: 48, borderRadius: 13, border: "none", cursor: "pointer", background: isActive ? (dark ? "#2e2e42" : "#ffffff") : "transparent", color: isActive ? t.text : t.muted, fontSize: 11, fontWeight: isActive ? 700 : 500, fontFamily: "Inter, sans-serif", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, boxShadow: isActive && !dark ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? tab.accent : t.muted} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BURGER MENU ── */}
        <AnimatePresence>
          {showMenu && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMenu(false)}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 30, borderRadius: 40 }} />
              <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
                style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 300, background: t.panel, borderLeft: `1px solid ${t.border}`, borderRadius: "0 40px 40px 0", zIndex: 40, padding: "28px 20px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>Menu</span>
                  <button onClick={() => setShowMenu(false)} style={{ width: 30, height: 30, borderRadius: 9, background: t.card, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={15} color={t.muted} />
                  </button>
                </div>

                {/* Appearance */}
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>Appearance</span>
                  <div style={{ marginTop: 12, background: t.card, borderRadius: 14, padding: 4, display: "flex", gap: 4 }}>
                    {([{ label: "Dark", icon: Moon, value: true }, { label: "Light", icon: Sun, value: false }] as const).map(({ label, icon: Icon, value }) => (
                      <button key={label} onClick={() => setDark(value)}
                        style={{ flex: 1, height: 38, borderRadius: 10, border: "none", cursor: "pointer", background: dark === value ? (dark ? "#2e2e42" : "#ffffff") : "transparent", color: dark === value ? t.text : t.muted, fontSize: 12, fontWeight: dark === value ? 700 : 500, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
                        <Icon size={14} />{label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets (HIIT only) */}
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase" }}>HIIT Presets</span>
                  <div style={{ marginTop: 12, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {presets.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "28px 0", color: t.muted, fontSize: 13, lineHeight: 1.6 }}>
                        No presets yet.<br />
                        <span style={{ fontSize: 12, opacity: 0.6 }}>Save one from the HIIT tab.</span>
                      </div>
                    ) : presets.map(p => (
                      <div key={p.id} style={{ background: t.card, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 3 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: t.muted }}>{p.settings.effort}s effort · {p.settings.rounds}r · {p.settings.sets}s</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setActiveTab("hiit"); setShowMenu(false); }}
                            style={{ width: 30, height: 30, borderRadius: 9, background: `${headerAccent}22`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ChevronRight size={15} color={headerAccent} />
                          </button>
                          <button onClick={() => deletePreset(p.id)}
                            style={{ width: 30, height: 30, borderRadius: 9, background: t.btn, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trash2 size={13} color={t.muted} />
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSound(false)}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 30, borderRadius: 40 }} />
              <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
                style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: t.panel, borderTop: `1px solid ${t.border}`, borderRadius: "0 0 40px 40px", zIndex: 40, padding: "20px 24px 36px", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>Sound & Feel</span>
                  <button onClick={() => setShowSound(false)} style={{ width: 30, height: 30, borderRadius: 9, background: t.card, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={15} color={t.muted} />
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Haptics</div>
                    <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Vibration on phase changes</div>
                  </div>
                  <button onClick={() => setHaptics(h => !h)}
                    style={{ width: 48, height: 28, borderRadius: 999, border: "none", cursor: "pointer", background: haptics ? "#3B82F6" : t.btn, position: "relative", transition: "background 0.25s", padding: 0 }}>
                    <motion.div animate={{ x: haptics ? 22 : 2 }} transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      style={{ position: "absolute", top: 3, width: 22, height: 22, borderRadius: "50%", background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, textTransform: "uppercase", marginBottom: 12 }}>Sound Pack</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {SOUND_PACKS.map(pack => {
                      const active = soundPack === pack;
                      return (
                        <button key={pack} onClick={() => setSoundPack(pack)}
                          style={{ flex: 1, height: 44, borderRadius: 12, border: `1.5px solid ${active ? "#3B82F6" : t.border}`, cursor: "pointer", background: active ? "#3B82F618" : t.card, color: active ? "#3B82F6" : t.muted, fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: "Inter, sans-serif", transition: "all 0.2s" }}>
                          {pack}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
