export type Muestra = { year: number; n: number };
export type Punto = { year: number; n: number; x: number; y: number };
export type Eje = "vertical" | "horizontal";

/** El eje del año va 0–100 para coincidir con el centro de cada tick. */
export const PAD = {
  vertical: { x0: 10, x1: 44, y0: 0, y1: 100 },
  horizontal: { x0: 0, x1: 100, y0: 10, y1: 50 },
} as const;

export function muestrasDe(
  years: readonly number[],
  conteos: Readonly<Record<number, number>>,
): Muestra[] {
  return years.map((year) => ({ year, n: Math.max(0, conteos[year] ?? 0) }));
}

export function techo(muestras: readonly Muestra[]): number {
  let max = 0;
  for (const m of muestras) if (m.n > max) max = m.n;
  return max;
}

export function segmentos(muestras: readonly Muestra[]): Muestra[][] {
  const out: Muestra[][] = [];
  let cur: Muestra[] = [];
  for (const m of muestras) {
    if (m.n > 0) cur.push(m);
    else if (cur.length) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

export function puntosDe(muestras: readonly Muestra[], max: number, eje: Eje): Punto[] {
  const n = muestras.length;
  if (!n || max <= 0) return [];
  const pad = PAD[eje];
  return muestras.map((m, i) => {
    const t = m.n / max;
    if (eje === "vertical") {
      return {
        year: m.year,
        n: m.n,
        x: pad.x0 + t * (pad.x1 - pad.x0),
        y: pad.y0 + ((i + 0.5) / n) * (pad.y1 - pad.y0),
      };
    }
    return {
      year: m.year,
      n: m.n,
      x: pad.x0 + ((i + 0.5) / n) * (pad.x1 - pad.x0),
      y: pad.y1 - t * (pad.y1 - pad.y0),
    };
  });
}

function fmt(n: number): string {
  return n.toFixed(2);
}

export function pathLinea(pts: readonly Punto[]): string {
  if (!pts.length) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(p.x)} ${fmt(p.y)}`).join("");
}

export function pathArea(pts: readonly Punto[], eje: Eje): string {
  if (pts.length < 2) return "";
  const pad = PAD[eje];
  const line = pts.map((p) => `L${fmt(p.x)} ${fmt(p.y)}`).join("");
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  if (eje === "vertical") {
    return `M${fmt(pad.x0)} ${fmt(a.y)}${line}L${fmt(pad.x0)} ${fmt(b.y)}Z`;
  }
  return `M${fmt(a.x)} ${fmt(pad.y1)}${line}L${fmt(b.x)} ${fmt(pad.y1)}Z`;
}

export function formatN(n: number): string {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
}

export function etiquetaCanciones(n: number): string {
  if (n <= 0) return "";
  const num = formatN(n);
  return n === 1 ? `${num} canción` : `${num} canciones`;
}

export function curvaDe(
  years: readonly number[],
  conteos: Readonly<Record<number, number>>,
  eje: Eje,
) {
  const muestras = muestrasDe(years, conteos);
  const max = techo(muestras);
  const pts = puntosDe(muestras, max, eje);
  const byYear = new Map(pts.map((p) => [p.year, p]));
  const segs = segmentos(muestras)
    .map((seg) => seg.map((m) => byYear.get(m.year)).filter((p): p is Punto => p != null));
  return {
    max,
    puntos: pts.filter((p) => p.n > 0),
    lineas: segs.filter((s) => s.length > 1).map(pathLinea),
    areas: segs.filter((s) => s.length > 1).map((s) => pathArea(s, eje)),
  };
}

/** Años vecinos visibles en la lupa del año grande. */
export const LUPA_RADIO = 2;

export type VistaLupa = {
  y: number;
  y0: number;
  y1: number;
  h: number;
  slot: number;
  pan: number;
  x0: number;
  w: number;
};

export function añosVentana(
  years: readonly number[],
  year: number,
  radio = LUPA_RADIO,
): number[] {
  const i = years.indexOf(year);
  if (i < 0) return [];
  return years.slice(Math.max(0, i - radio), i + radio + 1);
}

/**
 * Ventana de la misma curva vertical: año ± radio, anclada al año
 * (el punto sintonizado queda al centro; al borde hay hueco, no se recentra).
 * X recorta el padding vacío; la escala n/max no cambia.
 */
export function vistaLupa(
  years: readonly number[],
  year: number,
  radio = LUPA_RADIO,
): VistaLupa {
  const pad = PAD.vertical;
  const x0 = Math.max(0, pad.x0 - 6);
  const x1 = Math.min(100, pad.x1 + 8);
  const w = x1 - x0;
  const n = years.length;
  if (n <= 0) {
    return { y: 50, y0: 0, y1: 100, h: 100, slot: 0, pan: 0, x0, w };
  }
  const found = years.indexOf(year);
  const i = found < 0 ? 0 : found;
  const slot = (pad.y1 - pad.y0) / n;
  const y = pad.y0 + (i + 0.5) * slot;
  const half = (radio + 0.5) * slot;
  const y0 = y - half;
  return { y, y0, y1: y + half, h: half * 2, slot, pan: -y0, x0, w };
}
