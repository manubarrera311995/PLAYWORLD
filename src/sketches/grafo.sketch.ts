import type p5 from "p5";
import { get, type Readable } from "svelte/store";
import type { Paleta } from "../datos/tipos";
import type { Sketch } from "./p5Isla";
import type { HiloGrafo, NodoGrafo } from "../escenas/colectiva/layout";
import { almas } from "../almas/almas";

export type GrafoParams = {
  nodos: NodoGrafo[];
  hilos: HiloGrafo[];
  filtro: string | null;
  foco: string | null;
  onrastro?: (id: string) => void;
};

export const grafoSketch: Sketch<GrafoParams> = (p: p5, params, _paleta: Readable<Paleta>) => {
  let hit: ((ev: PointerEvent) => void) | null = null;

  const nearest = (x: number, y: number): NodoGrafo | null => {
    let best: NodoGrafo | null = null;
    let d0 = 28;
    for (const n of params.nodos) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < d0) {
        d0 = d;
        best = n;
      }
    }
    return best;
  };

  return {
    setup() {
      p.noStroke();
      const canvas = p.drawingContext.canvas as HTMLCanvasElement;
      hit = (ev: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        const n = nearest(ev.clientX - r.left, ev.clientY - r.top);
        if (n) params.onrastro?.(n.id);
      };
      canvas.addEventListener("pointerdown", hit);
    },
    draw() {
      p.clear();
      const filtro = params.filtro;
      const polaroids = params.nodos.length <= 60;
      p.strokeWeight(1);
      for (const h of params.hilos) {
        const a = params.nodos.find((n) => n.id === h.source);
        const b = params.nodos.find((n) => n.id === h.target);
        if (!a || !b) continue;
        const dim = filtro && a.almaId !== filtro && b.almaId !== filtro;
        p.stroke(255, 246, 239, dim ? 18 : 70 + h.strength * 20);
        p.line(a.x, a.y, b.x, b.y);
      }
      p.noStroke();
      for (const n of params.nodos) {
        const pal = almas[n.almaId].paleta;
        const dim = filtro && n.almaId !== filtro;
        const c = p.color(pal.c1);
        c.setAlpha(dim ? 30 : 220);
        p.fill(c);
        const r = n.tu ? 18 : polaroids ? 14 : 7;
        p.ellipse(n.x, n.y, r * 2, r * 2);
        if (n.tu) {
          p.noFill();
          p.stroke(255, 248, 241, 200);
          p.ellipse(n.x, n.y, r * 2 + 8, r * 2 + 8);
          p.noStroke();
        }
        if (params.foco === n.id) {
          p.noFill();
          p.stroke(255, 255, 255, 180);
          p.ellipse(n.x, n.y, r * 2 + 14, r * 2 + 14);
          p.noStroke();
        }
      }
      void get(_paleta);
    },
    resize() {
      /* layout se recalcula afuera */
    },
    destroy() {
      const canvas = p.drawingContext?.canvas as HTMLCanvasElement | undefined;
      if (canvas && hit) canvas.removeEventListener("pointerdown", hit);
    },
  };
};
