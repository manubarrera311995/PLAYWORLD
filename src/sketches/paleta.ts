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

export function aplicarPaleta(next: Paleta): void {
  const gsap = ensureGsap();
  const dur = get(reduce) ? 0.2 : 0.7;
  gsap.to(params, {
    c1: next.c1,
    c2: next.c2,
    c3: next.c3,
    granoDensidad: next.granoDensidad,
    granoVelocidad: next.granoVelocidad,
    duration: dur,
    onUpdate: () => {
      paleta.set({ ...params });
      pintarCss(params);
    },
  });
}

export function paletaReadable(): Readable<Paleta> {
  return paleta;
}
