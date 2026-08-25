import { motion, AnimatePresence } from "motion/react";
export type { Theme } from "../theme";

const RADIUS = 108;
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

import type { Theme } from "../theme";

interface Props {
  progress: number;       // 0–1
  accent: string;
  label: string;
  labelIcon?: React.ReactNode;
  timeNode: React.ReactNode;
  subLabel: string;
  t: Theme;
  glow?: boolean;         // bright glow for effort phase
}

export default function CircleTimer({ progress, accent, label, labelIcon, timeNode, subLabel, t, glow }: Props) {
  const dashOffset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div style={{ position: "relative", width: 260, height: 260, flexShrink: 0 }}>
      {/* Ambient glow — brighter during effort */}
      <motion.div
        animate={{
          background: `radial-gradient(circle at center, ${accent}${glow ? "30" : "18"} 0%, transparent 70%)`,
          filter: `blur(${glow ? 36 : 24}px)`,
        }}
        transition={{ duration: 0.5 }}
        style={{ position: "absolute", inset: 12, borderRadius: "50%" }}
      />

      <svg width="260" height="260" viewBox="0 0 260 260" style={{ position: "absolute", inset: 0 }}>
        {/* Track ring */}
        <circle cx="130" cy="130" r={RADIUS} fill="none" stroke={t.hairline} strokeWidth="2" />
        {/* Progress arc */}
        <g transform="rotate(-90 130 130)">
          <motion.circle
            cx="130" cy="130" r={RADIUS}
            fill="none" stroke={accent} strokeWidth={glow ? 3 : 2.5}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            animate={{
              strokeDashoffset: dashOffset,
              stroke: accent,
              filter: glow ? `drop-shadow(0 0 8px ${accent}99)` : "none",
            }}
            transition={{
              strokeDashoffset: { duration: 0.85, ease: "linear" },
              stroke: { duration: 0.45 },
              filter: { duration: 0.45 },
            }}
          />
        </g>
      </svg>

      {/* Center content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={label}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: accent, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}
          >
            {labelIcon}
            {label}
          </motion.span>
        </AnimatePresence>
        {timeNode}
        <span style={{ fontSize: 11, fontWeight: 500, color: t.muted, marginTop: 2, textAlign: "center" }}>{subLabel}</span>
      </div>
    </div>
  );
}
