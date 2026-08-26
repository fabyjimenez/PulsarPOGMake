import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X, Share2, Download, Camera } from "lucide-react";
import type { Theme, CompletionInfo } from "../theme";
import { useFocusTrap } from "../hooks/useFocusTrap";

function fmtDur(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec > 0 ? sec + "s" : ""}`;
  return `${sec}s`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function drawShareCard(canvas: HTMLCanvasElement, info: CompletionInfo, bgImage: HTMLImageElement | null) {
  const W = 1080, H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  try { await document.fonts.load("900 120px Inter"); } catch { /* use system font */ }

  // Background
  if (bgImage) {
    const scale = Math.max(W / bgImage.width, H / bgImage.height);
    const dw = bgImage.width * scale;
    const dh = bgImage.height * scale;
    ctx.drawImage(bgImage, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const overlay = ctx.createLinearGradient(0, 0, 0, H);
    overlay.addColorStop(0, "rgba(0,0,0,0.35)");
    overlay.addColorStop(0.45, "rgba(0,0,0,0.5)");
    overlay.addColorStop(1, "rgba(0,0,0,0.88)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = "#0A0A0B";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 320, 0, W / 2, 320, 560);
    glow.addColorStop(0, "rgba(198,242,78,0.22)");
    glow.addColorStop(1, "rgba(198,242,78,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // Wordmark — dot + text
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2 - 100, 264, 16, 0, Math.PI * 2);
  ctx.fillStyle = "#C6F24E";
  ctx.fill();
  ctx.restore();

  ctx.font = "800 56px Inter, -apple-system, sans-serif";
  ctx.fillStyle = "#F5F5F7";
  ctx.textAlign = "center";
  ctx.fillText("PULSAR", W / 2 + 22, 284);

  // Hairline
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(W / 2 - 180, 360, 360, 1);

  // Duration (hero number)
  ctx.font = "900 168px Inter, -apple-system, sans-serif";
  ctx.fillStyle = "#F5F5F7";
  ctx.textAlign = "center";
  ctx.fillText(fmtDur(info.totalSecs), W / 2, 610);

  ctx.font = "600 30px Inter, -apple-system, sans-serif";
  ctx.fillStyle = "#8A8A92";
  ctx.fillText("DURATION", W / 2, 668);

  // Workout label
  ctx.font = "700 48px Inter, -apple-system, sans-serif";
  ctx.fillStyle = "#C6F24E";
  ctx.fillText(info.label.toUpperCase(), W / 2, 780);

  // Stats
  const stats: [string, string][] = [["CALORIES", `${info.calories} kcal`]];
  if (info.rounds) stats.push(["ROUNDS", `${info.rounds}`]);
  if (info.effortSecs) stats.push(["WORK TIME", fmtDur(info.effortSecs)]);
  if (info.restSecs) stats.push(["REST TIME", fmtDur(info.restSecs)]);

  const cols = Math.min(stats.length, 2);
  const rows = Math.ceil(stats.length / cols);
  const cellW = (W - 160) / cols;
  const cellH = 180;
  const gridTop = 900;
  const gridLeft = 80;

  stats.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = gridLeft + col * cellW + cellW / 2;
    const cy = gridTop + row * (cellH + 20);

    ctx.fillStyle = "rgba(255,255,255,0.07)";
    roundRect(ctx, gridLeft + col * cellW, cy, cellW - 20, cellH, 28);
    ctx.fill();

    ctx.font = "700 26px Inter, -apple-system, sans-serif";
    ctx.fillStyle = "#8A8A92";
    ctx.textAlign = "center";
    ctx.fillText(label, cx - 10, cy + 52);

    ctx.font = "800 58px Inter, -apple-system, sans-serif";
    ctx.fillStyle = "#F5F5F7";
    ctx.fillText(value, cx - 10, cy + 128);
  });

  // Stat bottom Y
  const gridBottom = gridTop + rows * (cellH + 20) + 60;

  // Bottom date + branding
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  ctx.font = "500 30px Inter, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.textAlign = "center";
  ctx.fillText(today, W / 2, Math.max(gridBottom + 60, H - 200));

  ctx.font = "600 26px Inter, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillText("Track your intervals · Pulsar", W / 2, H - 120);

  ctx.beginPath();
  ctx.arc(W / 2, H - 68, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#C6F24E";
  ctx.fill();
}

interface Props {
  info: CompletionInfo;
  t: Theme;
  onClose: () => void;
}

export default function ShareModal({ info, t, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const handleClose = useCallback(() => onClose(), [onClose]);
  useFocusTrap(true, dialogRef, handleClose);

  useEffect(() => {
    if (canvasRef.current) drawShareCard(canvasRef.current, info, bgImage);
  }, [bgImage, info]);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = URL.createObjectURL(file);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "pulsar-workout.png";
    a.click();
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSharing(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setIsSharing(false); return; }
      const file = new File([blob], "pulsar-workout.png", { type: "image/png" });
      try {
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "My Pulsar workout" });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "pulsar-workout.png";
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch { /* user cancelled */ }
      setIsSharing(false);
    }, "image/png");
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 68, borderRadius: "var(--frame-radius)" }}
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Share your workout"
        initial={{ y: 500, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 500, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: t.surface, borderTop: `1px solid ${t.hairline}`, borderRadius: "28px 28px var(--frame-radius) var(--frame-radius)", zIndex: 69, padding: "22px 20px max(36px, env(safe-area-inset-bottom, 36px))", boxSizing: "border-box" }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: t.hairline, margin: "0 auto 18px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.text, letterSpacing: "-0.02em" }}>Share your workout</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Works with Instagram, TikTok, Snapchat, WhatsApp & more</div>
          </div>
          <button onClick={onClose} aria-label="Close share sheet" style={{ minWidth: 36, minHeight: 36, borderRadius: 9, background: t.card, border: `1px solid ${t.hairline}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} color={t.muted} aria-hidden="true" />
          </button>
        </div>

        {/* Preview card */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ position: "relative", width: 154, height: 274, borderRadius: 20, overflow: "hidden", border: `1px solid ${t.hairline}`, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
          </div>
        </div>

        {/* Add photo */}
        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 14, border: `1.5px dashed ${t.hairline}`, cursor: "pointer", color: t.muted, fontSize: 13, fontWeight: 600, marginBottom: 14, fontFamily: "Inter, sans-serif", background: t.card }}>
          <Camera size={16} color={t.muted} />
          {bgImage ? "Change photo" : "Add a selfie or photo"}
          <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} style={{ display: "none" }} />
        </label>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleDownload}
            style={{ flex: 1, height: 50, borderRadius: 14, background: t.card, border: `1px solid ${t.hairline}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: t.text, fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            <Download size={15} color={t.text} />Save
          </button>
          <button onClick={handleShare} disabled={isSharing}
            style={{ flex: 2, height: 50, borderRadius: 14, background: t.accent, border: "none", cursor: isSharing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: t.accentFg, fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif", opacity: isSharing ? 0.7 : 1, transition: "opacity 0.2s" }}>
            <Share2 size={16} color={t.accentFg} />{isSharing ? "Sharing…" : "Share"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
