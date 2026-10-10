import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import { ALMA_IDS, type AlmaId } from "../../almas/almas";
import type { Rastro } from "../../rastros/tipos";

export type NodoGrafo = {
  id: string;
  alias: string | null;
  almaId: AlmaId;
  trackIds: string[];
  art: string | null;
  tu: boolean;
  x: number;
  y: number;
};

export type HiloGrafo = {
  source: string;
  target: string;
  trackIds: string[];
  strength: number;
};

export type LayoutGrafo = {
  nodos: NodoGrafo[];
  hilos: HiloGrafo[];
  centros: Record<AlmaId, { x: number; y: number }>;
};

function jitter(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

function centrosDe(w: number, h: number): Record<AlmaId, { x: number; y: number }> {
  const cine = w >= 1024;
  const columna = cine ? Math.min(300, w * 0.28) : Math.min(280, w * 0.52);
  const izquierda = columna + 56;
  const derecha = cine ? Math.min(280, w * 0.2) : 16;
  const arriba = cine ? 28 : 12;
  const abajo = cine ? 64 : 20;
  const ancho = Math.max(160, w - izquierda - derecha);
  const alto = Math.max(160, h - arriba - abajo);
  const cx = izquierda + ancho / 2;
  const cy = arriba + alto / 2;
  const r = Math.min(ancho, alto) * 0.36;
  const out = {} as Record<AlmaId, { x: number; y: number }>;
  ALMA_IDS.forEach((id, i) => {
    const a = (i / ALMA_IDS.length) * Math.PI * 2 - Math.PI / 2;
    out[id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  return out;
}

/** Dos personas se unen solo si sus listas traen el mismo trackId. La fuerza es cuántas canciones comparten. */
export function hilosDe(rastros: Rastro[]): HiloGrafo[] {
  const hilos: HiloGrafo[] = [];
  for (let i = 0; i < rastros.length; i++) {
    for (let j = i + 1; j < rastros.length; j++) {
      const shared = rastros[i].trackIds.filter((id) => rastros[j].trackIds.includes(id));
      if (!shared.length) continue;
      hilos.push({
        source: rastros[i].id,
        target: rastros[j].id,
        trackIds: shared,
        strength: shared.length,
      });
    }
  }
  return hilos;
}

export function layoutGrafo(
  rastros: Rastro[],
  w: number,
  h: number,
  propioId: string | null,
  artDe: (trackId: string) => string | null,
): LayoutGrafo {
  const centros = centrosDe(w, h);
  const hilos = hilosDe(rastros);
  const nodos: NodoGrafo[] = rastros.map((r) => {
    const c = centros[r.almaId];
    return {
      id: r.id,
      alias: r.alias,
      almaId: r.almaId,
      trackIds: r.trackIds,
      art: artDe(r.trackIds[0] ?? ""),
      tu: r.id === propioId,
      x: c.x + jitter(r.id) * 46,
      y: c.y + jitter(`${r.id}:y`) * 46,
    };
  });

  const sim = forceSimulation(nodos)
    .force("charge", forceManyBody().strength(-28))
    .force("collide", forceCollide(28))
    .force("x", forceX((d: NodoGrafo) => centros[d.almaId].x).strength(0.18))
    .force("y", forceY((d: NodoGrafo) => centros[d.almaId].y).strength(0.18))
    .force(
      "link",
      forceLink(hilos)
        .id((d) => (d as NodoGrafo).id)
        .distance(90)
        .strength((l) => 0.08 * ((l as HiloGrafo).strength ?? 1)),
    )
    .stop();

  for (let i = 0; i < 300; i++) sim.tick();
  // d3-force sustituye source/target por el nodo. El dibujo compara ids.
  for (const h of hilos) {
    const s = h.source as unknown as string | NodoGrafo;
    const t = h.target as unknown as string | NodoGrafo;
    h.source = typeof s === "string" ? s : s.id;
    h.target = typeof t === "string" ? t : t.id;
  }
  return { nodos, hilos, centros };
}
