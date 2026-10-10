import type { Track } from "../../datos/tipos";
import { clamp, dnaNum, hash } from "./ficha";
import type { RasgoKey } from "./lectura";

export const PLOT = { w: 640, h: 460, l: 46, r: 16, t: 16, b: 36 } as const;

const GENERO_COLOR: Record<string, string> = {
  Latin: "#e85a86",
  Electrónica: "#6aa4ff",
  Rock: "#b388ff",
  "Hip-Hop": "#f0a04b",
  Folk: "#e6c98a",
  Pop: "#f3c7d8",
  Metal: "#d6455d",
  "R&B": "#d98ad0",
  Otro: "#9aa4b8",
  "Sin género": "#a07888",
};

const NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type NotaEscala = { note: string; menor: number; mayor: number };

export function etiquetaGenero(track: Track, vacio = "Sin género"): string {
  const genre = track.genre?.split(/[,/]/)[0]?.trim();
  return genre || vacio;
}

export function colorGenero(label: string): string {
  return GENERO_COLOR[label] ?? GENERO_COLOR["Sin género"]!;
}

export function pasaFiltro(
  track: Track,
  filtro: { q: string; genres: readonly string[]; prefix: string | null },
  prefix: string,
  etiqueta: string,
): boolean {
  const q = filtro.q.trim().toLowerCase();
  if (q && !`${track.artist} ${track.track}`.toLowerCase().includes(q)) return false;
  if (filtro.genres.length && !filtro.genres.includes(etiqueta)) return false;
  if (filtro.prefix && prefix !== filtro.prefix) return false;
  return true;
}

/** Un punto dentro del plano. El temblor separa canciones con el mismo valor sin sacarlas de 0–100. */
export function puntoDe(track: Track, xKey: RasgoKey, yKey: RasgoKey): { x: number; y: number } | null {
  const vx = dnaNum(track, xKey);
  const vy = dnaNum(track, yKey);
  if (vx == null || vy == null) return null;
  const jx = ((hash(`${track.id}-x-${xKey}`) % 1000) / 1000 - 0.5) * 1.6;
  const jy = ((hash(`${track.id}-y-${yKey}`) % 1000) / 1000 - 0.5) * 1.6;
  const ancho = PLOT.w - PLOT.l - PLOT.r;
  const alto = PLOT.h - PLOT.t - PLOT.b;
  return {
    x: PLOT.l + (clamp(vx + jx) / 100) * ancho,
    y: PLOT.t + (1 - clamp(vy + jy) / 100) * alto,
  };
}

export function ejeDe(valor: number, eje: "x" | "y"): number {
  const ancho = PLOT.w - PLOT.l - PLOT.r;
  const alto = PLOT.h - PLOT.t - PLOT.b;
  if (eje === "x") return PLOT.l + (clamp(valor) / 100) * ancho;
  return PLOT.t + (1 - clamp(valor) / 100) * alto;
}

/** Diez tramos. 100 cae en el último. */
export function binsDe(nums: readonly number[]): number[] {
  const bins = Array.from({ length: 10 }, () => 0);
  for (const value of nums) {
    if (!Number.isFinite(value)) continue;
    const index = value >= 100 ? 9 : Math.max(0, Math.min(9, Math.floor(value / 10)));
    bins[index] = (bins[index] ?? 0) + 1;
  }
  return bins;
}

export function binsTempo(nums: readonly number[]): number[] {
  return binsDe(nums.map((value) => ((value - 60) / 140) * 100));
}

export function escalaDe(tracks: readonly Track[]): NotaEscala[] {
  const cuentas = new Map<string, NotaEscala>(NOTAS.map((note) => [note, { note, menor: 0, mayor: 0 }]));
  const extra: NotaEscala[] = [];
  for (const track of tracks) {
    const note = track.dna.keyNote?.trim();
    if (!note) continue;
    let fila = cuentas.get(note);
    if (!fila) {
      fila = { note, menor: 0, mayor: 0 };
      cuentas.set(note, fila);
      extra.push(fila);
    }
    if (track.dna.scale === "Mayor") fila.mayor += 1;
    else fila.menor += 1;
  }
  return [...NOTAS.map((note) => cuentas.get(note)!), ...extra];
}
