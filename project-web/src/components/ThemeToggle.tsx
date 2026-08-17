import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

interface ThemeToggleProps {
  variant?: "icon" | "full";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") return <Sun className="w-4 h-4 text-amber-500" />;
    if (theme === "dark") return <Moon className="w-4 h-4 text-primary" />;
    return <Monitor className="w-4 h-4 text-muted-foreground" />;
  };

  const getLabel = () => {
    if (theme === "light") return t("theme_light", { defaultValue: "Light" });
    if (theme === "dark") return t("theme_dark", { defaultValue: "Dark" });
    return t("theme_system", { defaultValue: "System" });
  };

  if (variant === "icon") {
    return (
      <Button
        type="button"
        onClick={cycleTheme}
        className={`h-9! w-9! p-0! shrink-0 border border-border bg-background hover:bg-muted text-foreground shadow-none ${className ?? ""}`}
        title={`${t("profile_theme", { defaultValue: "Theme" })}: ${getLabel()}`}
        aria-label={getLabel()}
      >
        {getIcon()}
      </Button>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <span className="font-medium text-sm">
        {t("profile_theme", { defaultValue: "Theme" })}
      </span>
      <Button
        onClick={cycleTheme}
        className="flex items-center gap-2 bg-background hover:bg-muted border border-border text-foreground"
      >
        {getIcon()}
        {getLabel()}
      </Button>
    </div>
  );
}

