import type { Sketch } from "./p5Isla";
import { get, type Readable } from "svelte/store";
import type { Paleta } from "../datos/tipos";
import type p5 from "p5";

/** Oleada 1: backlight plano. Scanlines = oleada 2. */
export const lcdFondoSketch: Sketch<{ color?: string }> = (p: p5, params, paleta: Readable<Paleta>) => {
  return {
    setup() {
      p.noStroke();
    },
    draw() {
      const pal = get(paleta);
      p.background(params.color ?? pal.c1);
    },
    resize() {
      /* canvas ya redimensionado */
    },
  };
};
