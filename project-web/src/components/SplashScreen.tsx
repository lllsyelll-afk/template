import { useEffect, useState, useMemo, memo } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { useTranslation } from "../../node_modules/react-i18next";

interface SplashScreenProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  type: "circle" | "square";
}

// Memoized floating particles component for performance
const FloatingParticles = memo(function FloatingParticles() {
  const shouldReduceMotion = useReducedMotion();

  const particles = useMemo<Particle[]>(() => {
    if (shouldReduceMotion) return [];

    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 4 + Math.random() * 8,
      duration: 8 + Math.random() * 6,
      delay: Math.random() * 4,
      opacity: 0.1 + Math.random() * 0.2,
      type: Math.random() > 0.7 ? "square" : "circle",
    }));
  }, [shouldReduceMotion]);

  if (shouldReduceMotion || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={
            particle.type === "circle"
              ? "absolute rounded-full bg-primary"
              : "absolute bg-primary/60"
          }
          style={{
            left: `${particle.x}%`,
            bottom: -20,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -window.innerHeight - 50],
            x: [0, Math.sin(particle.id) * 30, 0],
            rotate: particle.type === "square" ? [0, 180, 360] : 0,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
});

// Character animation for staggered text reveal
const CharacterReveal = memo(function CharacterReveal({
  text,
  className
}: {
  text: string;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  const characters = text.split("");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.05,
        delayChildren: 0.3,
      },
    },
  };

  const child: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {characters.map((char, index) => (
        <motion.span key={index} variants={child} className="inline-block">
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
});

// Word animation for tagline reveal
const WordReveal = memo(function WordReveal({
  text,
  className,
  startDelay = 0.8,
}: {
  text: string;
  className?: string;
  startDelay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: startDelay,
      },
    },
  };

  const child: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 15,
      filter: shouldReduceMotion ? "none" : "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 80,
      },
    },
  };

  return (
    <motion.div
      className={`flex flex-wrap justify-center gap-x-2 ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span key={index} variants={child} className="inline-block">
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
});

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="z-50 fixed inset-0 flex justify-center items-center bg-linear-to-br from-background to-background/80 overflow-hidden"
      >
        {/* Floating Particles Background */}
        <FloatingParticles />

        <div className="z-10 flex flex-col items-center gap-6">
          {/* Logo Container with Glow Effect */}
          <motion.div
            initial={{ scale: shouldReduceMotion ? 1 : 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0.3 : 0.8,
              delay: 0.2,
              type: "spring",
              stiffness: 100,
            }}
            className="relative"
          >
            {/* Glow Effect */}
            {!shouldReduceMotion && (
              <motion.div
                className="absolute inset-0 bg-primary/20 blur-xl rounded-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* Main Logo Container */}
            <motion.div
              className="relative flex justify-center items-center bg-primary shadow-2xl rounded-3xl w-24 h-24 text-primary-foreground"
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                    rotate: [0, 360, 0],
                  }
              }
              transition={{
                duration: 1.2,
                delay: 0.2,
                ease: "easeOut",
              }}
            >
              {/* Idle Pulse Animation */}
              <motion.div
                className="absolute inset-0 bg-primary rounded-3xl"
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                      scale: [1, 1.05, 1],
                    }
                }
                transition={{
                  duration: 1.5,
                  delay: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div dir="ltr" className="relative flex justify-center items-center bg-primary/90 rounded-2xl w-16 h-16 overflow-hidden font-bold text-primary-foreground text-2xl">
                {/* Logo Text with Character Animation */}
                <CharacterReveal text="App" />
              </motion.div>
            </motion.div>

            {/* Status Indicator Dot */}

          </motion.div>

          {/* Tagline with Word-by-Word Reveal */}
          <WordReveal
            text={t("splash_tagline")}
            className="font-medium text-foreground/60 text-sm"
            startDelay={0.6}
          />

          {/* Enhanced Progress Bar with Gradient Shimmer */}
          <motion.div
            initial={{ y: shouldReduceMotion ? 0 : 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.4,
            }}
            className="text-center"
          >
            <div className="relative bg-white/20 rounded-full w-40 h-1.5 overflow-hidden">
              {/* Progress Fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 1.5,
                  delay: 0.6,
                  ease: "easeInOut",
                }}
                className="left-0 absolute inset-y-0 bg-linear-to-r from-primary/80 via-primary to-primary/80 rounded-full"
              >
                {/* Shimmer Effect */}
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                    animate={{
                      x: [-160, 160],
                    }}
                    transition={{
                      duration: 1,
                      delay: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Loading Text with Pulse and Character Shimmer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 1,
            }}
            className="relative"
          >
            <motion.span
              className="text-foreground/70 text-sm"
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                    opacity: [0.7, 1, 0.7],
                  }
              }
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {t("splash_loading")}
            </motion.span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
