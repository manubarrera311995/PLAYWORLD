import { almas, type AlmaId } from "../../almas/almas";
import type { AudioDNA } from "../../datos/tipos";

/**
 * El color de la boleta sale de las canciones, no del alma.
 * Dos personas con la misma alma y distintas cinco no comparten tira.
 */

const NARANJA = "#ff8c18";
const MAGENTA = "#e0086a";
const DURAZNO = "#f07810";
const MORA = "#3a1658";
const NOCHE = "#142878";
const FONDO = "#011544";

export type CancionMancha = {
  id: string;
  dna: Pick<AudioDNA, "energy" | "danceability" | "oscuridad" | "nostalgia" | "happy" | "relaxed">;
};

export type Franja = {
  peso: number;
  tinta: string;
};

export type Mancha = {
  fondo: string;
  franjas: Franja[];
  cabecera: string;
  pie: string;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function hexByte(n: number): string {
  return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
}

function canales(color: string): [number, number, number] {
  const n = Number.parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mezclar(a: string, b: string, t: number): string {
  const [ar, ag, ab] = canales(a);
  const [br, bg, bb] = canales(b);
  const u = clamp01(t);
  return `#${hexByte(ar + (br - ar) * u)}${hexByte(ag + (bg - ag) * u)}${hexByte(ab + (bb - ab) * u)}`;
}

function luma(color: string): number {
  const [r, g, b] = canales(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function tintaDe(color: string): string {
  return luma(color) > 150 ? "#1a1020" : "#fff6ef";
}

function colorDe(cancion: CancionMancha): string {
  const e = (cancion.dna.energy ?? 50) / 100;
  const d = (cancion.dna.danceability ?? 50) / 100;
  const o = (cancion.dna.oscuridad ?? 50) / 100;
  const n = (cancion.dna.nostalgia ?? 50) / 100;
  const h = (cancion.dna.happy ?? 50) / 100;
  const calido = mezclar(mezclar(NARANJA, MAGENTA, d), DURAZNO, h * 0.45);
  const hondo = mezclar(mezclar(NOCHE, MORA, n * 0.35), FONDO, o);
  const t = o * 0.72 + n * 0.38 - e * 0.55 - d * 0.22 + (hash(cancion.id) - 0.5) * 0.06;
  return mezclar(calido, hondo, clamp01(t));
}

function pesoDe(cancion: CancionMancha): number {
  const e = (cancion.dna.energy ?? 50) / 100;
  const d = (cancion.dna.danceability ?? 50) / 100;
  return (0.85 + e * 0.7 + d * 0.35) * (0.9 + hash(`${cancion.id}:peso`) * 0.25);
}

function angulo(ids: string[]): number {
  return 172 + hash(ids.join("|")) * 16;
}

const VACIA: Mancha = {
  fondo: `linear-gradient(180deg, ${MORA} 0%, ${MAGENTA} 100%)`,
  franjas: [],
  cabecera: "#fff6ef",
  pie: "#fff6ef",
};

export function manchaDe(canciones: CancionMancha[]): Mancha {
  if (!canciones.length) return VACIA;
  const colores = canciones.map(colorDe);
  const pesos = canciones.map(pesoDe);
  const total = pesos.reduce((a, b) => a + b, 0);
  let acc = 0;
  const centros = pesos.map((peso) => {
    const inicio = acc;
    acc += peso;
    return ((inicio + peso / 2) / total) * 100;
  });
  const paradas = [
    `${colores[0]} 0%`,
    ...colores.map((color, i) => `${color} ${centros[i].toFixed(1)}%`),
    `${colores[colores.length - 1]} 100%`,
  ];
  const franjas = colores.map((color, i) => ({ peso: pesos[i], tinta: tintaDe(color) }));
  return {
    fondo: `linear-gradient(${angulo(canciones.map((c) => c.id)).toFixed(1)}deg, ${paradas.join(", ")})`,
    franjas,
    cabecera: tintaDe(colores[0]),
    pie: tintaDe(colores[colores.length - 1]),
  };
}

function unicos(fila: AlmaId[]): AlmaId[] {
  const vistos = new Set<AlmaId>();
  const salida: AlmaId[] = [];
  for (const id of fila) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    salida.push(id);
  }
  return salida;
}

function lista(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? "";
  if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/** Una sola frase cuando la fila y las canciones no se encuentran. */
export function lineaFila(fila: AlmaId[] | null, principal: AlmaId): string | null {
  if (!fila?.length || fila.includes(principal)) return null;
  const dichos = lista(unicos(fila).map((id) => almas[id].nombre));
  return `En la fila dijiste ${dichos}. Tus canciones dicen ${almas[principal].nombre}.`;
}
