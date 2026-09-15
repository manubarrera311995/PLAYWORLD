import { paletaDefault } from "../datos/color";
import type { Paleta } from "../datos/tipos";
import { writable, type Readable } from "svelte/store";
import { get } from "svelte/store";
import { ensureGsap } from "../motion/gsap";
import { reduce } from "../motion/reducedMotion";

const params: Paleta = { ...paletaDefault };

export const paleta = writable<Paleta>(params);

function pintarCss(p: Paleta): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--c1", p.c1);
  root.style.setProperty("--c2", p.c2);
  root.style.setProperty("--c3", p.c3);
}

pintarCss(params);

/**
 * Ajustes opcionales de la interpolación de paleta. Ambos campos son
 * opcionales: omitirlos reproduce el comportamiento histórico
 * (`duracion = get(reduce) ? 0.2 : 0.7`, `ease = "power1.out"`, que es el ease
 * por defecto de GSAP).
 */
export type OpcionesPaleta = { duracion?: number; ease?: string };

export const EASE_PALETA_DEFAULT = "power1.out";

function duracionPorDefecto(): number {
  return get(reduce) ? 0.2 : 0.7;
}

export function aplicarPaleta(next: Paleta, opciones?: OpcionesPaleta): void {
  const gsap = ensureGsap();
  const dur = opciones?.duracion ?? duracionPorDefecto();
  const ease = opciones?.ease ?? EASE_PALETA_DEFAULT;
  gsap.to(params, {
    c1: next.c1,
    c2: next.c2,
    c3: next.c3,
    granoDensidad: next.granoDensidad,
    granoVelocidad: next.granoVelocidad,
    duration: dur,
    ease,
    // Una interpolación nueva cancela la previa y parte del valor actual de
    // `params`, sin pasar por un estado base intermedio (Req 10.8).
    overwrite: "auto",
    onUpdate: () => {
      paleta.set({ ...params });
      pintarCss(params);
    },
  });
}

export function paletaReadable(): Readable<Paleta> {
  return paleta;
}
