import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, BarChart2, Repeat2, Sun, Moon, ChevronRight, Zap } from "lucide-react";
import PhoneFrame from "./PhoneFrame";
import { saveStorePartial } from "../storage";

const steps = [
  {
    id: 0,
    icon: Activity,
    accent: "#C6F24E",
    accentLight: "#4338CA",
    title: "Feel the interval",
    description:
      "The ring beats bright when you push and dims when you recover. Read your effort state at a glance.",
    cta: "Next",
  },
  {
    id: 1,
    icon: BarChart2,
    accent: "#F5F5F7",
    accentLight: "#0A0A0B",
    title: "Effort, not just time",
    description:
      "Every session tracks heart rate, calories and effort zones — simulated in this prototype, ready to connect a real sensor.",
    cta: "Next",
  },
  {
    id: 2,
    icon: Repeat2,
    accent: "#A0A0A8",
    accentLight: "#5A5A6E",
    title: "Build your rhythm",
    description:
      "Save your go-to workouts as presets, and watch your streak grow. Consistency is the whole game.",
    cta: "Start training",
  },
];

interface OnboardingFlowProps {
  initialDark?: boolean;
  onComplete: (dark: boolean) => void;
}

export default function OnboardingFlow({ initialDark = true, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [dark, setDark] = useState(initialDark);

  const current = steps[step];
  const accent = dark ? current.accent : current.accentLight;
  const stepAccent = (s: typeof steps[0]) => (dark ? s.accent : s.accentLight);

  const bg = dark ? "#0A0A0B" : "#F0F0F5";
  const surface = dark ? "#141416" : "#FFFFFF";
  const card = dark ? "#1C1C1F" : "#EAEAEE";
  const text = dark ? "#F5F5F7" : "#0A0A0B";
  const muted = dark ? "#8A8A92" : "#5C5C6A";
  const hairline = dark ? "#26262A" : "rgba(0,0,0,0.09)";
  const shadow = dark ? "0 32px 80px rgba(0,0,0,0.85)" : "0 32px 80px rgba(0,0,0,0.12)";

  function toggleDark() {
    setDark((d) => {
      const next = !d;
      saveStorePartial({ dark: next });
      return next;
    });
  }

  function handleNext() {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else {
      saveStorePartial({ dark });
      onComplete(dark);
    }
  }
  function handleSkip() {
    saveStorePartial({ dark });
    onComplete(dark);
  }

  return (
    <PhoneFrame bg={bg} surface={surface} shadow={shadow}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 pb-0"
        style={{ paddingTop: "max(32px, env(safe-area-inset-top, 32px))" }}
      >
        <button
          onClick={toggleDark}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={dark}
          style={{
            minWidth: 44,
            minHeight: 44,
            background: card,
            border: `1px solid ${hairline}`,
            borderRadius: 999,
            padding: "8px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "background 0.3s",
          }}
        >
          {dark ? (
            <Sun size={15} color={muted} aria-hidden="true" />
          ) : (
            <Moon size={15} color={muted} aria-hidden="true" />
          )}
        </button>
        {step < steps.length - 1 && (
          <button
            onClick={handleSkip}
            aria-label="Skip onboarding"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: muted,
              letterSpacing: "0.02em",
              minHeight: 44,
              paddingInline: 8,
            }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 px-6 mt-6">
        {steps.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}: ${s.title}`}
              aria-current={isActive ? "step" : undefined}
              style={{
                flex: isActive ? 2 : 1,
                height: 44,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: isActive ? `${stepAccent(s)}18` : card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: isActive ? `1.5px solid ${stepAccent(s)}44` : "none",
                transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <StepIcon
                size={14}
                aria-hidden="true"
                color={
                  isActive
                    ? stepAccent(s)
                    : isDone
                      ? dark
                        ? "#5a5a7a"
                        : "#b0b0c8"
                      : dark
                        ? "#3e3e58"
                        : "#c8c8d8"
                }
                strokeWidth={2.5}
              />
            </button>
          );
        })}
      </div>

      {/* Illustration */}
      <div className="relative flex items-center justify-center" style={{ flex: 1, marginTop: 32 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step + "-orb"}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "absolute",
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 40%, ${accent}20 0%, transparent 70%)`,
              filter: "blur(32px)",
            }}
          />
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={step + "-icon"}
            initial={{ y: 24, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 32,
              background: `${accent}12`,
              border: `1px solid ${accent}28`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                width: 28,
                height: 28,
                borderRadius: 10,
                background: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={14} color={dark ? "#0A0A0B" : "#fff"} strokeWidth={2.5} aria-hidden="true" />
            </div>
            {(() => {
              const Icon = current.icon;
              return <Icon size={52} color={accent} strokeWidth={1.5} aria-hidden="true" />;
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Text */}
      <div style={{ padding: "0 28px 4px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step + "-text"}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
          >
            <h1
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: text,
                margin: 0,
                marginBottom: 12,
                transition: "color 0.3s",
              }}
            >
              {current.title}
            </h1>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                fontWeight: 400,
                lineHeight: 1.65,
                color: muted,
                margin: 0,
                transition: "color 0.3s",
              }}
            >
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div style={{ padding: "24px 24px max(40px, env(safe-area-inset-bottom, 40px))" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, alignItems: "center" }} aria-hidden="true">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 24 : 6,
                background: i === step ? stepAccent(s) : dark ? "#26262A" : "#DDDDE8",
              }}
              transition={{ duration: 0.3 }}
              style={{ height: 5, borderRadius: 999 }}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 18,
            border: "none",
            cursor: "pointer",
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.35s, transform 0.15s",
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: dark ? "#0A0A0B" : "#FFFFFF",
            letterSpacing: "-0.01em",
            boxShadow: `0 8px 32px ${accent}44`,
          }}
        >
          {current.cta}
          <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </PhoneFrame>
  );
}
