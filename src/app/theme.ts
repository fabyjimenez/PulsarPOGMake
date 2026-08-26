export interface Theme {
  bg: string;
  surface: string;
  surface2: string;
  panel: string;
  card: string;
  btn: string;
  text: string;
  muted: string;
  border: string;
  shadow: string;
  hairline: string;
  accent: string;
  accentFg: string;
  effortColor: string;
  restColor: string;
  readyColor: string;
}

export interface SessionRecord {
  id: string;
  type: "hiit" | "tabata" | "timer" | "stopwatch" | "sprint";
  label: string;
  completedAt: number;
  durationSecs: number;
  calories?: number;
  rounds?: number;
}

export interface CompletionInfo {
  type: "hiit" | "tabata" | "timer" | "stopwatch" | "sprint";
  label: string;
  totalSecs: number;
  calories: number;
  rounds?: number;
  sets?: number;
  effortSecs?: number;
  restSecs?: number;
}

export type SoundMode = "beep" | "voice" | "both" | "silent";

export interface WorkoutConfig {
  effort: number;
  recover: number;
  rounds: number;
  sets: number;
  getReady: number;
  setBreak: number;
  exerciseNames?: string[];
}

export interface WorkoutDay {
  day: number;
  type: "hiit" | "tabata" | "sprint" | "rest";
  config?: WorkoutConfig;
  label?: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  days: WorkoutDay[];
}

export function makeTheme(dark: boolean): Theme {
  if (dark) {
    return {
      bg:          "#0A0A0B",
      surface:     "#141416",
      surface2:    "#1C1C1F",
      panel:       "#141416",
      card:        "#1C1C1F",
      btn:         "#26262A",
      text:        "#F5F5F7",
      muted:       "#8A8A92",
      border:      "#26262A",
      hairline:    "#26262A",
      shadow:      "0 32px 80px rgba(0,0,0,0.85)",
      accent:      "#C6F24E",
      accentFg:    "#0A0A0B",
      effortColor: "#C6F24E",
      restColor:   "#7DD3FC",
      readyColor:  "#A0A0A8",
    };
  }
  return {
    bg:          "#F0F0F8",
    surface:     "#FFFFFF",
    surface2:    "#F0F0F8",
    panel:       "#FFFFFF",
    card:        "#FFFFFF",
    btn:         "#E6E6F2",
    text:        "#0C0C14",
    muted:       "#52525F",
    border:      "rgba(0,0,0,0.09)",
    hairline:    "rgba(0,0,0,0.09)",
    shadow:      "0 32px 80px rgba(0,0,0,0.12)",
    accent:      "#4338CA",
    accentFg:    "#FFFFFF",
    effortColor: "#4338CA",
      restColor:   "#0369A1",
    readyColor:  "#6B7280",
  };
}
