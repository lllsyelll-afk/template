import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useTranslation } from "../node_modules/react-i18next";
import "@utils/i18n";

export type Language = "ar" | "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguageTo: (lang: Language) => void;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n: i18nInstance } = useTranslation();
  const [language, setLanguageSt] = useState<Language>(
    i18nInstance.language as Language,
  );
  const [dir, setDir] = useState<"rtl" | "ltr">(
    i18nInstance.language === "ar" ? "rtl" : "ltr",
  );

  useEffect(() => {
    const currentLang = i18nInstance.language as Language;
    setLanguageSt(currentLang);
    const newDir = currentLang === "ar" ? "rtl" : "ltr";
    setDir(newDir);
    document.documentElement.dir = newDir;
    document.documentElement.lang = currentLang;

    // Listen for language changes
    const handleLanguageChanged = (lng: string) => {
      const newLang = lng as Language;
      setLanguageSt(newLang);
      const newDir = newLang === "ar" ? "rtl" : "ltr";
      setDir(newDir);
      document.documentElement.dir = newDir;
      document.documentElement.lang = newLang;
    };

    i18nInstance.on("languageChanged", handleLanguageChanged);

    return () => {
      i18nInstance.off("languageChanged", handleLanguageChanged);
    };
  }, [i18nInstance]);

  const setLanguageTo = useCallback(
    (lang: Language) => {
      i18nInstance.changeLanguage(lang);
      localStorage.setItem("language", lang);
    },
    [i18nInstance],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguageTo, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("LanguageProvider is required");
  }
  return context;
}
