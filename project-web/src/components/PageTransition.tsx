import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, x: 20, scale: 0.95 },
  enter: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.95 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1] as const,
  duration: 0.4,
};

export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        transition={pageTransition}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
