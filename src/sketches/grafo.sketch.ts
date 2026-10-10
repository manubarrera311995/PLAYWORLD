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

function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function luzDe(hex: string): number {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function tinta(pal: { c1: string; c2: string }): string {
  return luzDe(pal.c1) >= luzDe(pal.c2) ? pal.c1 : pal.c2;
}

function magnitud(id: string, tu: boolean, total: number): number {
  const escala = [1, 0.82, 0.94, 0.7, 0.88][hash(id) % 5];
  const base = tu ? 16 : 12 * escala;
  if (total > 80) return base * 0.62;
  if (total > 40) return base * 0.8;
  return base;
}

function estrella(p: p5, x: number, y: number, r: number, picos: number, rot: number, alterna: boolean): void {
  p.beginShape();
  for (let i = 0; i < picos; i++) {
    const a = rot + (Math.PI * 2 * i) / picos - Math.PI / 2;
    const b = rot + (Math.PI * 2 * (i + 0.5)) / picos - Math.PI / 2;
    const largo = alterna && i % 2 === 1 ? r * 0.58 : r;
    p.vertex(x + Math.cos(a) * largo, y + Math.sin(a) * largo);
    p.vertex(x + Math.cos(b) * r * 0.1, y + Math.sin(b) * r * 0.1);
  }
  p.endShape(p.CLOSE);
}

export const grafoSketch: Sketch<GrafoParams> = (p: p5, params, _paleta: Readable<Paleta>) => {
  let hit: ((ev: PointerEvent) => void) | null = null;

  const nearest = (x: number, y: number): NodoGrafo | null => {
    let best: NodoGrafo | null = null;
    let d0 = 22;
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
      p.strokeCap(p.ROUND);
      const filtro = params.filtro;
      const porId = new Map(params.nodos.map((n) => [n.id, n]));
      const vecinos = new Set<string>();
      if (params.foco) {
        vecinos.add(params.foco);
        for (const h of params.hilos) {
          if (h.source === params.foco) vecinos.add(h.target);
          if (h.target === params.foco) vecinos.add(h.source);
        }
      }

      for (const h of params.hilos) {
        const a = porId.get(h.source);
        const b = porId.get(h.target);
        if (!a || !b) continue;
        const on = (!filtro || a.almaId === filtro) && (!filtro || b.almaId === filtro);
        const tocaFoco = params.foco != null && (a.id === params.foco || b.id === params.foco);
        const conTu = a.tu || b.tu;
        let alpha = 42;
        let peso = 0.7;
        if (!on) alpha = 8;
        else if (tocaFoco) {
          alpha = 185;
          peso = 1.15;
        } else if (conTu) {
          alpha = params.foco ? 72 : 105;
          peso = 0.9;
        } else if (params.foco) alpha = 16;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const bend = Math.min(18, len * 0.06);
        p.noFill();
        p.stroke(255, 246, 239, alpha);
        p.strokeWeight(peso);
        p.beginShape();
        p.vertex(a.x, a.y);
        p.quadraticVertex(mx - (dy / len) * bend, my + (dx / len) * bend, b.x, b.y);
        p.endShape();
      }

      p.noStroke();
      for (const n of params.nodos) {
        const pal = almas[n.almaId].paleta;
        const color = tinta(pal);
        const on = !filtro || n.almaId === filtro;
        const alpha = !on ? 36 : params.foco && !vecinos.has(n.id) ? 150 : 255;
        const r = magnitud(n.id, n.tu, params.nodos.length);
        const rot = ((hash(n.id) % 360) * Math.PI) / 180;
        const glow = p.color(color);
        glow.setAlpha(on ? (n.tu ? 100 : 70) : 18);
        p.fill(glow);
        p.circle(n.x, n.y, r * (n.tu ? 3.2 : 2.6));
        if (n.tu || params.foco === n.id) {
          p.noFill();
          p.stroke(255, 248, 241, n.tu ? 210 : 175);
          p.strokeWeight(0.8);
          p.circle(n.x, n.y, r * (n.tu ? 2.15 : 1.9));
          p.noStroke();
        }
        const cuerpo = p.color(n.tu ? "#fff8f1" : color);
        cuerpo.setAlpha(alpha);
        p.fill(cuerpo);
        estrella(p, n.x, n.y, r, n.tu ? 8 : 4, rot, n.tu);
        if (!n.tu) {
          const nucleo = p.color("#fff8f1");
          nucleo.setAlpha(alpha);
          p.fill(nucleo);
          estrella(p, n.x, n.y, r * 0.32, 4, rot, false);
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
