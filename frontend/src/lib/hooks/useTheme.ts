import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("lifeos_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    const saved = localStorage.getItem("lifeos_theme");
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      document.documentElement.classList.toggle("light", saved === "light");
    } else {
      const isLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      setThemeState(isLight ? "light" : "dark");
      document.documentElement.classList.toggle("light", isLight);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
    localStorage.setItem("lifeos_theme", newTheme);
  }, []);

  return { theme, setTheme };
}
