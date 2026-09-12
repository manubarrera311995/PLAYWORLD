import type { Sketch } from "./p5Isla";
import { granoSketch } from "./grano.sketch";
import { lcdFondoSketch } from "./lcdFondo.sketch";
import { grafoSketch } from "./grafo.sketch";
import { collageVidrioSketch } from "./collageVidrio.sketch";
import { reveladoSketch } from "./revelado.sketch";

export const registro = {
  grano: granoSketch,
  lcdFondo: lcdFondoSketch,
  grafo: grafoSketch,
  collageVidrio: collageVidrioSketch,
  revelado: reveladoSketch,
} as const;

export type SketchId = keyof typeof registro;

export function getSketch(id: SketchId): Sketch<unknown> {
  return registro[id] as Sketch<unknown>;
}
