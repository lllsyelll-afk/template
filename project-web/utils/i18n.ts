import i18n from "i18next";
import { initReactI18next } from "../node_modules/react-i18next";
import LanguageDetector from "i18next-browser-languagedetector/cjs";

// Import shared translation files (main + admin keys merged)
import enTranslation from "../public/locales/en/translation.json";
import arTranslation from "../public/locales/ar/translation.json";
import frTranslation from "../public/locales/fr/translation.json";

const resources = {
  en: {
    translation: enTranslation,
  },
  ar: {
    translation: arTranslation,
  },
  fr: {
    translation: frTranslation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("language") || "en", // Default language
    fallbackLng: "en", // Fallback language if translation is missing

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    react: {
      useSuspense: false, // Disable suspense mode
    },
  });

export default i18n;
