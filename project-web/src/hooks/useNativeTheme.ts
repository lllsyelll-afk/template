import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { NavigationBar } from "@capgo/capacitor-navigation-bar";
import { useTheme } from "@/contexts/ThemeContext";

const APP_BAR_COLOR = "#0077ff";
const DARK_APP_BAR_COLOR = "#0f172a";

export function useNativeTheme() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const updateNativeBars = async () => {
      if (resolvedTheme === "dark") {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: DARK_APP_BAR_COLOR });
        await NavigationBar.setNavigationBarColor({ color: DARK_APP_BAR_COLOR });
      } else {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: APP_BAR_COLOR });
        await NavigationBar.setNavigationBarColor({ color: APP_BAR_COLOR });
      }
    };

    updateNativeBars();
  }, [resolvedTheme]);
}
