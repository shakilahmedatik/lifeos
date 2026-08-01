import { useCallback, useEffect, useState } from "react";

import { playNotificationSound } from "./sound-player.js";
import { SOUND_PRESET_OPTIONS, type SoundPreset } from "./sound-presets.js";

export function SoundSettings() {
  const [selectedSound, setSelectedSound] = useState<SoundPreset>("default");
  const [loading, setLoading] = useState(true);

  const fetchSoundPreference = useCallback(async () => {
    try {
      const response = await fetch("/api/settings/sound");
      if (response.ok) {
        const data = await response.json();
        setSelectedSound(data.soundType || "default");
      }
    } catch (error) {
      console.error("Error fetching sound preference:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSoundPreference();
  }, [fetchSoundPreference]);

  const saveSoundPreference = async (soundType: SoundPreset) => {
    try {
      await fetch("/api/settings/sound", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soundType }),
      });
      setSelectedSound(soundType);
    } catch (error) {
      console.error("Error saving sound preference:", error);
    }
  };

  const testSound = (soundType: SoundPreset) => {
    playNotificationSound(soundType);
  };

  if (loading) {
    return <div className="p-4">Loading sound settings...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Sound Settings</h2>
      <div className="space-y-3">
        {SOUND_PRESET_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center justify-between border rounded p-3">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id={option.value}
                name="soundPreset"
                value={option.value}
                checked={selectedSound === option.value}
                onChange={() => saveSoundPreference(option.value)}
                className="h-4 w-4"
              />
              <label htmlFor={option.value} className="font-medium">
                {option.label}
              </label>
            </div>
            <button
              type="button"
              onClick={() => testSound(option.value)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Test
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
