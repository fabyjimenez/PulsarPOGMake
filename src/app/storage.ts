import type { Plan, SessionRecord, SoundMode } from "./theme";
import type { Preset } from "./components/HiitTab";

const PREFIX = "pulsar.pog.";

export interface PulsarStore {
  dark: boolean;
  presets: Preset[];
  plans: Plan[];
  history: SessionRecord[];
  favorites: string[];
  haptics: boolean;
  soundMode: SoundMode;
}

const DEFAULTS: PulsarStore = {
  dark: true,
  presets: [],
  plans: [],
  history: [],
  favorites: [],
  haptics: true,
  soundMode: "voice",
};

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeKey(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function loadStore(): PulsarStore {
  return {
    dark: readKey("dark", DEFAULTS.dark),
    presets: readKey("presets", DEFAULTS.presets),
    plans: readKey("plans", DEFAULTS.plans),
    history: readKey("history", DEFAULTS.history),
    favorites: readKey("favorites", DEFAULTS.favorites),
    haptics: readKey("haptics", DEFAULTS.haptics),
    soundMode: readKey("soundMode", DEFAULTS.soundMode),
  };
}

export function saveStorePartial(partial: Partial<PulsarStore>) {
  (Object.keys(partial) as (keyof PulsarStore)[]).forEach((key) => {
    if (partial[key] !== undefined) writeKey(key, partial[key]);
  });
}
