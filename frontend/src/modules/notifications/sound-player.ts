import { SOUND_PRESETS, type SoundPreset } from "./sound-presets.js";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playNotificationSound(preset: SoundPreset | "none" = "default"): void {
  if (preset === "none" || !preset) return;
  const config = SOUND_PRESETS[preset];
  if (!config) return;
  const ctx = getAudioContext();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = config.type;
  oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(config.volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + config.duration);
}

export function resumeAudioContext(): void {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}
