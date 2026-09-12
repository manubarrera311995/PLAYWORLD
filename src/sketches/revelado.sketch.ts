import type { Sketch } from "./p5Isla";
import type p5 from "p5";

/** Enchufe oleada 2 (revelado Polaroid). */
export const reveladoSketch: Sketch<Record<string, never>> = (p: p5) => ({
  setup() {
    p.noLoop();
  },
  draw() {
    p.clear();
  },
  resize() {
    /* no-op */
  },
});
