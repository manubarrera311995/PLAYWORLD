import { ensureGsap } from "../../motion/gsap";
import { duracionCrossfade } from "../../motion/presets";

export type TransicionNombre =
  | "crossfade"
  | "bolsa"
  | "sintonia"
  | "estatica"
  | "lcdBoot"
  | "revelado"
  | "posarse";

/** Puntos de extensión oleada 2: vacíos, el Director usa crossfade. */
export const transicionesNombradas: Record<Exclude<TransicionNombre, "crossfade">, null> = {
  bolsa: null,
  sintonia: null,
  estatica: null,
  lcdBoot: null,
  revelado: null,
  posarse: null,
};

export function elegirTransicion(): TransicionNombre {
  return "crossfade";
}

export async function crossfade(
  saliente: HTMLElement | null,
  entrante: HTMLElement,
  reduce: boolean,
): Promise<void> {
  const gsap = ensureGsap();
  const d = duracionCrossfade(reduce);
  const targets = saliente ? [saliente, entrante] : [entrante];
  gsap.killTweensOf(targets);
  const tl = gsap.timeline();
  if (saliente) {
    tl.to(saliente, { opacity: 0, duration: d, ease: "power2.out", pointerEvents: "none" }, 0);
  }
  gsap.set(entrante, { opacity: 0, pointerEvents: "none" });
  tl.to(entrante, { opacity: 1, duration: d, ease: "power2.out", pointerEvents: "auto" }, 0);
  await tl.then();
}
