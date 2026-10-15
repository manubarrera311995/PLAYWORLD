import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type { AlmaId } from "../../almas/almas";
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
};

function jitter(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

/** Zona libre del mapa: a la derecha del texto, igual para todas las almas. */
function campoDe(w: number, h: number): { cx: number; cy: number; radio: number } {
  const cine = w >= 1024;
  const columna = cine ? Math.min(300, w * 0.28) : Math.min(280, w * 0.52);
  const izquierda = columna + 56;
  const derecha = cine ? Math.min(280, w * 0.2) : 16;
  const arriba = cine ? 28 : 12;
  const abajo = cine ? 64 : 20;
  const ancho = Math.max(160, w - izquierda - derecha);
  const alto = Math.max(160, h - arriba - abajo);
  return {
    cx: izquierda + ancho / 2,
    cy: arriba + alto / 2,
    radio: Math.min(ancho, alto) * 0.38,
  };
}

/**
 * La distancia es el parecido de gusto. Una canción en común deja el enlace
 * largo (220 px); cada canción de más lo acorta 42 px, hasta 56 px.
 */
export function distanciaDe(compartidas: number): number {
  const n = Math.max(1, compartidas);
  return Math.max(56, 262 - n * 42);
}

/** Dos personas se unen solo si sus listas traen el mismo trackId. */
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
  const campo = campoDe(w, h);
  const hilos = hilosDe(rastros);
  const nodos: NodoGrafo[] = rastros.map((r) => {
    const ang = (jitter(r.id) + 0.5) * Math.PI * 2;
    const rad = campo.radio * (0.15 + Math.abs(jitter(`${r.id}:r`)));
    return {
      id: r.id,
      alias: r.alias,
      almaId: r.almaId,
      trackIds: r.trackIds,
      art: artDe(r.trackIds[0] ?? ""),
      tu: r.id === propioId,
      x: campo.cx + Math.cos(ang) * rad,
      y: campo.cy + Math.sin(ang) * rad,
    };
  });

  const sim = forceSimulation(nodos)
    .force("charge", forceManyBody().strength(-22))
    .force("collide", forceCollide(28))
    .force("x", forceX(campo.cx).strength(0.045))
    .force("y", forceY(campo.cy).strength(0.045))
    .force(
      "link",
      forceLink(hilos)
        .id((d) => (d as NodoGrafo).id)
        .distance((l) => distanciaDe((l as HiloGrafo).strength ?? 1))
        .strength(0.85),
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
  return { nodos, hilos };
}
