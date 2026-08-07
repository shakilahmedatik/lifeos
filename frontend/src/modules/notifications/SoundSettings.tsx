import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { playNotificationSound } from "./sound-player.js";
import { SOUND_PRESET_OPTIONS, type SoundPreset } from "./sound-presets.js";

const LOCAL_STORAGE_KEY = "lifeos_sound_preference";

export function SoundSettings() {
  const [selectedSound, setSelectedSound] = useState<SoundPreset>("default");
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const fetchSoundPreference = useCallback(async () => {
    try {
      const data = await api.getSoundSettings();
      if (data.soundType) {
        setSelectedSound(data.soundType as SoundPreset);
        localStorage.setItem(LOCAL_STORAGE_KEY, data.soundType);
      }
    } catch {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY) as SoundPreset | null;
      if (cached) {
        setSelectedSound(cached);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSoundPreference();
  }, [fetchSoundPreference]);

  const saveSoundPreference = async (soundType: SoundPreset) => {
    setSelectedSound(soundType);
    localStorage.setItem(LOCAL_STORAGE_KEY, soundType);
    try {
      await api.updateSoundSettings(soundType as any);
      setSavedMessage("Sound preference saved");
      setTimeout(() => setSavedMessage(null), 2500);
    } catch {
      setSavedMessage("Saved locally");
      setTimeout(() => setSavedMessage(null), 2500);
    }
  };

  const testSound = (soundType: SoundPreset) => {
    playNotificationSound(soundType);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        <span className="ml-3 text-sm">Loading sound settings...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/40 border border-gray-700/40 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-100">Sound Settings</h2>
        {savedMessage && (
          <span className="text-xs text-emerald-400 font-medium animate-fade-in">
            {savedMessage}
          </span>
        )}
      </div>
      <div className="space-y-2.5">
        {SOUND_PRESET_OPTIONS.map((option) => (
          <div
            key={option.value}
            className={`flex items-center justify-between border rounded-xl p-3 transition-colors ${
              selectedSound === option.value
                ? "bg-blue-600/10 border-blue-500/40 text-gray-100"
                : "bg-gray-700/20 border-gray-700/40 text-gray-300 hover:bg-gray-700/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id={option.value}
                name="soundPreset"
                value={option.value}
                checked={selectedSound === option.value}
                onChange={() => saveSoundPreference(option.value)}
                className="h-4 w-4 text-blue-600 border-gray-600 focus:ring-blue-500"
              />
              <label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                {option.label}
              </label>
            </div>
            <button
              type="button"
              onClick={() => testSound(option.value)}
              className="text-xs font-semibold px-2.5 py-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              Test
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
