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
  const velos = velosDeOnda();
  return { lejos: velos.lejos.d, medio: velos.medio.d, cerca: velos.cerca.d };
}

/** Sigmas de margen para que el blur no recorte la cola del trazo. */
const MARGEN_SIGMA = 3.5;

export type VeloOnda = {
  d: string;
  minX: number;
  minY: number;
  w: number;
  h: number;
  stroke: number;
  sigma: number;
  opacidad: number;
};

/** Caja de la curva, incluidos los controles: el bezier cabe en su envolvente. */
function extremosDe(pts: readonly PuntoOnda[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const toma = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  if (!pts.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  toma(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    toma(p1.x, p1.y);
    toma(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6);
    toma(p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6);
    toma(p2.x, p2.y);
  }
  return { minX, minY, maxX, maxY };
}

function veloDe(pts: readonly PuntoOnda[], stroke: number, sigma: number, opacidad: number): VeloOnda {
  const box = extremosDe(pts);
  const pad = stroke / 2 + sigma * MARGEN_SIGMA;
  const minX = box.minX - pad;
  const minY = box.minY - pad;
  return {
    d: pathBezier(pts),
    minX,
    minY,
    w: box.maxX - box.minX + pad * 2,
    h: box.maxY - box.minY + pad * 2,
    stroke,
    sigma,
    opacidad,
  };
}

/**
 * Cada velo en su propia caja, a 1 unidad = 1 px, para desenfocarlo una vez
 * y escalarlo después. El kernel sigue siendo el de `feGaussianBlur`.
 */
export function velosDeOnda(): { lejos: VeloOnda; medio: VeloOnda; cerca: VeloOnda } {
  const pts = puntosDeOnda();
  return {
    lejos: veloDe(puntosEco(pts, -0.82, 22, 56), 90, 8, 0.38),
    medio: veloDe(pts, 64, 8, 0.72),
    cerca: veloDe(puntosEco(pts, 0.72, -28, -40), 28, 4.5, 0.48),
  };
}

/** `50% 55%` del bbox del grupo que respira, en unidades del viewBox. */
export function origenRespiro(): { x: number; y: number } {
  const pts = puntosDeOnda();
  const a = extremosDe(pts);
  const b = extremosDe(puntosEco(pts, 0.72, -28, -40));
  const minX = Math.min(a.minX, b.minX);
  const minY = Math.min(a.minY, b.minY);
  const maxX = Math.max(a.maxX, b.maxX);
  const maxY = Math.max(a.maxY, b.maxY);
  return { x: (minX + maxX) / 2, y: minY + (maxY - minY) * 0.55 };
}
