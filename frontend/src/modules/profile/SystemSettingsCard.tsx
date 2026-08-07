import type { NotificationSoundType } from "@lifeos/contracts";
import { Bell, Moon, Play, Settings as SettingsIcon, Sun, Volume2 } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { api } from "../../lib/api.js";
import { useTheme } from "../../lib/hooks/useTheme.js";
import {
  requestNotificationPermission,
  showBrowserNotification,
} from "../notifications/browser-notifications.js";
import { playNotificationSound } from "../notifications/sound-player.js";
import type { SoundPreset } from "../notifications/sound-presets.js";

export const SystemSettingsCard: FC = () => {
  const { theme, setTheme } = useTheme();

  const [soundPreset, setSoundPreset] = useState<SoundPreset>("default");
  const [browserNotifEnabled, setBrowserNotifEnabled] = useState<boolean>(() => {
    return (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    );
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getSettings();
        if (settings.theme === "light" || settings.theme === "dark") {
          setTheme(settings.theme);
        }
        if (settings.default_sound) {
          setSoundPreset(settings.default_sound as SoundPreset);
        }
      } catch (_err) {
        // Fallback silently if settings call fails
      }
    };
    loadSettings();
  }, [setTheme]);

  const handleThemeChange = async (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    try {
      await api.updateSettings({ theme: newTheme });
    } catch (_err) {
      // Ignore network errors on theme toggle
    }
  };

  const handleSoundChange = async (preset: SoundPreset) => {
    setSoundPreset(preset);
    playNotificationSound(preset);
    try {
      await api.updateSoundSettings(preset as unknown as NotificationSoundType);
      await api.updateSettings({ default_sound: preset });
    } catch (_err) {
      // Ignore network errors
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setBrowserNotifEnabled(granted);
    if (granted) {
      showBrowserNotification("LifeOS System Alerts Enabled", {
        body: "Desktop notifications have been successfully activated.",
      });
      setMessage("Desktop notifications enabled successfully!");
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage("Permission for desktop notifications was denied.");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <Card className="bg-surface border-border p-6 shadow-lg">
      <CardHeader className="mb-4">
        <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          Systemwide Settings
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {message && (
          <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl animate-fade-in">
            {message}
          </div>
        )}

        {/* Theme Settings */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-secondary">Interface Theme</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                theme === "dark"
                  ? "bg-amber-500/15 border-amber-500 text-amber-400 font-bold shadow-sm"
                  : "bg-surface-elevated border-border text-muted hover:text-primary"
              }`}
            >
              <Moon className="w-4 h-4" /> Dark Mode
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                theme === "light"
                  ? "bg-amber-500/15 border-amber-500 text-amber-400 font-bold shadow-sm"
                  : "bg-surface-elevated border-border text-muted hover:text-primary"
              }`}
            >
              <Sun className="w-4 h-4" /> Light Mode
            </button>
          </div>
        </div>

        {/* Notification Sound Preferences */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-secondary items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-400" /> Default Task Sound Preset
            </span>
            <button
              type="button"
              onClick={() => playNotificationSound(soundPreset)}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-amber-400" /> Preview
            </button>
          </label>

          <select
            value={soundPreset}
            onChange={(e) => handleSoundChange(e.target.value as SoundPreset)}
            className="w-full bg-surface/60 border border-border rounded-xl px-3.5 py-2.5 text-sm text-primary focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="default">Default Tone</option>
            <option value="chime">Subtle Chime</option>
            <option value="bell">Soft Bell</option>
            <option value="synth">Synth Pulse</option>
            <option value="energetic">Energetic Beep</option>
          </select>
        </div>

        {/* Desktop Notifications */}
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" /> Desktop Notifications
            </p>
            <p className="text-xs text-muted">Receive system reminder popups in your browser</p>
          </div>

          <Button
            type="button"
            onClick={handleEnableNotifications}
            className={`text-xs px-4 py-2 rounded-xl transition-all duration-200 ${
              browserNotifEnabled
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
            }`}
          >
            {browserNotifEnabled ? "Notifications Active" : "Enable Alerts"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
