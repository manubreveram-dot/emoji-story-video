export type SpringConfig = {
  damping: number;
  mass?: number;
  stiffness?: number;
};

export type AnimationPreset = {
  spring: SpringConfig;
  delayPerItem: number;
  overshoot: boolean;
};
