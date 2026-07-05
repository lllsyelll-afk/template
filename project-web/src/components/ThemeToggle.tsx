import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "../../node_modules/react-i18next";

export function ThemeToggle() {
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
    if (theme === "light") return <Sun className="w-4 h-4" />;
    if (theme === "dark") return <Moon className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (theme === "light") return t("theme_light", { defaultValue: "Light" });
    if (theme === "dark") return t("theme_dark", { defaultValue: "Dark" });
    return t("theme_system", { defaultValue: "System" });
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">
        {t("profile_theme", { defaultValue: "Theme" })}
      </span>
      <Button
        onClick={cycleTheme}
        className="flex items-center gap-2 bg-background text-foreground border border-border hover:bg-muted"
      >
        {getIcon()}
        {getLabel()}
      </Button>
    </div>
  );
}
