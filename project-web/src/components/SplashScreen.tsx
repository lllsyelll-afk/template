import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 1600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="z-50 fixed inset-0 flex justify-center items-center bg-background"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-5"
        >
          {/* Minimal Brand Logo */}
          <div className="flex justify-center items-center bg-primary rounded-2xl w-20 h-20 text-primary-foreground shadow-lg shadow-primary/20">
            <span className="font-bold text-2xl tracking-tight">App</span>
          </div>

          {/* Tagline */}
          <p className="font-medium text-muted-foreground text-sm text-center">
            {t("splash_tagline")}
          </p>

          {/* Subtle Progress Indicator */}
          <div className="relative bg-muted rounded-full w-36 h-1 overflow-hidden mt-1">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

