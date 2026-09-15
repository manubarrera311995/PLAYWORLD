export type PuntoOnda = { x: number; y: number };
export type Onda = {
  lejos: string;
  medio: string;
  cerca: string;
};

export const ONDA_VB = { w: 1200, h: 400, mid: 200 } as const;

/** Ancla visual (centro-izquierda del afiche) para alinear el año al pan. */
export const LOCK = { x: ONDA_VB.w * 0.46, y: ONDA_VB.h * 0.36 } as const;

/** Curvas largas: colas planas para que inicio y fin se disuelvan, no se corten. */
const FORMA: readonly [number, number][] = [
  [-0.78, 0.5],
  [-0.64, 0.5],
  [-0.52, 0.51],
  [-0.42, 0.56],
  [-0.22, 0.38],
  [0.0, 0.62],
  [0.2, 0.3],
  [0.42, 0.66],
  [0.62, 0.28],
  [0.82, 0.58],
  [1.02, 0.36],
  [1.22, 0.6],
  [1.44, 0.44],
  [1.56, 0.49],
  [1.7, 0.5],
  [1.86, 0.5],
];

const FOCO_X0 = 0.08;
const FOCO_X1 = 0.92;

export function fmt(n: number): string {
  return n.toFixed(2);
}

export function focoDe(year: number, years: readonly number[]): number {
  if (years.length <= 1) return 0.5;
  const i = years.indexOf(year);
  const idx = i < 0 ? 0 : i;
  return idx / (years.length - 1);
}

export function xDeFoco(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return (FOCO_X0 + u * (FOCO_X1 - FOCO_X0)) * ONDA_VB.w;
}

export function panDe(t: number): number {
  return LOCK.x - xDeFoco(t);
}

export function puntosDeOnda(): PuntoOnda[] {
  const { w, h } = ONDA_VB;
  return FORMA.map(([nx, ny]) => ({ x: nx * w, y: ny * h }));
}

export function puntosEco(pts: readonly PuntoOnda[], escalaY: number, dy: number, dx = 0): PuntoOnda[] {
  const mid = ONDA_VB.mid;
  return pts.map((p) => ({
    x: p.x + dx,
    y: mid + (p.y - mid) * escalaY + dy,
  }));
}

export function pathBezier(pts: readonly PuntoOnda[]): string {
  if (!pts.length) return "";
  if (pts.length === 1) return `M${fmt(pts[0].x)} ${fmt(pts[0].y)}`;
  let d = `M${fmt(pts[0].x)} ${fmt(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2.x)} ${fmt(p2.y)}`;
  }
  return d;
}

export function ondaDe(): Onda {
  const pts = puntosDeOnda();
  return {
    lejos: pathBezier(puntosEco(pts, -0.82, 22, 56)),
    medio: pathBezier(pts),
    cerca: pathBezier(puntosEco(pts, 0.72, -28, -40)),
  };
}
