import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, fallback to 'system'
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Apply theme to HTML element and update resolved theme
  const applyTheme = (themeToApply: Theme) => {
    const html = document.documentElement;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    let resolved: ResolvedTheme;
    if (themeToApply === "system") {
      resolved = systemPrefersDark ? "dark" : "light";
    } else {
      resolved = themeToApply;
    }

    if (resolved === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    setResolvedTheme(resolved);
  };

  // Set theme when component mounts or theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
