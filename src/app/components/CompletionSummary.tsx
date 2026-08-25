import { motion } from "motion/react";
import { CheckCircle, RotateCcw, Share2 } from "lucide-react";
import type { Theme, CompletionInfo } from "../theme";

function fmtDur(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

interface Props {
  info: CompletionInfo;
  t: Theme;
  onTryAgain: () => void;
  onDone: () => void;
  onShare?: () => void;
}

export default function CompletionSummary({ info, t, onTryAgain, onDone, onShare }: Props) {
  const effortSecs = info.effortSecs ?? info.totalSecs;
  const restSecs   = info.restSecs   ?? 0;

  const stats = [
    { label: "DURATION",  value: fmtDur(info.totalSecs) },
    { label: "CALORIES",  value: `${info.calories} kcal` },
    ...(info.rounds ? [{ label: "ROUNDS", value: info.sets && info.sets > 1 ? `${info.rounds} × ${info.sets}` : `${info.rounds}` }] : []),
    { label: "WORK TIME", value: fmtDur(effortSecs) },
    ...(restSecs > 0 ? [{ label: "REST TIME", value: fmtDur(restSecs) }] : []),
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 50, borderRadius: 40, backdropFilter: "blur(8px)" }}
      />

      {/* Card — slides up */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-heading"
        initial={{ opacity: 0, y: 64, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        style={{ position: "absolute", left: 16, right: 16, bottom: 24, background: t.card, borderRadius: 28, padding: "28px 22px 22px", zIndex: 60, border: `1px solid ${t.hairline}`, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
          <div style={{ width: 52, height: 52, borderRadius: 17, background: `${t.accent}18`, border: `1px solid ${t.accent}35`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <CheckCircle size={26} color={t.accent} strokeWidth={2} />
          </div>
          <span id="completion-heading" style={{ fontSize: 20, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>Workout complete</span>
          <span style={{ fontSize: 12, color: t.muted, marginTop: 3, fontWeight: 500 }}>{info.label}</span>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: t.btn, borderRadius: 14, padding: "11px 13px", border: `1px solid ${t.hairline}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.muted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.text, letterSpacing: "-0.01em" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onTryAgain} aria-label="Do this workout again"
            style={{ flex: 1, height: 48, borderRadius: 14, background: t.btn, border: `1px solid ${t.hairline}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: t.text, fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            <RotateCcw size={14} aria-hidden="true" />Again
          </button>
          <button onClick={onShare} aria-label="Share this workout"
            style={{ flex: 1, height: 48, borderRadius: 14, background: t.btn, border: `1px solid ${t.hairline}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: t.text, fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            <Share2 size={14} aria-hidden="true" />Share
          </button>
          <button onClick={onDone}
            style={{ flex: 2, height: 48, borderRadius: 14, background: t.accent, border: "none", cursor: "pointer", color: t.accentFg, fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            Done
          </button>
        </div>
      </motion.div>
    </>
  );
}
