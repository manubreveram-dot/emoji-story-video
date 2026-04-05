export const SPRING_CONFIGS = {
  bouncy: { damping: 8, mass: 0.8, stiffness: 200 },
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  gentle: { damping: 30, mass: 1.5, stiffness: 60 },
} as const;
