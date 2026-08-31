import type { NotificationSoundType } from "@lifeos/contracts";
import { useCallback, useEffect, useState } from "react";
import { getDataSource } from "../../lib/dataSource.js";
import { useLocalStorage } from "../../lib/hooks/useLocalStorage.js";
import { playNotificationSound } from "./sound-player.js";
import { SOUND_PRESET_OPTIONS, type SoundPreset } from "./sound-presets.js";

const LOCAL_STORAGE_KEY = "lifeos_sound_preference";

export function SoundSettings() {
  const [selectedSound, setSelectedSound] = useState<SoundPreset>("default");
  const [cachedSound, setCachedSound] = useLocalStorage<SoundPreset | null>(
    LOCAL_STORAGE_KEY,
    null,
  );
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const fetchSoundPreference = useCallback(async () => {
    try {
      const ds = await getDataSource();
      const data = await ds.getSoundSettings();
      if (data.soundType) {
        setSelectedSound(data.soundType as SoundPreset);
        setCachedSound(data.soundType as SoundPreset);
      }
    } catch {
      if (cachedSound) {
        setSelectedSound(cachedSound);
      }
    } finally {
      setLoading(false);
    }
  }, [cachedSound, setCachedSound]);

  useEffect(() => {
    fetchSoundPreference();
  }, [fetchSoundPreference]);

  const saveSoundPreference = async (soundType: SoundPreset) => {
    setSelectedSound(soundType);
    setCachedSound(soundType);
    try {
      const ds = await getDataSource();
      await ds.updateSoundSettings(soundType as NotificationSoundType);
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
      <div className="p-6 flex items-center justify-center text-secondary">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        <span className="ml-3 text-sm">Loading sound settings...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface-elevated border border-border rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">Sound Settings</h2>
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
                ? "bg-blue-600/10 border-blue-500/40 text-primary"
                : "bg-card-hover/20 border-border text-primary hover:bg-card-hover"
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
                className="h-4 w-4 text-blue-600 border-border-subtle focus:ring-blue-500"
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
