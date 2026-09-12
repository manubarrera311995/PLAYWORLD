export const presets = {
  crossfadeMs: { min: 200, max: 400, reduce: 200 },
  easing: "power2.out",
} as const;

export function duracionCrossfade(reduce: boolean): number {
  return reduce ? presets.crossfadeMs.reduce / 1000 : 0.32;
}
