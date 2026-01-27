// Premium animation utilities for luxury e-commerce experience

export const easeOutCubic = [0.22, 1, 0.36, 1] as const;

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28 } as const,
};

export const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.36 },
  },
};

export const cardReveal = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.32 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.36 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.36 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.32 },
};

// Hover animations
export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
};

export const hoverGlow = {
  whileHover: {
    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
    transition: { duration: 0.24 },
  },
};

export const imageZoom = {
  whileHover: { scale: 1.04, transition: { duration: 0.28 } },
};

export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
};

export const rowHover = {
  whileHover: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    transition: { duration: 0.16 },
  },
};
