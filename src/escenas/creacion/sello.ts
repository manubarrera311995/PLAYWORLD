import { ALMA_IDS, type AlmaId } from "../../almas/almas";

export const SELLO = {
  cx: 220,
  cy: 200,
  radio: 88,
  etiqueta: 128,
  viewBox: "0 0 440 400",
} as const;

export type Vertice = { id: AlmaId; x: number; y: number };

export type Ancla = {
  id: AlmaId;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
};

function distancias(puntajes: Partial<Record<AlmaId, number>>, radio: number): number[] {
  const vals = ALMA_IDS.map((id) => Math.max(0, Math.min(100, puntajes[id] ?? 0)));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min;
  return vals.map((v) => {
    if (span < 1) return radio * 0.72;
    const t = (v - min) / span;
    return radio * (0.42 + 0.58 * t);
  });
}

export function verticesSello(
  puntajes: Partial<Record<AlmaId, number>>,
  cx = SELLO.cx,
  cy = SELLO.cy,
  radio = SELLO.radio,
): Vertice[] {
  const n = ALMA_IDS.length;
  const dist = distancias(puntajes, radio);
  return ALMA_IDS.map((id, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return {
      id,
      x: cx + Math.cos(ang) * dist[i]!,
      y: cy + Math.sin(ang) * dist[i]!,
    };
  });
}

export function puntosSello(vertices: Vertice[]): string {
  return vertices.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(" ");
}

export function anclasSello(cx = SELLO.cx, cy = SELLO.cy, radio = SELLO.etiqueta): Ancla[] {
  const n = ALMA_IDS.length;
  return ALMA_IDS.map((id, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const cos = Math.cos(ang);
    const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
    return {
      id,
      x: cx + cos * radio,
      y: cy + Math.sin(ang) * radio,
      anchor,
    };
  });
}
