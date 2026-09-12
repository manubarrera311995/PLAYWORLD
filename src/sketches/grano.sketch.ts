import type p5 from "p5";
import { get, type Readable } from "svelte/store";
import type { Paleta } from "../datos/tipos";
import { reduce } from "../motion/reducedMotion";
import { viewport } from "../estado/viewport";
import type { Sketch } from "./p5Isla";

type GranoParams = { fps?: number };

export const granoSketch: Sketch<GranoParams> = (p: p5, params, paleta: Readable<Paleta>) => {
  const tile = 128;
  let buffer: p5.Graphics | null = null;
  let acc = 0;
  let frozen = false;

  const fpsOf = () => {
    const modo = get(viewport).modo;
    return params.fps ?? (modo === "compacto" ? 12 : 16);
  };

  const paintTile = () => {
    if (!buffer) return;
    const pal = get(paleta);
    buffer.loadPixels();
    const dens = pal.granoDensidad;
    for (let i = 0; i < buffer.pixels.length; i += 4) {
      const n = p.random() < dens ? p.random(255) : 110 + p.random(40);
      buffer.pixels[i] = n;
      buffer.pixels[i + 1] = n;
      buffer.pixels[i + 2] = n;
      buffer.pixels[i + 3] = 255;
    }
    buffer.updatePixels();
  };

  return {
    setup() {
      buffer = p.createGraphics(tile, tile);
      buffer.pixelDensity(1);
      p.noStroke();
      paintTile();
      if (get(reduce)) {
        frozen = true;
        p.noLoop();
      }
    },
    draw() {
      if (!buffer) return;
      if (frozen) {
        p.image(buffer, 0, 0, p.width, p.height);
        return;
      }
      const fps = fpsOf();
      acc += p.deltaTime;
      const interval = 1000 / fps;
      if (acc >= interval) {
        acc = 0;
        paintTile();
      }
      p.image(buffer, 0, 0, p.width, p.height);
    },
    resize() {
      if (frozen) paintTile();
    },
    destroy() {
      buffer?.remove();
      buffer = null;
    },
  };
};
