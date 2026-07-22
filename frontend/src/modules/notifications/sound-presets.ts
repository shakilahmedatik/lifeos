export type SoundPreset = "default" | "gentle" | "urgent" | "chime" | "bell";

export interface SoundConfig {
  name: string;
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

export const SOUND_PRESETS: Record<SoundPreset, SoundConfig> = {
  default: {
    name: "Default",
    frequency: 800,
    duration: 0.3,
    type: "sine",
    volume: 0.5,
  },
  gentle: {
    name: "Gentle",
    frequency: 600,
    duration: 0.5,
    type: "sine",
    volume: 0.3,
  },
  urgent: {
    name: "Urgent",
    frequency: 1000,
    duration: 0.2,
    type: "square",
    volume: 0.6,
  },
  chime: {
    name: "Chime",
    frequency: 1200,
    duration: 0.4,
    type: "triangle",
    volume: 0.4,
  },
  bell: {
    name: "Bell",
    frequency: 1500,
    duration: 0.6,
    type: "sine",
    volume: 0.5,
  },
};

export const SOUND_PRESET_OPTIONS = Object.entries(SOUND_PRESETS).map(([value, config]) => ({
  value: value as SoundPreset,
  label: config.name,
}));
