import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Moon, Settings as SettingsIcon, Sun } from "lucide-react";
import { type FC, useEffect } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { getDataSource } from "../../lib/dataSource.js";
import { useTheme } from "../../lib/hooks/useTheme.js";
import { queryKeys } from "../../lib/queryKeys.js";

export const SystemSettingsCard: FC = () => {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const ds = getDataSource();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: queryKeys.settings(),
    queryFn: () => ds.getSettings(),
  });

  useEffect(() => {
    if (settings) {
      if (settings.theme === "light" || settings.theme === "dark") {
        setTheme(settings.theme);
      }
    }
  }, [settings, setTheme]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Record<string, string>) => ds.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
    },
  });

  const handleThemeChange = async (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    updateSettingsMutation.mutate({ theme: newTheme });
  };

  return (
    <Card className="bg-card border-border p-6 shadow-sm rounded-2xl">
      <CardHeader className="mb-4">
        <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-accent" />
          System Preferences
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Theme Settings */}
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-semibold text-primary">Interface Theme</label>
            <p className="text-xs text-muted">Choose your preferred visual appearance</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-700 text-white shadow-sm ring-2 ring-blue-500/40"
                  : "bg-surface-elevated border-border text-secondary hover:text-primary hover:bg-card-hover"
              }`}
            >
              <Moon className="w-4 h-4 text-blue-400" /> Dark Mode
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                theme === "light"
                  ? "bg-white border-blue-600 text-blue-700 shadow-sm ring-2 ring-blue-500/30"
                  : "bg-surface-elevated border-border text-secondary hover:text-primary hover:bg-card-hover"
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" /> Light Mode
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
